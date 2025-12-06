import { RelativePathString, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkLogin } from '@/api/apiCalls';
import { theme } from '@/theme/theme';

export default function Index() {
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const email = await AsyncStorage.getItem('email');
                const password = await AsyncStorage.getItem('password');

                if (email && password) {
                    const result = await checkLogin(email, password);

                    const isValid = result?.isValid === true || result?.exists === true;

                    if (isValid) {
                        router.replace('/(tabs)/acasa' as RelativePathString);
                    } else {
                        await AsyncStorage.multiRemove(['email', 'password']);
                        router.replace('/(tabs)/signin' as RelativePathString);
                    }
                } else {
                    router.replace('/(tabs)/signin' as RelativePathString);
                }
            } catch (error) {
                await AsyncStorage.multiRemove(['email', 'password']);
                router.replace('/(tabs)/signin' as RelativePathString);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, []);
    if (isChecking) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
});