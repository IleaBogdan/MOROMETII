import { API_BASE } from "@/api/apiCalls";
import { theme } from "@/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { RelativePathString, router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
    isAdmin: boolean | null;
}

const AccountPage: React.FC = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const isFetchingRef = useRef(false);

    useEffect(() => {
        const initialize = async () => {
            await loadCachedUserData(); // Load cached data first for instant UI
            setIsInitialized(true);
        };
        initialize();
    }, []);

    useFocusEffect(
        useCallback(() => {
            // Only fetch fresh data if initialized and not already fetching
            if (isInitialized && !isFetchingRef.current && !isRefreshing) {
                loadUserData();
            }
        }, [isInitialized, isRefreshing])
    );

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadUserData();
        setIsRefreshing(false);
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
                            setUserData(null);
                            setTimeout(() => router.replace("/(tabs)/signin" as RelativePathString), 100);
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
        if (isFetchingRef.current) {
            return;
        }

        isFetchingRef.current = true;

        try {
            const username = await AsyncStorage.getItem("username");
            const password = await AsyncStorage.getItem("password");

            if (!username || !password) {
                console.warn("No credentials found in storage");
                await loadCachedUserData();
                return;
            }

            const url = `${API_BASE}/api/UserValidator/CheckLogin?Name=${username}&Password=${password}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(url, {
                    method: "GET",
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    console.warn(`HTTP error! status: ${response.status}`);

                    if (isRefreshing) {
                        Alert.alert(
                            "Eroare de conectare",
                            "Nu s-au putut actualiza datele. Verifică conexiunea la internet.",
                            [{ text: "OK" }]
                        );
                    }

                    // Use cached data on error
                    await loadCachedUserData();
                    return;
                }

                const result = await response.json();
                if (result) {
                    console.debug('loadUserData - server result:', result);

                    const email = result?.email ?? result?.data?.email ?? '';
                    const usernameFromResult = result?.username ?? result?.data?.username ?? result?.name ?? '';
                    const isVerified = !!(result?.isVerified ?? result?.data?.isVerified);
                    const isImage = !!(result?.isImage ?? result?.data?.isImage);
                    const reputation = result?.reputation ?? result?.data?.reputation ?? 0;
                    const emCount = result?.emCount ?? result?.data?.emCount ?? 0;
                    const idFromResult = result?.id ?? result?.data?.id ?? null;
                    const isAdminFlag = !!(result?.isAdmin ?? result?.data?.isAdmin);

                    const storedId = await AsyncStorage.getItem('id');
                    const idToStore = idFromResult ? String(idFromResult) : (storedId ?? '0');

                    await AsyncStorage.multiSet([
                        ['username', usernameFromResult || ''],
                        ['isVerified', isVerified ? 'true' : 'false'],
                        ['certification_img', isImage ? 'true' : 'false'],
                        ['reputation', String(reputation)],
                        ['events', String(emCount)],
                        ['id', idToStore],
                        ['isAdmin', isAdminFlag ? 'true' : 'false'],
                        ['email', email],
                    ]);

                    await loadCachedUserData();
                } else {
                    console.warn('loadUserData - empty result from server');
                }
            } catch (fetchError: any) {
                clearTimeout(timeoutId);

                if (fetchError.name === 'AbortError') {
                    console.warn("Request timed out");
                } else {
                    console.warn("Fetch error:", fetchError.message || fetchError);
                }

                if (isRefreshing) {
                    Alert.alert(
                        "Eroare de conectare",
                        "Nu s-au putut actualiza datele. Se folosesc datele salvate local.",
                        [{ text: "OK" }]
                    );
                }

                // Fallback to cached data
                await loadCachedUserData();
            }

        } catch (error: any) {
            console.error("Error in loadUserData:", error.message || error);
            await loadCachedUserData();
        } finally {
            isFetchingRef.current = false;
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
            const isAdmin = await AsyncStorage.getItem("isAdmin");

            setUserData({
                username: username || "",
                email: email || "",
                isVerified: isVerified === 'true',
                certification_img: certification_img === 'true',
                reputation: reputation ? parseInt(reputation) : 0,
                events: events ? parseInt(events) : 0,
                id: id ? parseInt(id) : 0,
                isAdmin: isAdmin === 'true',
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
            const idFromStorage = await AsyncStorage.getItem("id");
            const userId = idFromStorage ? parseInt(idFromStorage, 10) : userData?.id;

            if (!userId || userId <= 0) {
                Alert.alert("Eroare", "User ID invalid sau inexistent");
                return;
            }

            const formData = new FormData();

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

            formData.append("CertificateFile", {
                uri: photoUri,
                name: fileName,
                type: mimeType,
            } as any);
            formData.append("UserId", String(userId));

            const response = await fetch(API_BASE + "/api/UserManager/UploadCertificate", {
                method: "POST",
                body: formData,
                headers: {
                    Accept: "application/json",
                },
            });

            const resJson = await response.json().catch(() => null);

            if (response.ok) {
                await AsyncStorage.setItem("certification_img", "true");
                handleRefresh();
                setUserData(prev => prev ? { ...prev, certification_img: true, isVerified: true } : null);
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
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
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
            {/* Profile Header Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <MaterialIcons name="account-circle" size={80} color={theme.colors.primary} />
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{userData.username}</Text>
                    <Text style={styles.profileEmail}>{userData.email}</Text>
                    {userData.isVerified && userData.certification_img && !(!userData.isVerified && userData.certification_img) && (
                        <View style={styles.certificationBadgeContainer}>
                            <MaterialIcons name="verified" size={16} color={theme.colors.background} />
                            <Text style={styles.certificationBadgeText}>Certificat verificat</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
                <View style={styles.statCard}>
                    <MaterialIcons name="star" size={24} color={theme.colors.secondary} />
                    <Text style={styles.statLabel}>Reputație</Text>
                    <Text style={styles.statValue}>{userData.reputation || 0}</Text>
                </View>
                <View style={styles.statCard}>
                    <MaterialIcons name="event-available" size={24} color={theme.colors.primary} />
                    <Text style={styles.statLabel}>Evenimente</Text>
                    <Text style={styles.statValue}>{userData.events || 0}</Text>
                </View>
            </View>

            <Text style={styles.profileEmail}>
                Reputația reprezintă totalul dificultăților tuturor urgențelor la care ai aplicat până acum. De asemenea, ținem cont și de numărul total de evenimente la care ai participat.{"\n"}
            </Text>

            {/* Certification Section */}
            {(!userData.isVerified && !userData.certification_img) && (
                <View style={styles.certificationSection}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="security" size={28} color={theme.colors.secondary} />
                        <Text style={styles.sectionTitle}>Certificare Necesară</Text>
                    </View>

                    <Text style={styles.certificationDescription}>
                        Pentru a te putea oferi voluntar, trebuie să demonstrezi că ai cunoștințele necesare de prim ajutor. Încarcă un certificat valid emis de o organizație recunoscută.
                    </Text>

                    <TouchableOpacity
                        style={styles.uploadCertButton}
                        onPress={() => handleSelectCertification("diploma")}
                    >
                        <MaterialIcons name="cloud-upload" size={24} color="white" />
                        <View style={styles.uploadButtonText}>
                            <Text style={styles.uploadButtonTitle}>Încarcă Certificat</Text>
                            <Text style={styles.uploadButtonSubtitle}>Diploma de prim ajutor</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {/* Pending Verification */}
            {(!userData.isVerified && userData.certification_img) && (
                <View style={styles.pendingSection}>
                    <View style={styles.pendingHeader}>
                        <MaterialIcons name="schedule" size={28} color={theme.colors.secondary} />
                        <Text style={styles.pendingTitle}>Verificare în curs</Text>
                    </View>

                    <Text style={styles.pendingDescription}>
                        Certificatul tău a fost primit! Așteptăm confirmarea de la administratorii noștri. Vei fi notificat când va fi aprobat.
                    </Text>

                    <View style={styles.progressBar}>
                        <View style={styles.progressFill} />
                    </View>
                </View>
            )}

            {/* Action Section */}
            <View style={styles.actionSection}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <MaterialIcons name="logout" size={18} color={theme.colors.onTertiary} />
                    <Text style={styles.logoutText}>Deconectare</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />

            {/* Photo Upload Modal */}
            <Modal visible={photoModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selectează sursă</Text>
                            <TouchableOpacity
                                onPress={() => setPhotoModalVisible(false)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialIcons name="close" size={24} color={theme.colors.onBackground} />
                            </TouchableOpacity>
                        </View>

                        {uploadingPhoto ? (
                            <View style={styles.uploadingContainer}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                                <Text style={styles.uploadingText}>Se încarcă...</Text>
                            </View>
                        ) : (
                            <View style={styles.modalButtonsContainer}>
                                <TouchableOpacity
                                    style={styles.modalActionButton}
                                    onPress={handleTakePhoto}
                                >
                                    <MaterialIcons name="camera-alt" size={32} color={theme.colors.primary} />
                                    <Text style={styles.modalActionTitle}>Fotografiază</Text>
                                    <Text style={styles.modalActionSubtitle}>Fă o fotografie nouă</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalActionButton}
                                    onPress={handleDiplomaUpload}
                                >
                                    <MaterialIcons name="photo-library" size={32} color={theme.colors.secondary} />
                                    <Text style={styles.modalActionTitle}>Din Galerie</Text>
                                    <Text style={styles.modalActionSubtitle}>Selectează din dispozitiv</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.modalDismissButton}
                            onPress={() => setPhotoModalVisible(false)}
                        >
                            <Text style={styles.modalDismissText}>Anulează</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
        paddingTop: 80,
        paddingBottom: 16,
    },

    /* Profile Section */
    profileCard: {
        backgroundColor: theme.colors.backdrop,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: theme.colors.background,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarContainer: {
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.onBackground,
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 13,
        color: theme.colors.onBackground,
        opacity: 0.7,
        marginBottom: 8,
    },
    certificationBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: "#90EE90",
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    certificationBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.background,
    },

    /* Stats Section */
    statsSection: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.backdrop,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.onBackground,
        opacity: 0.7,
        marginTop: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.primary,
        marginTop: 4,
    },

    /* Certification Section */
    certificationSection: {
        backgroundColor: theme.colors.backdrop,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.secondary,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.onBackground,
    },
    certificationDescription: {
        fontSize: 13,
        color: theme.colors.onBackground,
        opacity: 0.75,
        lineHeight: 20,
        marginBottom: 16,
    },
    uploadCertButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    uploadButtonText: {
        flex: 1,
    },
    uploadButtonTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.onPrimary,
    },
    uploadButtonSubtitle: {
        fontSize: 12,
        color: theme.colors.onPrimary,
        opacity: 0.85,
        marginTop: 2,
    },

    /* Pending Section */
    pendingSection: {
        backgroundColor: theme.colors.backdrop,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.secondary,
    },
    pendingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    pendingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.onBackground,
    },
    pendingDescription: {
        fontSize: 13,
        color: theme.colors.onBackground,
        opacity: 0.75,
        lineHeight: 20,
        marginBottom: 16,
    },
    progressBar: {
        height: 6,
        backgroundColor: theme.colors.background,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        width: '35%',
        backgroundColor: theme.colors.secondary,
    },

    /* Action Section */
    actionSection: {
        marginBottom: 24,
        width: '100%',
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: theme.colors.error,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.onTertiary,
    },

    /* Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 32,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.onBackground,
    },
    uploadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    uploadingText: {
        fontSize: 14,
        color: theme.colors.onBackground,
        marginTop: 12,
    },
    modalButtonsContainer: {
        gap: 12,
        marginBottom: 16,
    },
    modalActionButton: {
        backgroundColor: theme.colors.backdrop,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.outline,
        opacity: 0.9,
    },
    modalActionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.onBackground,
        marginTop: 8,
    },
    modalActionSubtitle: {
        fontSize: 12,
        color: theme.colors.onBackground,
        opacity: 0.6,
        marginTop: 2,
    },
    modalDismissButton: {
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.outline,
    },
    modalDismissText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.onBackground,
    },

    /* Legacy styles - keeping for backward compatibility */
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
});

export default AccountPage;