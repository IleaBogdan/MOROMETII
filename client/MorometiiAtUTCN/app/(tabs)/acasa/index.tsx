import React, { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { View, Text, Alert, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Linking, Platform, ScrollView } from "react-native";
import { theme } from '@/theme/theme'
import AsyncStorage from "@react-native-async-storage/async-storage";
// react-native-maps may not be available in the running native build (Expo Go vs custom dev client).
// Try to require it dynamically and fall back gracefully if the native module is missing.
let MapView: any = null;
let Marker: any = null;
let hasMapsModule = true;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const maps = require("react-native-maps");
    MapView = maps.default ?? maps.MapView ?? maps;
    Marker = maps.Marker ?? (maps.default && maps.default.Marker) ?? null;
} catch (err) {
    hasMapsModule = false;
    console.warn("react-native-maps native module not found, map will be unavailable.", err);
}
// Try to require WebView for a JS-based map fallback (Leaflet in WebView)
let WebView: any = null;
let hasWebView = true;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const wv = require('react-native-webview');
    WebView = wv.WebView ?? wv.default ?? wv;
} catch (e) {
    hasWebView = false;
}


interface UserData {
    username: string;
    email: string;
    is_validated: boolean;
    certification_mode: string | null;
    reputation: string;
    events: string;
    emergencyid:number;

}

interface Urgenta {
    name: string;               // yes
    description: string;        // optional
    location: [string,string]; // latx and laty
    score: number; // how urgent is this 
    count:number; // number of people that applied already 
    id:number;
}

