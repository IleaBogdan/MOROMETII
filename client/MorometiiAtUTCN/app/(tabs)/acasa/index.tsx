import { API_BASE } from "@/api/apiCalls";
import { theme } from '@/theme/theme';
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { distanceKm, isUserIntervening, openInMaps, parseCoord, saveInterveningEmergencies } from "./functions";
// Platform-safe map imports
let MapView: any = null;
let Marker: any = null;
let hasMapsModule = false;

if (Platform.OS !== 'web') {
    try {
        const maps = require("react-native-maps");
        MapView = maps.default ?? maps.MapView ?? maps;
        Marker = maps.Marker ?? (maps.default && maps.default.Marker) ?? null;
        hasMapsModule = true;
    } catch (err) {
        console.warn("react-native-maps not found:", err);
    }
}

let WebView: any = null;
let hasWebView = false;

try {
    const wv = require('react-native-webview');
    WebView = wv.WebView ?? wv.default ?? wv;
    hasWebView = true;
} catch (e) {
    console.warn("react-native-webview not found:", e);
}

interface UserData {
    username: string;
    email: string;
    is_validated: boolean;
    certification_mode: string | null;
    reputation: string;
    events: string;
    emergencyid: number;
    id: number | null;
}

interface Urgenta {
    name: string;               // yes
    description: string;        // optional
    location: [string, string]; // latx and laty
    score: number; // how urgent is this 
    count: number;
    id: number;
}
interface databaseUrgency {
    name: string;
    id: number;
    description: string;
    level: number;
    location_X: number;
    location_Y: number;
}


