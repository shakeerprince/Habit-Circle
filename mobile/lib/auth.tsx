// ═══════════════════════════════════════════════════════════════
//  Rithmic — Auth Context
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { User } from './types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ loginReward: number }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: true,
    login: async () => ({ loginReward: 0 }),
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        (async () => {
            try {
                const storedToken = await AsyncStorage.getItem('hc_token');
                const storedUser = await AsyncStorage.getItem('hc_user');
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch { }
            setIsLoading(false);
        })();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.login(email, password);
        setToken(res.token);
        setUser(res.user);
        await AsyncStorage.setItem('hc_token', res.token);
        await AsyncStorage.setItem('hc_user', JSON.stringify(res.user));
        return { loginReward: res.loginReward };
    }, []);

    const logout = useCallback(async () => {
        setToken(null);
        setUser(null);
        await AsyncStorage.multiRemove(['hc_token', 'hc_user']);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