const HomePage: React.FC = () => {
    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const parseCoord = (value: string) => {
        // Accept either: "12.34 N" or plain decimal string "12.34"
        if (!value) return 0;
        const parts = value.trim().split(" ");
        if (parts.length === 1) {
            return parseFloat(parts[0]);
        }
        const [num, dir] = parts;
        let n = parseFloat(num);
        if (dir === "S" || dir === "W") n = -n;
        return n;
    };

    const [urgencies, setUrgencies] = useState<Urgenta[]>([]);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedUrgency, setSelectedUrgency] = useState<Urgenta | null>(null);
    const [detailsVisible, setDetailsVisible] = useState(false);

    const loadUserData = async () => {
        try {
            const username = await AsyncStorage.getItem("username");
            const email = await AsyncStorage.getItem("email");
            const is_validated = await AsyncStorage.getItem("is_validated");
            const certification_mode = await AsyncStorage.getItem("certification_mode");
            const reputation = await AsyncStorage.getItem("reputation");
            const events = await AsyncStorage.getItem("events");
            const emergencyid = await AsyncStorage.getItem("emergencyid");
            {/*
            
            setUserData({
                username: username || "",
                email: email || "",
                is_validated: is_validated === "true",
                certification_mode: certification_mode || null,
                reputation: reputation || '0',
                events: events || '0',
            });

            */}
            setUserData({
                username: username || "",
                email: email || "",
                is_validated: "true" === "true",
                certification_mode: "yes",
                reputation: reputation || '0',
                events: events || '0',
                emergencyid:emergencyid ? parseInt(emergencyid) : 0,
            });
        } catch (error) {
            console.error("Error loading user data:", error);
            Alert.alert("Eroare", "Nu s-au putut încărca datele utilizatorului");
        }
    };

    // Example/sample urgencies - replace with API fetch as needed
    useEffect(() => {
        const sample: Urgenta[] = [
            { name: "Accident rutier", description: "Derived from a scrambled Latin text (Cicero's it's gibberish but mimics real language's character/word distribution, preventing distraction from design elements like typography", location: ["46.7712", "23.6236"], score: 8, count: 3, id:1},
            { name: "Infarct", description: "Persoană inconștientă", location: ["46.7667", "23.5833"], score: 9, count: 1, id:2},
            { name: "Cădere", description: "Persoană căzută pe stradă", location: ["46.7725", "23.6000"], score: 6, count: 0, id:3 },
        ];
        setUrgencies(sample);
    }, []);

    // Try to get device location (Expo Location preferred if available)
    useEffect(() => {
        const getLocation = async () => {
            try {
                let locModule: any = null;
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
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

                // Fallback to navigator.geolocation (may be deprecated in some RN setups)
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

    const toRad = (v: number) => (v * Math.PI) / 180;
    const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const openInMaps = (lat: number, lon: number) => {
        const latStr = lat.toString();
        const lonStr = lon.toString();
        // Prefer Google Maps URL which opens app if installed
        const googleUrl = `https://www.google.com/maps/search/?api=1&query=${latStr},${lonStr}`;
        const wazeUrl = `https://waze.com/ul?ll=${latStr},${lonStr}&navigate=yes`;

        // Try Google first
        Linking.openURL(googleUrl).catch(() => {
            // try waze
            Linking.openURL(wazeUrl).catch((err) => console.warn("Could not open maps:", err));
        });
    };

    // Filter urgencies: only show those within 1km of user location
    const closeUrgencies = userLocation 
        ? urgencies.filter(u => {
            const lat = parseCoord(u.location[0]);
            const lon = parseCoord(u.location[1]);
            const dist = distanceKm(userLocation.latitude, userLocation.longitude, lat, lon);
            return dist <= 2;
        })
        : urgencies;

        const makeLeafletHtml = (markers: Urgenta[]) => {
                const points = markers.map(m => ({ lat: parseCoord(m.location[0]), lon: parseCoord(m.location[1]), name: m.name, desc: m.description }));
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
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
            points.forEach(p => {
                L.marker([p.lat, p.lon]).addTo(map).bindPopup('<b>'+p.name+'</b><br/>'+ (p.desc||''));
            });
        </script>
    </body>
</html>`;
        };

    return (
        <View style={styles.container}>
            {/* Show this section if the user is not yet verified */}
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
                <ScrollView style={styles.holdsContainer}>
                    
                    {/* Map + list of urgencies */}
                    <View style={styles.mapWrapper}>
                        {/* map area */}
                        {closeUrgencies.length > 0 ? (
                            hasMapsModule && MapView ? (
                                <MapView
                                    style={styles.map}
                                    initialRegion={{
                                        latitude: parseCoord(closeUrgencies[0].location[0]),
                                        longitude: parseCoord(closeUrgencies[0].location[1]),
                                        latitudeDelta: 0.05,
                                        longitudeDelta: 0.05,
                                    }}
                                >
                                    {closeUrgencies.map((u, idx) => (
                                        Marker ? (
                                            <Marker
                                                key={idx}
                                                coordinate={{
                                                    latitude: parseCoord(u.location[0]),
                                                    longitude: parseCoord(u.location[1]),
                                                }}
                                                title={u.name}
                                                description={u.description}
                                            />
                                        ) : null
                                    ))}
                                </MapView>
                            ) : hasWebView && WebView ? (
                                // Render a Leaflet map inside WebView as a development-friendly fallback
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
                            <Text style={styles.infoDescription}>Nu există urgențe în apropierea dvs. (în raza de 1 km)</Text>
                        )}
                    </View>

                    {/* cards list below map */}
                    <View style={styles.urgencyList}>
                        {closeUrgencies.map((u, i) => {
                            const lat = parseCoord(u.location[0]);
                            const lon = parseCoord(u.location[1]);
                            const dist = userLocation ? distanceKm(userLocation.latitude, userLocation.longitude, lat, lon) : null;
                            return (
                                <TouchableOpacity key={i} style={styles.urgencyCard} onPress={() => { setSelectedUrgency(u); setDetailsVisible(true); }}>
                                    <View>
                                        <Text style={styles.detailText  }>{u.name}</Text>
                                    </View>
                                    <View style={styles.urgencyMetaRow_Summary}>
                                        <View style={styles.stat_container_Summary}>
                                            <View style={styles.stat_element_Sumarry}>
                                                <MaterialIcons name="warning" size={50} color={theme.colors.errorContainer} />
                                                <Text style={styles.stat_element_text_Sumarry}>{u.score}/10</Text>
                                            </View>
                                            
                                        </View>
                                        
                                        <View style={styles.stat_container_Summary}>
                                            <View style={styles.stat_element_Sumarry}>
                                                <MaterialIcons name="place" size={50} color={theme.colors.secondary} />
                                                <Text style={styles.stat_element_text_Sumarry}>{dist != null ? `${dist.toFixed(1)} km` : '—'}</Text>
                                            </View>
                                        </View>


                                        <Text style={styles.urgencyMeta}>Aplicanți: {u.count}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Details modal for selected urgency */}
                    <Modal visible={detailsVisible} transparent animationType="slide" onRequestClose={() => setDetailsVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContentLarge}>
                                {selectedUrgency ? (
                                    <>
                                        <Text style={styles.detailTitle}>{selectedUrgency.name}</Text>
                                        <Text style={styles.detailText}>{selectedUrgency.description}</Text>
                                        <View style={styles.stat_container}>
                                            <View style={styles.stat_element}>
                                                <MaterialIcons name="warning" size={50} color={theme.colors.errorContainer} />
                                                <Text style={styles.stat_element_text}>Prioritate</Text>
                                            </View>
                                            <View style={styles.stat_element}>
                                                <Text style={styles.stat_text}>{selectedUrgency.score}/10</Text>
                                            </View>
                                        </View>        
                                        {userLocation ? (
                                            <View style={styles.stat_container}>
                                                <View style={styles.stat_element}>
                                                    <MaterialIcons name="place" size={50} color={theme.colors.secondary} />
                                                    <Text style={styles.stat_element_text}>Distanță</Text>
                                                </View>
                                                <View style={styles.stat_element}>
                                                    <Text style={styles.stat_text}>{distanceKm(userLocation.latitude, userLocation.longitude, parseCoord(selectedUrgency.location[0]), parseCoord(selectedUrgency.location[1])).toFixed(1)} km</Text>
                                                </View>
                                            </View>
                                    ) : null}

                                        <TouchableOpacity style={styles.intervineButton} onPress={() => openInMaps(parseCoord(selectedUrgency.location[0]), parseCoord(selectedUrgency.location[1]))}>
                                            <Text style={styles.intervineButtonText}>Intervine</Text>
                                        </TouchableOpacity>

                                        <View style={styles.detailMapWrapper}>
                                            {hasMapsModule && MapView ? (
                                                <MapView
                                                    style={styles.map}
                                                    initialRegion={{
                                                        latitude: parseCoord(selectedUrgency.location[0]),
                                                        longitude: parseCoord(selectedUrgency.location[1]),
                                                        latitudeDelta: 0.01,
                                                        longitudeDelta: 0.01,
                                                    }}
                                                >
                                                    {Marker ? (
                                                        <Marker coordinate={{ latitude: parseCoord(selectedUrgency.location[0]), longitude: parseCoord(selectedUrgency.location[1]) }} title={selectedUrgency.name} />
                                                    ) : null}
                                                </MapView>
                                            ) : hasWebView && WebView ? (
                                                <WebView
                                                    originWhitelist={["*"]}
                                                    source={{ html: makeLeafletHtml([selectedUrgency]) }}
                                                    style={styles.map}
                                                />
                                            ) : (
                                                <View style={styles.mapUnavailable}>
                                                    <Text style={styles.infoDescription}>Harta nu este disponibilă în această sesiune.</Text>
                                                </View>
                                            )}
                                        </View>

                                        <TouchableOpacity style={styles.openMapButton} onPress={() => openInMaps(parseCoord(selectedUrgency.location[0]), parseCoord(selectedUrgency.location[1]))}>
                                            <Text style={styles.openMapButtonText}>Deschide în Google Maps</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setDetailsVisible(false)}>
                                            <Text style={styles.modalCloseButtonText}>Închide</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <ActivityIndicator size="large" color={theme.colors.primary} />
                                )}
                            </View>
                        </View>
                    </Modal>
                </ScrollView>
            )}
        </View>
    );
};


const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
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
    certificationInfo: {
        backgroundColor: theme.colors.backdrop,
        borderRadius: 12,
        padding: 15,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30,
        color: theme.colors.outline,
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
        color: theme.colors.onBackground,
        fontSize: 30,
    },
    stat_element_text: {
        color: theme.colors.onBackground,
    },
    stat_element_text_Sumarry:{
        color: theme.colors.onBackground,
        fontSize:14,
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
        height: 300,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
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
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
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
        padding: 20,
    },
    modalContentLarge: {
        width: "100%",
        maxHeight: "90%",
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        padding: 16,
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
        backgroundColor: theme.colors.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 10,
    },
    openMapButtonText: {
        color: theme.colors.onBackground,
        fontWeight: "bold",
    },
    intervineButton: {
        backgroundColor: theme.colors.secondary,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 10,
    },
    intervineButtonText: {
        color: theme.colors.onBackground,
        fontWeight: "bold",
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