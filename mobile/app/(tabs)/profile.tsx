// Rithmic — Profile Screen
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Switch } from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colors, radius, shadows, levelColor, badgeTierEmoji } from '../../lib/theme';
import { DashboardData, Badge } from '../../lib/types';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => { api.getDashboard().then(setData).catch(() => { }); }, []);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    const tierColor = data ? levelColor(data.level) : colors.border;
    const xpPercent = data?.xpToNext ? Math.round((data.xpInLevel / data.xpToNext) * 100) : 0;

    return (
        <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {/* Profile Card */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
                <LinearGradient colors={['rgba(124,92,252,0.12)', 'rgba(108,180,238,0.06)']} style={s.profileCard}>
                    <View style={[s.avatar, { borderColor: tierColor }]}>
                        <Text style={s.avatarText}>{user?.name?.[0] || '?'}</Text>
                        {data && <View style={[s.levelBadge, { backgroundColor: tierColor }]}><Text style={s.levelBadgeText}>Lv.{data.level}</Text></View>}
                    </View>
                    <Text style={s.name}>{user?.name || 'Loading...'}</Text>
                    {user?.bio ? <Text style={s.bio}>{user.bio}</Text> : null}
                    {user?.email && <Text style={s.email}>{user.email}</Text>}

                    {data && (
                        <View style={s.xpSection}>
                            <View style={s.xpBarBg}>
                                <LinearGradient colors={['#7c5cfc', '#6CB4EE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.xpBarFill, { width: `${xpPercent}%` }]} />
                            </View>
                            <Text style={s.xpText}>{data.xpInLevel} / {data.xpToNext} XP to Level {data.level + 1}</Text>
                        </View>
                    )}
                </LinearGradient>
            </Animated.View>

            <View style={{ paddingHorizontal: 16 }}>
                {/* Stats Grid */}
                {data && (
                    <Animated.View entering={FadeInUp.delay(200).springify()}>
                        <View style={s.statsGrid}>
                            {[
                                { icon: '⭐', label: 'Level', value: data.level },
                                { icon: '🔥', label: 'Streak', value: `${data.currentStreak}d` },
                                { icon: '📅', label: 'Login Days', value: data.loginStreak },
                            ].map((stat, i) => (
                                <View key={i} style={s.statCard}>
                                    <Text style={{ fontSize: 22 }}>{stat.icon}</Text>
                                    <Text style={s.statValue}>{stat.value}</Text>
                                    <Text style={s.statLabel}>{stat.label}</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {/* Badges */}
                <Animated.View entering={FadeInUp.delay(300).springify()}>
                    <Text style={s.sectionTitle}>🏅 Badges</Text>
                    <View style={s.card}>
                        {(data?.badges || []).length === 0 ? (
                            <Text style={s.empty}>No badges earned yet. Keep going!</Text>
                        ) : (
                            <View style={s.badgeGrid}>
                                {(data?.badges || []).map((b: Badge) => (
                                    <View key={b.id} style={[s.badgeItem, !b.isEarned && { opacity: 0.3 }]}>
                                        <View style={[s.badgeIcon, b.isEarned && { backgroundColor: 'rgba(124,92,252,0.15)' }]}>
                                            <Text style={{ fontSize: 24 }}>{badgeTierEmoji(b.tier)}</Text>
                                        </View>
                                        <Text style={s.badgeName} numberOfLines={2}>{b.name}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* Settings */}
                <Animated.View entering={FadeInUp.delay(400).springify()}>
                    <Text style={s.sectionTitle}>Settings</Text>
                    <View style={s.card}>
                        <Pressable style={s.settingRow} onPress={() => { }}>
                            <MaterialIcons name="notifications" size={20} color={colors.textSecondary} />
                            <Text style={s.settingText}>Notifications</Text>
                            <Switch value={true} disabled trackColor={{ true: colors.accentSoft, false: colors.border }} thumbColor={colors.accent} />
                        </Pressable>
                        <View style={s.divider} />
                        <Pressable style={s.settingRow} onPress={() => { }}>
                            <MaterialIcons name="info-outline" size={20} color={colors.textSecondary} />
                            <Text style={s.settingText}>About Rithmic</Text>
                            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                        </Pressable>
                        <View style={s.divider} />
                        <Pressable style={s.settingRow} onPress={handleLogout}>
                            <MaterialIcons name="logout" size={20} color={colors.danger} />
                            <Text style={[s.settingText, { color: colors.danger }]}>Sign Out</Text>
                            <MaterialIcons name="chevron-right" size={20} color={colors.danger} />
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    profileCard: { alignItems: 'center', padding: 28, paddingTop: 64, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    avatar: { width: 80, height: 80, borderRadius: 28, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center', borderWidth: 3, position: 'relative' },
    avatarText: { color: colors.accent, fontWeight: '800', fontSize: 32 },
    levelBadge: { position: 'absolute', bottom: -8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    levelBadgeText: { fontSize: 10, fontWeight: '800', color: '#000' },
    name: { fontWeight: '800', fontSize: 20, color: colors.textPrimary, marginTop: 16 },
    bio: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
    email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    xpSection: { width: '100%', marginTop: 20 },
    xpBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    xpBarFill: { height: '100%', borderRadius: 4 },
    xpText: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
    statsGrid: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 },
    statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    statValue: { fontWeight: '800', fontSize: 22, color: colors.textPrimary, marginTop: 4 },
    statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    sectionTitle: { fontWeight: '800', fontSize: 16, color: colors.textPrimary, marginTop: 20, marginBottom: 8 },
    card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
    badgeItem: { alignItems: 'center' },
    badgeIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceElevated, marginBottom: 4 },
    badgeName: { fontSize: 10, fontWeight: '600', color: colors.textPrimary, maxWidth: 70, textAlign: 'center' },
    settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
    settingText: { flex: 1, fontWeight: '600', fontSize: 14, color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.border },
    empty: { textAlign: 'center', color: colors.textMuted, padding: 16 },
});
