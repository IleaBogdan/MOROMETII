import { _handleSignUp } from "@/api/apiCalls";
import { useDynamicTheme } from "@/theme/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RelativePathString, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const theme = useDynamicTheme();

const SignUpPage: React.FC = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmpassword, setconfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRedirectToSignUp = () => {
        router.push("/(tabs)/signin" as RelativePathString);
    };

    const handleSignUp = async () => {
        if (password !== confirmpassword) {
            Alert.alert("Eroare", "Passwords do not match!");
            return;
        }

        const result = await _handleSignUp(setLoading, username, email, password, router);

        if (result && result.data && result.data.IsValid) {
            try {
                await AsyncStorage.multiSet([
                    ['username', result.data.Username || ''],
                    ['email', email.trim()],
                    ['password', password.trim()],
                    ['isVerified', result.data.isVerified ? 'true' : 'false'],
                    ['certification_img', result.data.isImage ? 'true' : 'false'],
                    ['reputation', (result.data.reputation || 0).toString()],
                    ['events', (result.data.EmCount || 0).toString()],
                    ['id', result.data.Id.toString()],
                    ['isAdmin', result.data.isAdmin ? 'true' : 'false'],
                ]);

                Alert.alert(
                    "Succes!",
                    "Contul a fost creat cu succes!",
                    [
                        {
                            text: "OK",
                            onPress: () => router.push("/(tabs)/acasa" as RelativePathString),
                        },
                    ]
                );
            } catch (storageError) {
                console.error("AsyncStorage error:", storageError);
                Alert.alert("Eroare", "Contul a fost creat dar nu s-au putut salva datele local");
            }
        } else {
        }
    };

    return (
        <View style={styles.container}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />


            <Text style={styles.title}>Înregistrare</Text>

            <TextInput
                style={styles.input}
                placeholder="Utilizator"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
            />

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

            <TextInput
                style={styles.input}
                placeholder="Confirmarea Parolei"
                placeholderTextColor="#999"
                value={confirmpassword}
                onChangeText={setconfirmPassword}
                secureTextEntry
                editable={!loading}
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={theme.colors.onBackground} />
                ) : (
                    <Text style={styles.buttonText}>Înregistrare</Text>
                )}
            </TouchableOpacity>

            <View style={styles.signupPrompt}>
                <Text style={styles.bottom_text}>
                    Ai un cont deja?
                </Text>
                <TouchableOpacity onPress={handleRedirectToSignUp}><Text style={styles.signupLink}>Autentifică-te!</Text></TouchableOpacity>
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
    signupLink: {
        color: theme.colors.secondary,
        fontWeight: "bold",
        marginLeft: 5,
    },
    bottom_text: {
        color: theme.colors.onBackground,
    },
    signupPrompt: {
        flexDirection: "row",
        marginTop: 20,
        justifyContent: "center",
        alignItems: "center",
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
    buttonDisabled: {
        backgroundColor: "#ccc",
    },
    buttonText: {
        color: theme.colors.onPrimary,
        fontSize: 18,
        fontWeight: "bold",
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

export default SignUpPage;