import { API_BASE } from "@/api/apiCalls";
import { theme } from "@/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { RelativePathString, router } from "expo-router";
import React, { useEffect, useState, } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface UserData {
    username: string;
    email: string;
    isVerified: boolean;
    certification_img: boolean;
    reputation: number | null;
    events: number | null;
    id: number;
}

const AccountPage: React.FC = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            await loadUserData();
        };
        initialize();
    }, []);
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadUserData();
        setTimeout(() => setIsRefreshing(false), 1000);
    };


    const handleLogout = async () => {
        Alert.alert(
            "Confirmare Deconectare",
            "Ești sigur că vrei să te deconectezi?",
            [
                {
                    text: "Anulează",
                    style: "cancel"
                },
                {
                    text: "Deconectează-te",
                    style: "destructive",
                    onPress: async () => {
                        try {

                            const keys = await AsyncStorage.getAllKeys();
                            await AsyncStorage.multiRemove(keys);
                            await AsyncStorage.clear();

                            router.replace("/(tabs)/signin" as RelativePathString);
                        } catch (error) {
                            console.error('Failed to logout:', error);
                            Alert.alert("Eroare", "Nu s-a putut efectua deconectarea. Te rugăm să încerci din nou.");
                        }
                    }
                }
            ]
        );
    };
    const loadUserData = async () => {
        try {
            const email = await AsyncStorage.getItem("email");
            const password = await AsyncStorage.getItem("password");

            if (!email || !password) {
                console.error("No credentials found in storage");
                await loadCachedUserData();
                return;
            }

            const url = `${API_BASE}/api/UserValidator/CheckLogin?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(url, {
                    method: "GET",
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result) {
                    await AsyncStorage.multiSet([
                        ['username', result.username || ''],
                        ['isVerified', result.isVerified ? 'true' : 'false'],
                        ['certification_img', result.isImage === true ? 'true' : 'false'],
                        ['reputation', result.reputation !== undefined ? result.reputation.toString() : '0'],
                        ['events', result.emCount !== undefined ? result.emCount.toString() : '0'],
                        ['id', result.id ? result.id.toString() : '0'],
                    ]);
                }
            } catch (fetchError) {
                clearTimeout(timeoutId);
                console.error("Fetch error:", fetchError);
                if (!isRefreshing) {
                    console.warn("Failed to fetch updated data, using cached data");
                }
            }

            await loadCachedUserData();

        } catch (error) {
            console.error("Error in loadUserData:", error);
            await loadCachedUserData();
        }
    };

    const loadCachedUserData = async () => {
        try {
            const username = await AsyncStorage.getItem("username");
            const email = await AsyncStorage.getItem("email");
            const isVerified = await AsyncStorage.getItem("isVerified");
            const certification_img = await AsyncStorage.getItem("certification_img");
            const reputation = await AsyncStorage.getItem("reputation");
            const events = await AsyncStorage.getItem("events");
            const id = await AsyncStorage.getItem("id");

            setUserData({
                username: username || "",
                email: email || "",
                isVerified: isVerified === 'true',
                certification_img: certification_img === 'true',
                reputation: reputation ? parseInt(reputation) : 0,
                events: events ? parseInt(events) : 0,
                id: id ? parseInt(id) : 0,
            });
        } catch (error) {
            console.error("Error loading cached user data:", error);
            Alert.alert("Eroare", "Nu s-au putut încărca datele utilizatorului");
        }
    };

    const handleDiplomaUpload = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadDiplomaPhoto(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert("Eroare", "Eroare la selectarea imaginii");
        }
    };

    const handleTakePhoto = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadDiplomaPhoto(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert("Eroare", "Eroare la fotografiere");
        }
    };

    const uploadDiplomaPhoto = async (photoUri: string) => {
        setUploadingPhoto(true);
        try {
            // Ensure we have a user id — prefer AsyncStorage (fresh) then fallback to loaded userData
            const idFromStorage = await AsyncStorage.getItem("id");
            const userId = idFromStorage ? parseInt(idFromStorage, 10) : userData?.id;

            if (!userId || userId <= 0) {
                Alert.alert("Eroare", "User ID invalid sau inexistent");
                return;
            }

            const formData = new FormData();

            // Derive a filename and mime type from the URI
            const uriParts = photoUri.split("/");
            const fileName = uriParts[uriParts.length - 1] || `diploma_${userData?.username || userId}.jpg`;
            const extMatch = /\.([a-zA-Z0-9]+)$/.exec(fileName);
            let mimeType = "image/jpeg";
            if (extMatch) {
                const ext = extMatch[1].toLowerCase();
                if (ext === "png") mimeType = "image/png";
                else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
                else if (ext === "gif") mimeType = "image/gif";
            }

            // The server expects 'CertificateFile' and 'UserId' in the multipart form
            formData.append("CertificateFile", {
                uri: photoUri,
                name: fileName,
                type: mimeType,
            } as any);
            formData.append("UserId", String(userId));

            const response = await fetch(API_BASE + "/api/UserManager/UploadCertificate", {
                method: "POST",
                body: formData,
                // Don't set Content-Type; let fetch add the multipart boundary
                headers: {
                    Accept: "application/json",
                },
            });

            // Try to parse response JSON if present
            const resJson = await response.json().catch(() => null);

            if (response.ok) {
                await AsyncStorage.setItem("certification_img", "true");
                await AsyncStorage.setItem("is_validated", "true");
                setUserData(prev => prev ? { ...prev, certification_img: true, is_validated: true } : null);
                Alert.alert("Succes!", "Diploma a fost încărcată cu succes");
                setPhotoModalVisible(false);
            } else {
                const message = (resJson && resJson.message) ? resJson.message : "Nu s-a putut încărca diploma";
                Alert.alert("Eroare", message);
            }
        } catch (error) {
            Alert.alert("Eroare", "Eroare la încărcarea diplomei");
            console.error(error);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSelectCertification = (type: string) => {
        if (type === "diploma") {
            setPhotoModalVisible(true);
        }
    };

    if (!userData) {
        return <ActivityIndicator size="large" color={theme.colors.primary} />;
    }

    return (
        <ScrollView style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    tintColor={theme.colors.primary}
                    colors={[theme.colors.primary]}
                />
            }
        >
            {/* User Info */}
            <View style={styles.userInfoSection}>
                <View style={styles.logoutContainer}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="logout" size={15} color={theme.colors.error} />
                        <Text style={styles.logoutText}>Ieșire</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.userGreeting}>Bine ai venit, {userData.username}!</Text>
                <Text style={styles.userEmail}>{userData.email}</Text>
                {userData.isVerified && (
                    <Text style={styles.certifiedBadge}>✓ Certificat</Text>
                )}
            </View>

            {(
                <View>
                    <View style={styles.certificationInfo}>
                        <View style={styles.stat_container}>
                            <View style={styles.stat_element}>
                                <MaterialIcons name="military-tech" size={80} color={theme.colors.secondary} />
                                <Text style={styles.stat_element_text}>Reputation</Text>
                            </View>
                            <View style={styles.stat_element}>
                                <Text style={styles.stat_text}>{userData.reputation}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.certificationInfo}>
                        <View style={styles.stat_container}>
                            <View style={styles.stat_element}>
                                <MaterialIcons name="event-available" size={80} color={theme.colors.primaryContainer} />
                                <Text style={styles.stat_element_text}>Events</Text>
                            </View>
                            <View style={styles.stat_element}>
                                <Text style={styles.stat_text}>{userData.reputation}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}
            {(!userData.isVerified && !userData.certification_img) && (
                <View style={styles.packagesSection}>
                    <View style={styles.certificationInfo}>
                        <Text style={styles.infoTitle}>De ce este necesară certificarea?</Text>
                        <Text style={styles.infoDescription}>
                            Pentru a crea un sistem funcțional și încredințat, utilizatorii care doresc să activeze în calitate de voluntari trebuie să ne prezinte certificatul emis de o organizație de voluntari (ex: Crucea Roșie) care atestă faptul că știu cum să acorde primul ajutor.
                        </Text>
                        <Text style={styles.infoDescription}>
                            Certificatul tău garantează că ești pregătit pentru situații de urgență și că poți ajuta în mod eficient și sigur.
                        </Text>

                        <Text style={styles.sectionTitle}>Prezintă-ți Certificatul:</Text>
                        <TouchableOpacity
                            style={styles.packageCard}
                            onPress={() => handleSelectCertification("diploma")}
                        >
                            <Text style={styles.packageTitle}>Certificat de Voluntar</Text>
                            <Text style={styles.packageDescription}>
                                Încarcă certificatul emis de o organizație recunoscută care atestă că ești pregătit pentru prim ajutor
                            </Text>
                            <View style={styles.photo_icon}>
                                <MaterialIcons name="photo-camera" size={80} color="white" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            {(!userData.isVerified && userData.certification_img) && (
                <View style={styles.packagesSection}>
                    <View style={styles.verificareInfo}>
                        <Text style={styles.infoTitle}>Certificare în curs de procesare!</Text>
                        <Text style={styles.infoDescription}>
                            Te rugăm să aștepți până când unui dintre administratorii noștri îți validează certificatul furnizat!
                        </Text>
                        <Text style={styles.infoDescription}>
                            Certificatul tău garantează că ești pregătit pentru situații de urgență și că poți ajuta în mod eficient și sigur.
                        </Text>
                        <Text style={styles.sectionTitle}>Ne vedem în curând...</Text>
                    </View>
                </View>
            )}

            <Modal visible={photoModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Încarcă Diploma</Text>

                        {uploadingPhoto ? (
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={handleTakePhoto}
                                >
                                    <Text style={styles.modalButtonText}>Fă o Fotografie</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={handleDiplomaUpload}
                                >
                                    <Text style={styles.modalButtonText}>Selectează din Galerie</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setPhotoModalVisible(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Anulează</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
    },
    logoutContainer: {
        position: 'absolute',
        right: 10,
        top: 10,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.errorContainer || 'rgba(255, 0, 0, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.error,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primaryContainer || 'rgba(0, 122, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
        minWidth: 44,
        minHeight: 44,
        marginTop: 40,
        justifyContent: 'center',
    },
    refreshText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    spinning: {
        transform: [{ rotate: '360deg' }],
    },
    stat_container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
        flexDirection: 'row',
    },
    stat_text: {
        color: theme.colors.onBackground,
        fontSize: 30,
    },
    stat_element_text: {
        color: theme.colors.onBackground,
    },
    stat_element: {
        flex: 1,
        color: theme.colors.onBackground,
        borderRadius: 12,
        justifyContent: 'center', // center on Y axis
        alignItems: 'center',     // center on X axis
    },
    photo_icon: {
        flex: 1,                 // Fill the screen
        justifyContent: 'center', // Center vertically
        alignItems: 'center',     // Center horizontally (X-axis)
    },
    userInfoSection: {
        marginBottom: 30,
        paddingBottom: 20,
    },
    userGreeting: {
        fontSize: 24,
        fontWeight: "bold",
        color: theme.colors.onBackground,
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 14,
        color: theme.colors.primary,
        marginBottom: 10,
    },
    certifiedBadge: {
        paddingTop: 20,
        fontSize: 18,
        color: theme.colors.primary,
        fontWeight: "bold",
    },
    certificationInfo: {
        backgroundColor: theme.colors.backdrop,
        borderRadius: 12,
        padding: 15,
        marginBottom: 30,
    },
    verificareInfo: {
        backgroundColor: theme.colors.inversePrimary,
        borderRadius: 12,
        padding: 15,
        marginBottom: 30,
    },
    infoTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: theme.colors.onBackground,
        marginBottom: 10,
    },
    infoDescription: {
        fontSize: 14,
        color: theme.colors.onBackground,
        lineHeight: 20,
    },
    packagesSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.inverseSurface,
        marginBottom: 15,
        marginTop: 15,
    },
    packageCard: {
        backgroundColor: theme.colors.secondary,
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
    },
    packageTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: theme.colors.onBackground,
        marginBottom: 10,
    },
    packageDescription: {
        fontSize: 14,
        color: theme.colors.onBackground,
        marginBottom: 15,
        lineHeight: 20,
    },
    packageAction: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#FFD700",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: 300,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.outline,
        marginBottom: 20,
        textAlign: "center",
    },
    modalButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        padding: 15,
        marginBottom: 12,
        alignItems: "center",
    },
    modalButtonText: {
        color: theme.colors.onBackground,
        fontSize: 16,
        fontWeight: "bold",
    },
    modalCloseButton: {
        backgroundColor: theme.colors.error,
        borderRadius: 8,
        padding: 15,
        alignItems: "center",
        marginTop: 10,
    },
    modalCloseButtonText: {
        color: theme.colors.background,
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default AccountPage;