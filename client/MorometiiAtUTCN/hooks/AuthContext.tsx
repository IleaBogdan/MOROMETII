import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
    isAdmin: boolean;
    refreshAdminStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    isAdmin: false,
    refreshAdminStatus: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);

    const refreshAdminStatus = async () => {
        try {
            const value = await AsyncStorage.getItem('isAdmin');
            setIsAdmin(value === 'true');
        } catch (e) {
            console.error("Failed to fetch admin status", e);
        }
    };

    useEffect(() => {
        refreshAdminStatus();
    }, []);

    return (
        <AuthContext.Provider value={{ isAdmin, refreshAdminStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);