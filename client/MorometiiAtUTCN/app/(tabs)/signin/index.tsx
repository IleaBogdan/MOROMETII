import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { RelativePathString, useRouter } from "expo-router";
import { theme } from '@/theme/theme'
import AsyncStorage from "@react-native-async-storage/async-storage";



const SignInPage: React.FC = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRedirectToSignUp = () => {
        router.push("/(tabs)/signup");
    };

    const handleSignIn = async () => {

        const API_BASE = "http://192.168.127.182:5024";

        setLoading(true);

        try {

            const encodedEmail = (email.trim());

            const encodedPassword = (password.trim());

            const url = `${API_BASE}/api/UserValidator/CheckLogin?Email=${encodedEmail}&Password=${encodedPassword}`;

            console.log("🔵 Attempting connection to:", url);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);



            const data = await response.json();


            if (response.ok && data.isValid) {
                await AsyncStorage.multiSet([
                    ['email', email.trim()],
                    ['password', password.trim()]
                ]);
                router.push("/(tabs)/acasa" as RelativePathString);
            } else {
                Alert.alert(
                    "Eroare de Autentificare!",
                    "Nu există acest utilizator sau datele de autentificare furnizate sunt greșite!"
                );
            }
        } catch (error: any) {

            if (error.name === 'AbortError') {
                Alert.alert(
                    "Timeout",
                    "Serverul nu răspunde. Verifică:\n• IP-ul serverului\n• Firewall-ul\n• Conexiunea la rețea"
                );
            } else {
                Alert.alert(
                    "Eroare de Rețea",
                    `Nu se poate conecta la server.\n\nIP Server: 192.168.127.182:5024\n\nVerifică:\n• Ambele dispozitive sunt pe aceeași rețea WiFi\n• Serverul C# rulează\n• Firewall-ul permite conexiuni`
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Autentificare</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!loading}
            />

            <TextInput
                style={styles.input}
                placeholder="Parolă"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignIn}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Autentificare</Text>
                )}
            </TouchableOpacity>

            <View style={styles.signupPrompt}>
                <Text style={styles.bottom_text}>
                    Nu ai un cont?
                </Text>
                <TouchableOpacity onPress={handleRedirectToSignUp}><Text style={styles.signupLink}>Crează acum!</Text></TouchableOpacity>
            </View>

        </View>
    );
};


const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: theme.colors.background,
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
        color: "white",
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

export default SignInPage;