// ═══════════════════════════════════════════════════════════════
//  Rithmic — Dashboard Screen (Home)
//  Hero greeting, today's habits, XP, streak, challenges, etc.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { colors, radius, shadows, spacing, levelColor, badgeTierEmoji, gradients } from '../../lib/theme';
import { DashboardData, LeaderboardResponse, Habit } from '../../lib/types';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 5) return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function DashboardScreen() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
    const router = useRouter();

    useEffect(() => {
        api.getDashboard().then(setData).catch(() => { });
        api.getLeaderboard().then(setLeaderboard).catch(() => { });
    }, []);

    const handleStartHabit = async (id: string) => {
        try {
            await api.startHabit(id);
            setData(prev => prev ? { ...prev, habits: prev.habits.map(h => h.id === id ? { ...h, status: 'in_progress' as const } : h) } : null);
        } catch { }
    };

    const handleCompleteHabit = async (id: string) => {
        try {
            await api.completeHabit(id);
            setData(prev => prev ? {
                ...prev,
                habits: prev.habits.map(h => h.id === id ? { ...h, status: 'completed' as const } : h),
                momentumScore: Math.min(100, (prev.momentumScore || 0) + 1),
            } : null);
        } catch { }
    };

    if (!data) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const xpPercent = data.xpToNext ? Math.round((data.xpInLevel / data.xpToNext) * 100) : 0;
    const tierColor = levelColor(data.level);
    const todayHabits = data.habits.filter((h: Habit) => {
        const dow = new Date().getDay();
        const mapped = dow === 0 ? 7 : dow;
        return h.daysOfWeek.includes(mapped);
    });
    const completedToday = todayHabits.filter(h => h.status === 'completed').length;
    const todayPercent = todayHabits.length ? Math.round((completedToday / todayHabits.length) * 100) : 0;
    const activeChallenges = data.challenges || [];
    const communities = data.communities || [];
    const friends = data.friends || [];

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

            {/* ═══════ Hero Greeting ═══════ */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
                <LinearGradient colors={['rgba(124,92,252,0.12)', 'rgba(108,180,238,0.08)']} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.heroTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                            <Text style={styles.quote}>"{data.quote}"</Text>
                        </View>
                        <View style={styles.streakBadge}>
                            <MaterialIcons name="local-fire-department" size={18} color="#FFD93D" />
                            <Text style={styles.streakText}>{data.loginStreak}</Text>
                        </View>
                    </View>

                    {/* Stats pills */}
                    <View style={styles.statsRow}>
                        <View style={styles.statPill}>
                            <View style={[styles.statIcon, { backgroundColor: colors.accentSoft }]}><Text style={{ fontSize: 18 }}>✅</Text></View>
                            <View>
                                <Text style={styles.statValue}>{completedToday}/{todayHabits.length}</Text>
                                <Text style={styles.statLabel}>Today's Habits</Text>
                            </View>
                        </View>
                        <View style={styles.statPill}>
                            <View style={[styles.statIcon, { backgroundColor: 'rgba(74,222,128,0.15)' }]}><Text style={{ fontSize: 18 }}>⚡</Text></View>
                            <View>
                                <Text style={styles.statValue}>{data.momentumScore}</Text>
                                <Text style={styles.statLabel}>Momentum</Text>
                            </View>
                        </View>
                        <View style={styles.statPill}>
                            <View style={[styles.statIcon, { backgroundColor: tierColor }]}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#000' }}>Lv.{data.level}</Text>
                            </View>
                            <View>
                                <Text style={styles.statValue}>{data.xp}</Text>
                                <Text style={styles.statLabel}>Total XP</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>

            <View style={{ paddingHorizontal: 16 }}>

                {/* ═══════ Today's Habits ═══════ */}
                <Animated.View entering={FadeInUp.delay(200).springify()}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>📋 Today's Habits</Text>
                        <Text style={[styles.sectionBadge, todayPercent >= 80 && { color: colors.success }]}>{todayPercent}%</Text>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${todayPercent}%`, backgroundColor: todayPercent === 100 ? colors.success : colors.accent }]} />
                    </View>

                    {todayHabits.length === 0 && (
                        <View style={styles.card}><Text style={styles.emptyText}>No habits scheduled for today!</Text></View>
                    )}

                    {todayHabits.map((h, i) => {
                        const isCompleted = h.status === 'completed';
                        const isInProgress = h.status === 'in_progress';
                        return (
                            <Animated.View key={h.id} entering={FadeInUp.delay(250 + i * 60).springify()}>
                                <View style={[styles.habitCard, { borderLeftColor: isCompleted ? colors.success : isInProgress ? colors.accent : colors.border, opacity: isCompleted ? 0.7 : 1 }]}>
                                    <Pressable
                                        onPress={() => { if (isCompleted) return; if (isInProgress) handleCompleteHabit(h.id); else handleStartHabit(h.id); }}
                                        style={[styles.habitCheckbox, {
                                            backgroundColor: isCompleted ? colors.success : isInProgress ? colors.accent : colors.surfaceElevated,
                                        }]}
                                    >
                                        <Text style={{ color: isCompleted || isInProgress ? '#fff' : colors.textMuted, fontSize: 14 }}>
                                            {isCompleted ? '✓' : isInProgress ? '▶' : '○'}
                                        </Text>
                                    </Pressable>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.habitName, isCompleted && { textDecorationLine: 'line-through', color: colors.textMuted }]}>{h.name}</Text>
                                        <Text style={styles.habitMeta}>{h.category} · 🔥 {h.currentStreak} streak</Text>
                                    </View>
                                    {isCompleted && <Text style={[styles.habitStatus, { color: colors.success }]}>Done!</Text>}
                                    {isInProgress && <Text style={[styles.habitStatus, { color: colors.accent }]}>Tap to finish</Text>}
                                </View>
                            </Animated.View>
                        );
                    })}
                </Animated.View>

                {/* ═══════ Active Challenges ═══════ */}
                {activeChallenges.length > 0 && (
                    <Animated.View entering={FadeInUp.delay(400).springify()} style={{ marginTop: 20 }}>
                        <Text style={styles.sectionTitle}>🏆 Active Challenges</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                            {activeChallenges.slice(0, 3).map((ch) => (
                                <Pressable key={ch.id} style={[styles.challengeCard, { borderTopColor: ch.daysRemaining < 7 ? '#FF4D6A' : '#4ADE80' }]} onPress={() => { }}>
                                    <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textPrimary }}>{ch.title}</Text>
                                    <Text style={styles.challengeMeta}>⏰ {ch.daysRemaining}d left · {ch.participantCount} joined</Text>
                                    <View style={styles.challengeProgressBg}>
                                        <View style={[styles.challengeProgressFill, {
                                            width: `${Math.max(5, 100 - (ch.daysRemaining / 30 * 100))}%`,
                                            backgroundColor: ch.daysRemaining < 7 ? '#FF4D6A' : '#4ADE80',
                                        }]} />
                                    </View>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </Animated.View>
                )}

                {/* ═══════ XP & Level Card ═══════ */}
                <Animated.View entering={FadeInUp.delay(500).springify()}>
                    <View style={[styles.card, { marginTop: 20 }]}>
                        <View style={styles.xpHeader}>
                            <View style={[styles.levelBadge, { backgroundColor: tierColor }]}>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: '#000' }}>Lv.{data.level}</Text>
                            </View>
                            <View>
                                <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textPrimary }}>Level {data.level}</Text>
                                <Text style={{ fontSize: 12, color: colors.textMuted }}>{data.xp} XP total</Text>
                            </View>
                        </View>
                        <View style={styles.xpBarBg}>
                            <LinearGradient colors={['#7c5cfc', '#6CB4EE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
                        </View>
                        <View style={styles.xpLabels}>
                            <Text style={styles.xpLabelText}>{data.xpInLevel} / {data.xpToNext} XP</Text>
                            <Text style={styles.xpLabelText}>Next: Level {data.level + 1}</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* ═══════ Weekly Streak ═══════ */}
                <Animated.View entering={FadeInUp.delay(600).springify()}>
                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>🔥 This Week</Text>
                    <View style={[styles.card, { marginTop: 8 }]}>
                        <View style={styles.weekRow}>
                            {(data.weeklyStreak || []).map((s, i) => (
                                <View key={i} style={{ alignItems: 'center' }}>
                                    <View style={[styles.weekDot, {
                                        backgroundColor: s === 'completed' ? colors.success : s === 'missed' ? 'rgba(255,77,106,0.2)' : colors.bgCard,
                                    }]}>
                                        <Text style={{ color: s === 'completed' ? '#fff' : s === 'missed' ? '#FF4D6A' : colors.textMuted, fontSize: 14 }}>
                                            {s === 'completed' ? '✓' : s === 'missed' ? '✗' : '·'}
                                        </Text>
                                    </View>
                                    <Text style={styles.weekLabel}>{weekDays[i]}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </Animated.View>

                {/* ═══════ Friends ═══════ */}
                {friends.length > 0 && (
                    <Animated.View entering={FadeInUp.delay(700).springify()} style={{ marginTop: 20 }}>
                        <Text style={styles.sectionTitle}>👥 Friends</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                            {friends.slice(0, 8).map((f) => (
                                <Pressable key={f.id} style={styles.friendCard} onPress={() => { }}>
                                    <View style={styles.friendAvatar}><Text style={styles.friendAvatarText}>{f.name?.[0]}</Text></View>
                                    <Text style={styles.friendName} numberOfLines={1}>{f.name?.split(' ')[0]}</Text>
                                    <Text style={styles.friendMeta}>🔥 {f.loginStreak || 0}d · Lv.{f.level}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </Animated.View>
                )}

                {/* ═══════ Leaderboard ═══════ */}
                {leaderboard && (
                    <Animated.View entering={FadeInUp.delay(800).springify()} style={{ marginTop: 20 }}>
                        <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
                        <View style={[styles.card, { marginTop: 8 }]}>
                            {leaderboard.leaderboard.slice(0, 5).map((u) => (
                                <View key={u.id} style={[styles.leaderboardRow, u.isCurrentUser && styles.leaderboardMe]}>
                                    <View style={[styles.leaderboardRank, {
                                        backgroundColor: u.rank === 1 ? '#FFD700' : u.rank === 2 ? '#C0C0C0' : u.rank === 3 ? '#CD7F32' : colors.bgCardHover,
                                    }]}>
                                        <Text style={{ fontSize: 12, fontWeight: '800', color: u.rank <= 3 ? '#000' : colors.textSecondary }}>
                                            {u.rank <= 3 ? ['🥇', '🥈', '🥉'][u.rank - 1] : `#${u.rank}`}
                                        </Text>
                                    </View>
                                    <View style={styles.leaderboardAvatar}><Text style={{ color: colors.accent, fontWeight: '700' }}>{u.name?.[0]}</Text></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontWeight: '600', fontSize: 13, color: colors.textPrimary }}>{u.name} {u.isCurrentUser ? '(You)' : ''}</Text>
                                        <Text style={{ fontSize: 11, color: colors.textMuted }}>Level {u.level}</Text>
                                    </View>
                                    <Text style={{ fontWeight: '700', fontSize: 13, color: colors.accent }}>{u.xp} XP</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {/* ═══════ Badges ═══════ */}
                <Animated.View entering={FadeInUp.delay(900).springify()} style={{ marginTop: 20 }}>
                    <Text style={styles.sectionTitle}>🏅 Badges</Text>
                    <View style={[styles.card, { marginTop: 8 }]}>
                        <View style={styles.badgeGrid}>
                            {(data.badges || []).map((b) => (
                                <View key={b.id} style={[styles.badgeItem, { opacity: b.isEarned ? 1 : 0.3 }]}>
                                    <View style={[styles.badgeIcon, { backgroundColor: b.isEarned ? 'rgba(124,92,252,0.15)' : colors.surfaceElevated }]}>
                                        <Text style={{ fontSize: 26 }}>{badgeTierEmoji(b.tier)}</Text>
                                    </View>
                                    <Text style={styles.badgeName} numberOfLines={2}>{b.name}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </Animated.View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    loadingContainer: { flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' },

    // Hero
    heroCard: { padding: 20, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 16 },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    greeting: { fontSize: 24, fontWeight: '900', color: colors.textPrimary },
    quote: { fontSize: 13, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,217,61,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    streakText: { fontWeight: '800', fontSize: 15, color: '#FFD93D' },

    // Stats
    statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    statPill: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
    statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontWeight: '800', fontSize: 18, color: colors.textPrimary },
    statLabel: { fontSize: 10, color: colors.textMuted },

    // Section
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    sectionTitle: { fontWeight: '800', fontSize: 16, color: colors.textPrimary },
    sectionBadge: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },

    // Progress bar
    progressBarBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },

    // Cards
    card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
    emptyText: { textAlign: 'center', color: colors.textMuted, padding: 20 },

    // Habit card
    habitCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    habitCheckbox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    habitName: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },
    habitMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    habitStatus: { fontSize: 11, fontWeight: '700' },

    // Challenge
    challengeCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, borderTopWidth: 3, minWidth: 220, marginRight: 10 },
    challengeMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 8 },
    challengeProgressBg: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
    challengeProgressFill: { height: '100%', borderRadius: 2 },

    // XP
    xpHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    levelBadge: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    xpBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    xpBarFill: { height: '100%', borderRadius: 4 },
    xpLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    xpLabelText: { fontSize: 11, color: colors.textMuted },

    // Week
    weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
    weekDot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    weekLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

    // Friends
    friendCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: colors.border, minWidth: 100, alignItems: 'center', marginRight: 8 },
    friendAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    friendAvatarText: { color: colors.accent, fontWeight: '700', fontSize: 18 },
    friendName: { fontWeight: '600', fontSize: 12, color: colors.textPrimary, maxWidth: 80, textAlign: 'center' },
    friendMeta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

    // Leaderboard
    leaderboardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    leaderboardMe: { backgroundColor: colors.accentSoft, borderRadius: radius.md, paddingHorizontal: 8 },
    leaderboardRank: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    leaderboardAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center' },

    // Badges
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
    badgeItem: { alignItems: 'center' },
    badgeIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    badgeName: { fontSize: 10, fontWeight: '600', color: colors.textPrimary, maxWidth: 70, textAlign: 'center', lineHeight: 13 },
});
