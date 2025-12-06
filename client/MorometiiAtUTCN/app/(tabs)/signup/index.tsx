import { _handleSignUp } from "@/api/apiCalls";
import { useDynamicTheme } from "@/theme/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RelativePathString, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
        if(password!==confirmpassword){
            Alert.alert("Passwords do not match!");
            return null;
        }
        const result=await _handleSignUp(setLoading,username,email,password);
        if(result&&result.data&&result.data.isValid&&result.response.ok){
            await AsyncStorage.multiSet([
                ['email', email.trim()],
                ['password', password.trim()]
            ]);
            router.push("/(tabs)/acasa" as RelativePathString);
        } else {
            Alert.alert(
                "Eroare de SignUp!",
                "Nu s-a putut face contul"
            );
        }
    };

    return (
        <View style={styles.container}>
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
                    <ActivityIndicator color="#fff" />
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
        color: "white",
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
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default SignUpPage;