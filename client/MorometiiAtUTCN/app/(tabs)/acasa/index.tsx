import React, { useState, useEffect } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { theme } from '@/theme/theme'
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserData {
    username: string;
    email: string;
    is_validated: boolean;
    certification_mode: string | null;
    reputation: string;
    events: string;

}

const HomePage: React.FC = () => {
    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const username = await AsyncStorage.getItem("username");
            const email = await AsyncStorage.getItem("email");
            const is_validated = await AsyncStorage.getItem("is_validated");
            const certification_mode = await AsyncStorage.getItem("certification_mode");
            const reputation = await AsyncStorage.getItem("reputation");
            const events = await AsyncStorage.getItem("events");
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
                is_validated: is_validated === "true",
                certification_mode: certification_mode || null,
                reputation: reputation || '0',
                events: events || '0',
            });
        } catch (error) {
            console.error("Error loading user data:", error);
            Alert.alert("Eroare", "Nu s-au putut încărca datele utilizatorului");
        }
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
                <View style={styles.container}>
                    <Text style={styles.bottom_text}>
                        This is where all the emergencies will be displayed once the API is a thing :)
                    </Text>
                </View>
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
        backgroundColor: "#fff",
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
        color: "#fff",
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
});

export default HomePage;