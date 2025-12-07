import { handleSignIn } from "@/api/apiCalls";
import { theme } from '@/theme/theme';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RelativePathString, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


const SignInPage: React.FC = () => {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRedirectToSignUp = () => {
        router.push("/(tabs)/signup" as RelativePathString);
    };

    const handleLogin = async () => {
        const result = await handleSignIn(setLoading, username, password);

        if (result && result.data && result?.data.isValid) {
            await AsyncStorage.multiSet([
                ['username', username.trim()],
                ['email', result.data.email || ''],
                ['password', password.trim()],
                ['isVerified', result.data.isVerified ? 'true' : 'false'],
                ['certification_img', result.data.isImage === true ? 'true' : 'false'],
                ['reputation', result.data.reputation ? (result.data.reputation).toString() : '0'],
                ['events', result.data.emCount ? (result.data.emCount).toString() : '0'],
                ['id', (result.data.id).toString() || '0'],
                ['isAdmin', result.data.isAdmin === 'true' ? 'true' : 'false'],
            ]);

            router.replace("/(tabs)/acasa" as RelativePathString);
        } else if (result?.data.error) {
            Alert.alert(
                "Eroare de Autentificare!",
                `Nu există acest utilizator sau datele de autentificare furnizate sunt greșite!${result.data.IsValid}`,
            );
        }
    }

    return (
        <View style={styles.container}>
            {/* Logo from assets */}
            <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />


            <Text style={styles.title}>Autentificare</Text>

            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
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
        color: theme.colors.onPrimary,
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
    logo: {
        width: 250,
        height: 250,
        marginBottom: 20,
        position: 'absolute',
        top: 28,
        zIndex: 10,
        alignSelf: 'center',
    },
});

export default SignInPage;