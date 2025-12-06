import { handleSignIn } from "@/api/apiCalls";
import { theme } from '@/theme/theme';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RelativePathString, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


const SignInPage: React.FC = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRedirectToSignUp = () => {
        router.push("/(tabs)/signup" as RelativePathString);
    };

    const handleLogin = async () => {
        const result = await handleSignIn(setLoading, email, password);

        if (result && result.data && result.data.isValid && result.response.ok) {
            await AsyncStorage.multiSet([
                ['username', result.data.username],
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
    }

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
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={theme.colors.onBackground} />
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

export default SignInPage;