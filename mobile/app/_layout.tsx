// ═══════════════════════════════════════════════════════════════
//  Rithmic — Root Layout (Expo Router)
//  Auth provider, status bar, navigation guard
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors } from '../lib/theme';

function RootLayoutNav() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        const seg = segments as string[];
        const inAuth = seg[0] === 'login' || seg.length === 0;

        if (!user && !inAuth) {
            router.replace('/');
        } else if (user && inAuth) {
            router.replace('/(tabs)/dashboard');
        }
    }, [user, isLoading, segments]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    return <Slot />;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="light" backgroundColor={colors.bgPrimary} />
            <RootLayoutNav />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