const HomePage: React.FC = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [interveningEmergencies, setInterveningEmergencies] = useState<{ [key: number]: string[] }>({});
    const [isApplying, setIsApplying] = useState(false);

    const [urgencies, setUrgencies] = useState<databaseUrgency[]>([]);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedUrgency, setSelectedUrgency] = useState<Urgenta | null>(null);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [activeEmergencyId, setActiveEmergencyId] = useState<number | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const isFetchingRef = useRef(false);

    useFocusEffect(
        useCallback(() => {
            const initializeData = async () => {
                if (isFetchingRef.current) return;

                isFetchingRef.current = true;

                try {
                    if (!isInitialized) {
                        await loadUserData();
                        setIsInitialized(true);
                    }

                    const emergencyIds = await handleRefreshUrgencies();
                    if (emergencyIds && emergencyIds.length > 0) {
                        await fetchAllApplicants(emergencyIds);
                    }
                } finally {
                    isFetchingRef.current = false;
                }
            };

            initializeData();


            return () => {
                isFetchingRef.current = false;
            };
        }, [isInitialized])
    );



    const fetchAllApplicants = async (emergencyIds: number[]) => {

        try {
            const url = API_BASE;

            const promises = emergencyIds.map(async (id) => {
                try {
                    const response = await fetch(`${url}/api/UserManager/GetApplicants?EmergencyId=${id}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();

                    return {
                        id,
                        names: data.names || ''
                    };
                } catch {
                    return { id, names: '' };
                }
            });

            const results = await Promise.all(promises);

            const applicantsMap: { [key: number]: string[] } = {};
            results.forEach((result) => {
                const namesList = result.names
                    ? result.names.split(',').map((n: string) => n.trim()).filter((n: string) => n.length > 0)
                    : [];
                applicantsMap[result.id] = namesList;
            });

            setInterveningEmergencies(applicantsMap);
            await saveInterveningEmergencies(applicantsMap);
        } catch (error) {
            console.error("Error fetching applicants:", error);
        }
    };


    const handleIntervene = async (urgency: Urgenta) => {
        if (!userData || !userData.username || isApplying) {
            if (!userData || !userData.username) {
                Alert.alert("Eroare", "Date utilizator lipsă.");
            }
            return;
        }

        const emergencyId = urgency.id;
        const userId = userData.id?.toString();

        if (!userId) {
            Alert.alert("Eroare", "ID-ul utilizatorului nu a fost găsit.");
            return;
        }

        // Check if user is already intervening in this emergency
        const isAlreadyIntervening = isUserIntervening(interveningEmergencies, emergencyId, userData.username);

        // If user is already intervening, just open the map
        if (isAlreadyIntervening) {
            openInMaps(parseCoord(urgency.location[0]), parseCoord(urgency.location[1]));
            return;
        }

        // Check if another emergency is active
        if (activeEmergencyId !== null && activeEmergencyId !== emergencyId) {
            Alert.alert("Blocare", "O altă intervenție este activă. Finalizați sau așteptați acea intervenție.");
            return;
        }

        // Set this as the active emergency BEFORE starting the application
        setActiveEmergencyId(emergencyId);
        setIsApplying(true);

        try {
            const url = API_BASE;
            const requestUrl = `${url}/api/UserManager/ApplyFor?EmergencyId=${emergencyId}&UserId=${userId}`;

            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error(`Server returned status ${response.status} but invalid JSON.`);
            }


            if (response.ok && data.error === null) {
                const namesList = data.names
                    ? data.names.split(',').map((name: string) => name.trim()).filter((name: string) => name.length > 0)
                    : [userData.username];

                const newInterventions = {
                    ...interveningEmergencies,
                    [emergencyId]: namesList
                };

                setInterveningEmergencies(newInterventions);
                await saveInterveningEmergencies(newInterventions);

                setDetailsVisible(false);

                Alert.alert(
                    "Succes",
                    "Ați început intervenția! Se deschide harta.",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                openInMaps(parseCoord(urgency.location[0]), parseCoord(urgency.location[1]));
                            }
                        }
                    ]
                );

            } else {
                console.log("API Logic Error:", data.error);
                const errorMessage = data.error || "A apărut o eroare necunoscută.";
                Alert.alert("Eroare intervenție", errorMessage);

                setActiveEmergencyId(null);
            }

        } catch (error) {
            console.error("Error applying for emergency:", error);
            const msg = error instanceof Error ? error.message : "Nu s-a putut contacta serverul.";
            Alert.alert("Eroare", msg);
            setActiveEmergencyId(null);
        } finally {
            setIsApplying(false);
        }
    }

    const handleRefreshUrgencies = async (): Promise<number[]> => {
        const url = API_BASE;
        setIsRefreshing(true);
        try {
            const response = await fetch(`${url}/api/Emergency/FindEmergency`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (response.ok) {
                const listOfUrgencies: databaseUrgency[] = data.ems;
                setUrgencies(listOfUrgencies);
                return listOfUrgencies.map(u => u.id);
            }
        } catch (error) {
            console.error("Error refreshing urgencies:", error);
        } finally {
            setIsRefreshing(false);
        }
        return [];
    };


    const loadUserData = async () => {
        try {
            const username = await AsyncStorage.getItem("username");
            const email = await AsyncStorage.getItem("email");
            const isValid = await AsyncStorage.getItem("isVerified");
            const certification_img = await AsyncStorage.getItem("certification_img");
            const reputation = await AsyncStorage.getItem("reputation");
            const events = await AsyncStorage.getItem("events");
            const emergencyid = await AsyncStorage.getItem("emergencyid");
            const id = await AsyncStorage.getItem('id');
            setUserData({
                username: username || "",
                email: email || "",
                is_validated: isValid === "true",
                certification_mode: certification_img ? "yes" : null,
                reputation: reputation || '0',
                events: events || '0',
                emergencyid: emergencyid ? parseInt(emergencyid) : 0,
                id: id ? parseInt(id) : 0,
            });
        } catch (error) {
            console.error("Error loading user data:", error);
            Alert.alert("Eroare", "Nu s-au putut încărca datele utilizatorului");
        }
    };


    useEffect(() => {
        const getLocation = async () => {
            try {
                let locModule: any = null;
                try {

                    locModule = require("expo-location");
                } catch (e) {
                    locModule = null;
                }

                if (locModule) {
                    const { requestForegroundPermissionsAsync, getCurrentPositionAsync } = locModule;
                    const { status } = await requestForegroundPermissionsAsync();
                    if (status === "granted") {
                        const pos = await getCurrentPositionAsync({ accuracy: 3 });
                        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                        return;
                    }
                }

                if (navigator && (navigator as any).geolocation) {
                    (navigator as any).geolocation.getCurrentPosition(
                        (pos: any) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                        (err: any) => console.warn("Geolocation error:", err),
                        { enableHighAccuracy: true, timeout: 10000 }
                    );
                }
            } catch (error) {
                console.warn("Could not get user location:", error);
            }
        };

        getLocation();
    }, []);



    const closeUrgencies = userLocation
        ? urgencies.filter(u => {
            const dist = distanceKm(userLocation.latitude, userLocation.longitude, u.location_X, u.location_Y);
            return dist <= 2.00;
        })
        : urgencies;

    const makeLeafletHtml = (markers: databaseUrgency[]) => {
        const points = markers.map(m => ({
            lat: m.location_X,
            lon: m.location_Y,
            name: m.name,
            desc: m.description,
        }));
        const ptsJson = JSON.stringify(points);
        return `<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
        <style>html,body,#map{height:100%;margin:0;padding:0}</style>
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    </head>
    <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <script>
            const points = ${ptsJson};
            const first = points[0] || {lat:0,lon:0};
            const map = L.map('map').setView([first.lat, first.lon], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
            points.forEach(p => {
                L.marker([p.lat, p.lon]).addTo(map).bindPopup('<b>'+p.name+'</b><br/>'+ (p.desc||''));
            });
        </script>
    </body>
</html>`;
    };

    // Calculate this value just before render, or use useMemo if complex
    const isInterveningInSelected = useMemo(() => {
        return selectedUrgency && userData ? isUserIntervening(interveningEmergencies, selectedUrgency.id, userData.username) : false;
    }, [selectedUrgency, userData, interveningEmergencies]);


    return (
        <View style={styles.container}>
            {!userData || (!userData.is_validated) && (
                <View style={styles.certificationInfo}>
                    <Text style={styles.infoTitle}>Înainte să începem...</Text>
                    <Text style={styles.infoDescription}>
                        {"\n"}Platforma noastră cere utilizatorilor un document prin care aceștia să demonstreze că dețin cunoștiințele necesare pentru a acorda prim ajutor!{"\n\n"}
                    </Text>
                    <Text style={styles.infoDescription}>
                        Află mai multe în pagina 'Cont'!
                    </Text>
                </View>
            )}
            {userData != null && (userData.is_validated) && (
                <ScrollView style={styles.holdsContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefreshUrgencies}
                            tintColor={theme.colors.primary}
                            colors={[theme.colors.primary]}
                        />
                    }>
                    {/* Map + list of urgencies */}
                    <View style={styles.mapWrapper}>
                        {/* map area */}
                        {closeUrgencies.length > 0 ? (
                            hasMapsModule && MapView ? (
                                <MapView
                                    style={styles.map}
                                    initialRegion={{
                                        latitude: closeUrgencies[0].location_X,
                                        longitude: closeUrgencies[0].location_Y,
                                        latitudeDelta: 0.05,
                                        longitudeDelta: 0.05,
                                    }}
                                >
                                    {closeUrgencies.map((u, idx) => (
                                        Marker ? (

                                            <Marker
                                                key={idx}
                                                coordinate={{
                                                    latitude: u.location_X,
                                                    longitude: u.location_Y,
                                                }}
                                                title={u.name}
                                                description={u.description}
                                            />
                                        ) : null
                                    ))}
                                </MapView>
                            ) : hasWebView && WebView ? (
                                <WebView
                                    originWhitelist={["*"]}
                                    source={{ html: makeLeafletHtml(closeUrgencies) }}
                                    style={styles.map}
                                />
                            ) : (
                                <View style={styles.mapUnavailable}>
                                    <Text style={styles.infoDescription}>Harta nu este disponibilă în această sesiune. </Text>
                                </View>
                            )
                        ) : (
                            <Text style={styles.infoDescription}>Nu există urgențe în apropierea dvs.</Text>
                        )}
                    </View>
                    {/* <View style={{ marginBottom: 10 }}>
                        <Text style={styles.title}>Urgențe Apropiate</Text>
                        <Text style={{ color: theme.colors.onBackground, fontSize: 13, opacity: 0.7 }}>Glisati in jos pentru a actualiza urgentele</Text>
                    </View>
                    {/* cards list below map */}
                    {isRefreshing ?
                        (<ActivityIndicator size={50} color={theme.colors.primary} style={{ marginTop: 50 }} />
                        ) : (
                            <View style={styles.urgencyList}>
                                {closeUrgencies.map((u, i) => {
                                    const dist = userLocation ? distanceKm(userLocation.latitude, userLocation.longitude, u.location_X, u.location_Y) : null;
                                    const getSeverityColor = (level: number) => {
                                        if (level >= 8) return theme.colors.errorContainer;
                                        if (level >= 5) return theme.colors.secondary;
                                        return theme.colors.tertiary;
                                    };
                                    const severityColor = getSeverityColor(u.level);
                                    const isIntervening = userData ? isUserIntervening(interveningEmergencies, u.id, userData.username) : false;
                                    const interveners = interveningEmergencies[u.id] || [];
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            disabled={activeEmergencyId !== null && activeEmergencyId !== u.id}
                                            style={[
                                                styles.urgencyCard,
                                                isIntervening && { backgroundColor: theme.colors.primaryContainer },
                                                (activeEmergencyId !== null && activeEmergencyId !== u.id) && { opacity: 0.45 }
                                            ]}
                                            onPress={() => {
                                                // prevent click if another emergency is active
                                                if (activeEmergencyId !== null && activeEmergencyId !== u.id) return;

                                                const urgencyDetails: Urgenta = {
                                                    name: u.name,
                                                    description: u.description,
                                                    location: [u.location_X.toString(), u.location_Y.toString()],
                                                    score: u.level,
                                                    count: interveners.length,
                                                    id: u.id,
                                                }
                                                setSelectedUrgency(urgencyDetails);
                                                setDetailsVisible(true);
                                            }}
                                        >
                                            {/* Severity badge */}
                                            <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
                                                <MaterialIcons name="priority-high" size={16} color={theme.colors.background} />
                                                <Text style={styles.severityText}>{u.level}/5</Text>
                                            </View>

                                            {/* Card content */}
                                            <View style={styles.urgencyCardContent}>
                                                <View style={styles.urgencyTitleRow}>
                                                    <Text style={styles.urgencyTitle}>{u.name}</Text>
                                                </View>

                                                {u.description ? (
                                                    <Text style={styles.urgencyDescription} numberOfLines={2}>{u.description}</Text>
                                                ) : null}

                                                <View style={styles.urgencyMetas}>
                                                    <View style={styles.metaItem}>
                                                        <MaterialIcons name="place" size={16} color={theme.colors.secondary} />
                                                        <Text style={styles.metaText}>{dist != null ? `${dist.toFixed(2)} km` : '—'}</Text>
                                                    </View>
                                                    <View style={styles.metaDivider} />
                                                    <View style={styles.metaItem}>
                                                        <MaterialIcons name="group" size={16} color={theme.colors.primary} />
                                                        <Text style={styles.metaText}>{interveners.length}</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Arrow indicator */}
                                            <View style={styles.cardArrow}>
                                                <MaterialIcons name="chevron-right" size={24} color={theme.colors.primary} />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    {/* Details modal for selected urgency */}
                    <Modal visible={detailsVisible} transparent animationType="fade" onRequestClose={() => setDetailsVisible(false)}>
                        <View style={styles.modalFullScreen}>
                            {selectedUrgency ? (
                                <>
                                    {/* Full-screen map background */}
                                    <View style={styles.mapFullScreen}>
                                        {hasMapsModule && MapView ? (
                                            <MapView
                                                style={styles.map}
                                                initialRegion={{
                                                    latitude: parseCoord(selectedUrgency.location[0]),
                                                    longitude: parseCoord(selectedUrgency.location[1]),
                                                    latitudeDelta: 0.02,
                                                    longitudeDelta: 0.02,
                                                }}
                                            >
                                                {Marker ? (
                                                    <Marker coordinate={{ latitude: parseCoord(selectedUrgency.location[0]), longitude: parseCoord(selectedUrgency.location[1]) }} title={selectedUrgency.name} />
                                                ) : null}
                                            </MapView>
                                        ) : hasWebView && WebView ? (
                                            <WebView
                                                originWhitelist={["*"]}
                                                source={{
                                                    html: makeLeafletHtml([{
                                                        name: selectedUrgency.name,
                                                        id: selectedUrgency.id,
                                                        description: selectedUrgency.description,
                                                        level: selectedUrgency.score,
                                                        location_X: parseCoord(selectedUrgency.location[0]),
                                                        location_Y: parseCoord(selectedUrgency.location[1]),
                                                    }])
                                                }}
                                                style={styles.map}
                                            />
                                        ) : (
                                            <View style={styles.mapUnavailable}>
                                                <Text style={styles.infoDescription}>Harta nu este disponibilă în această sesiune.</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Close button (top-left) */}
                                    <TouchableOpacity
                                        style={styles.closeButtonOverlay}
                                        onPress={() => setDetailsVisible(false)}
                                    >
                                        <MaterialIcons name="arrow-back" size={28} color="white" />
                                    </TouchableOpacity>

                                    {/* Bottom card with details */}
                                    <View style={styles.detailsCard}>
                                        <ScrollView showsVerticalScrollIndicator={false}>
                                            {/* Severity badge */}

                                            {/* Title */}
                                            <Text style={styles.cardTitle}>{selectedUrgency.name}</Text>

                                            {/* Description */}
                                            <Text style={styles.cardDescription}>{selectedUrgency.description}</Text>

                                            {/* Info stats */}
                                            <View style={styles.infoStats}>
                                                <View style={styles.infoStatItem}>
                                                    <MaterialIcons name="priority-high" size={20} color={theme.colors.errorContainer} />
                                                    <View style={styles.infoStatText}>
                                                        <Text style={styles.infoStatLabel}>Prioritate</Text>
                                                        <Text style={styles.infoStatValue}>{selectedUrgency.score}/5</Text>
                                                    </View>
                                                </View>

                                                {userLocation ? (
                                                    <View style={styles.infoStatItem}>
                                                        <MaterialIcons name="place" size={20} color={theme.colors.secondary} />
                                                        <View style={styles.infoStatText}>
                                                            <Text style={styles.infoStatLabel}>Distanță</Text>
                                                            <Text style={styles.infoStatValue}>{distanceKm(userLocation.latitude, userLocation.longitude, parseCoord(selectedUrgency.location[0]), parseCoord(selectedUrgency.location[1])).toFixed(2)} km</Text>
                                                        </View>
                                                    </View>
                                                ) : null}
                                            </View>

                                            {/* Action buttons */}
                                            <View style={styles.actionButtonsCard}>
                                                <TouchableOpacity
                                                    style={styles.primaryActionButton}
                                                    onPress={() => handleIntervene(selectedUrgency)}
                                                >
                                                    <MaterialIcons name="directions" size={20} color={theme.colors.onPrimary} />
                                                    <Text style={styles.primaryActionText}>Intervine</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.secondaryActionButton}
                                                    onPress={() => openInMaps(parseCoord(selectedUrgency.location[0]), parseCoord(selectedUrgency.location[1]))}
                                                >
                                                    <MaterialIcons name="map" size={20} color={theme.colors.primary} />
                                                    <Text style={styles.secondaryActionText}>Google Maps</Text>
                                                </TouchableOpacity>
                                            </View>

                                            <View style={{ height: 20 }} />
                                        </ScrollView>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={theme.colors.primary} />
                                </View>
                            )}
                        </View>
                    </Modal>
                </ScrollView >
            )
            }
        </View >
    );
};
const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        padding: 20,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.onBackground,
        marginBottom: 10,
    },
    infoDescription: {
        fontSize: 12,
        color: theme.colors.onBackground,
        lineHeight: 20,
    },
    certificationInfo: {
        backgroundColor: theme.colors.backdrop,
        borderRadius: 12,
        padding: 15,
        marginBottom: 30,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 15,
        alignSelf: 'center',
        color: theme.colors.primary,
    },
    input: {
        width: "100%",
        height: 50,
        backgroundColor: theme.colors.onBackground,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderColor: "#ddd",
        borderWidth: 1,
        fontSize: 16,
        color: "#333",
    },
    button: {
        width: "100%",
        height: 50,
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyStateTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.onBackground,
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptyStateDescription: {
        fontSize: 12,
        color: theme.colors.onBackground,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 22,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: theme.colors.outline,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    bottom_text: {
        color: theme.colors.onBackground,
    },
    buttonDisabled: {
        backgroundColor: "#ccc",
    },
    buttonText: {
        color: theme.colors.onBackground,
        fontSize: 18,
        fontWeight: "bold",
    },
    signupPrompt: {
        flexDirection: "row",
        marginTop: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    signupLink: {
        color: theme.colors.secondary,
        fontWeight: "bold",
        marginLeft: 5,
    },
    holdsContainer: {
        flex: 1,
    },
    stat_container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingVertical: 8,
    },
    stat_text: {
        color: theme.colors.onErrorContainer,
        fontSize: 30,
    },
    stat_element_text: {
        color: theme.colors.onBackground,
    },
    stat_element_text_Sumarry: {
        color: theme.colors.onBackground,
        fontSize: 14,
    },
    stat_element: {
        flex: 1,
        backgroundColor: theme.colors.backdrop,
        padding: 12,
        borderRadius: 12,
        justifyContent: 'center', // center on Y axis
        alignItems: 'center',     // center on X axis
        marginHorizontal: 6,
    },
    stat_value: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.onBackground,
    },
    stat_title: {
        fontSize: 12,
        color: theme.colors.onBackground,
        marginTop: 4,
    },
    mapWrapper: {
        height: 180,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
        marginTop: 30,
    },
    map: {
        width: "100%",
        height: "100%",
    },
    urgencyList: {
        marginTop: 8,
    },
    urgencyRow: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
    },
    urgencyName: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.colors.outline,
    },
    urgencyMeta: {
        fontSize: 12,
        color: theme.colors.onBackground,
    },
    mapUnavailable: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        backgroundColor: theme.colors.backdrop,
        borderRadius: 12,
    },
    /* mapProviderBadge removed */
    urgencyCard: {
        backgroundColor: theme.colors.backdrop,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    severityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginRight: 12,
        gap: 4,
    },
    severityText: {
        color: theme.colors.errorContainer,
        fontWeight: '600',
        fontSize: 12,
    },
    urgencyCardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    urgencyTitleRow: {
        marginBottom: 4,
    },
    urgencyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.onBackground,
    },
    urgencyDescription: {
        fontSize: 13,
        color: theme.colors.onBackground,
        opacity: 0.7,
        marginBottom: 8,
        lineHeight: 18,
    },
    urgencyMetas: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: theme.colors.onBackground,
        opacity: 0.8,
    },
    metaDivider: {
        width: 1,
        height: 14,
        backgroundColor: theme.colors.outline,
        opacity: 0.3,
    },
    cardArrow: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    urgencyCardDescription: {
        fontSize: 14,
        color: theme.colors.onBackground,
        marginTop: 6,
    },
    urgencyMetaRow: {
        marginTop: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
    },
    /* compatibility styles for older/summary markup */
    urgencyMetaRow_Summary: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    stat_container_Summary: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
        paddingVertical: 0,
        maxWidth: 140,
        flexShrink: 0,
    },
    stat_element_Sumarry: {
        flex: 0,
        backgroundColor: theme.colors.backdrop,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        minWidth: 48,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
    },
    modalContentLarge: {
        width: "100%",
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        padding: 16,
    },
    modalFullScreen: {
        flex: 1,
        backgroundColor: theme.colors.background,
        position: 'relative',
    },
    mapFullScreen: {
        ...StyleSheet.absoluteFillObject,
        height: '100%',
        width: '100%',
    },
    closeButtonOverlay: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    detailsCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        maxHeight: '75%',
        zIndex: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    },
    cardBadgeContainer: {
        marginBottom: 16,
    },
    severityBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
        alignSelf: 'flex-start',
    },
    severityTextLarge: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    cardTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.onBackground,
        marginBottom: 10,
    },
    cardDescription: {
        fontSize: 14,
        color: theme.colors.onBackground,
        opacity: 0.75,
        lineHeight: 20,
        marginBottom: 16,
    },
    infoStats: {
        gap: 12,
        marginBottom: 20,
    },
    infoStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.backdrop,
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    infoStatText: {
        flex: 1,
    },
    infoStatLabel: {
        fontSize: 12,
        color: theme.colors.onBackground,
        opacity: 0.7,
    },
    infoStatValue: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.onBackground,
        marginTop: 2,
    },
    actionButtonsCard: {
        gap: 12,
    },
    primaryActionButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryActionText: {
        color: theme.colors.onPrimary,
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryActionButton: {
        backgroundColor: theme.colors.backdrop,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
    },
    secondaryActionText: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailTitle: {
        fontSize: 30,
        fontWeight: "bold",
        color: theme.colors.onBackground,
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: theme.colors.onBackground,
        marginBottom: 6,
    },
    detailMapWrapper: {
        height: 200,
        borderRadius: 12,
        overflow: "hidden",
        marginVertical: 12,
    },
    openMapButton: {
        backgroundColor: theme.colors.secondaryContainer,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 10,
    },
    openMapButtonText: {
        color: 'white',
        fontWeight: "bold",
    },
    intervineButton: {
        backgroundColor: theme.colors.primaryContainer,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 10,
    },
    intervineButtonText: {
        color: theme.colors.onBackground,
        fontWeight: "bold",
        fontSize: 16,
    },
    modalCloseButton: {
        backgroundColor: theme.colors.outline,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    modalCloseButtonText: {
        color: theme.colors.onBackground,
        fontWeight: "bold",
    },
});

export default HomePage;