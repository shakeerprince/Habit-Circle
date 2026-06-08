// ═══════════════════════════════════════════════════════════════
//  Rithmic — Login Screen
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../lib/auth';
import { colors, radius, shadows, spacing } from '../lib/theme';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState<string | null>(null);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        setLoading(true);
        try {
            const res = await login(email, password);
            if (res.loginReward > 0) {
                Alert.alert('🔥 Welcome Back!', `You earned ${res.loginReward} XP for your login streak!`);
            }
            router.replace('/(tabs)/dashboard');
        } catch (err: any) {
            Alert.alert('Login Failed', err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.content}>
                {/* Logo */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoSection}>
                    <Text style={styles.logo}>Rithmic</Text>
                    <Text style={styles.tagline}>Build habits. Together.</Text>
                </Animated.View>

                {/* Form */}
                <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, focused === 'email' && styles.inputFocused]}
                        placeholder="you@example.com"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused(null)}
                    />

                    <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
                    <TextInput
                        style={[styles.input, focused === 'password' && styles.inputFocused]}
                        placeholder="••••••••"
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused(null)}
                    />

                    <Pressable
                        style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.bgPrimary} />
                        ) : (
                            <Text style={styles.loginBtnText}>Sign In</Text>
                        )}
                    </Pressable>
                </Animated.View>

                {/* Footer */}
                <Animated.View entering={FadeInUp.delay(500).springify()}>
                    <Text style={styles.footer}>
                        Don't have an account? Contact your community admin.
                    </Text>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        fontSize: 36,
        fontWeight: '900',
        color: colors.accent,
        letterSpacing: 1.5,
    },
    tagline: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
    },
    form: {},
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 6,
    },
    input: {
        backgroundColor: colors.bgInput,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 15,
        color: colors.textPrimary,
    },
    inputFocused: {
        borderColor: colors.accent,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    loginBtn: {
        backgroundColor: colors.accent,
        borderRadius: radius.full,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 28,
        ...shadows.accentBtn,
    },
    loginBtnPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
    loginBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.bgPrimary,
    },
    footer: {
        textAlign: 'center',
        color: colors.textMuted,
        fontSize: 13,
        marginTop: 32,
    },
});
