// ═══════════════════════════════════════════════════════════════
//  Rithmic — Tasks Screen
//  Date selector, habit list, create modal, confetti
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, ZoomIn, SlideInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../../lib/api';
import { getHabitCompleteQuote } from '../../lib/motivational';
import { colors, radius, shadows, spacing, HABIT_COLORS } from '../../lib/theme';
import { Habit, HabitEntry } from '../../lib/types';

export default function TasksScreen() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [entries, setEntries] = useState<HabitEntry[]>([]);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [celebration, setCelebration] = useState<{ show: boolean; xp: number; quote: string; streak: number } | null>(null);
    const router = useRouter();

    const loadData = useCallback(async () => {
        try {
            const [h, e] = await Promise.all([api.getHabits(), api.getEntries(selectedDate)]);
            setHabits(h);
            setEntries(e);
        } catch { }
    }, [selectedDate]);

    useEffect(() => { loadData(); }, [loadData]);

    const getStatus = (habitId: string) => entries.find(e => e.habitId === habitId)?.status || 'pending';

    const handleStart = async (id: string) => {
        await api.startHabit(id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        loadData();
    };

    const handleComplete = async (id: string) => {
        try {
            const result = await api.completeHabit(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCelebration({ show: true, xp: result.xpEarned || 25, quote: getHabitCompleteQuote(), streak: result.newStreak || 0 });
            setTimeout(() => setCelebration(null), 3500);
            loadData();
        } catch { loadData(); }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        await api.createHabit({ name: newName, category: 'Custom' });
        setNewName('');
        setShowCreate(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        loadData();
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Delete Habit', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await api.deleteHabit(id); loadData(); } },
        ]);
    };

    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 3 + i);
        return { date: d.toISOString().split('T')[0], day: d.toLocaleDateString('en', { weekday: 'short' }), num: d.getDate() };
    });

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                {/* Header */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
                    <Text style={styles.pageTitle}>My Habits</Text>
                    <Pressable onPress={() => router.push('/notifications' as any)} style={{ padding: 6 }}>
                        <MaterialIcons name="notifications" size={24} color={colors.textMuted} />
                    </Pressable>
                </Animated.View>

                {/* Date Selector */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <View style={styles.dateRow}>
                        {dates.map(d => (
                            <Pressable
                                key={d.date}
                                onPress={() => setSelectedDate(d.date)}
                                style={[styles.dateCell, d.date === selectedDate && styles.dateCellActive]}
                            >
                                <Text style={[styles.dateDayName, d.date === selectedDate && { color: '#fff' }]}>{d.day}</Text>
                                <Text style={[styles.dateDayNum, d.date === selectedDate && { color: '#fff' }]}>{d.num}</Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                {/* Habits List */}
                {habits.map((habit, idx) => {
                    const status = getStatus(habit.id);
                    const color = HABIT_COLORS[idx % HABIT_COLORS.length];
                    return (
                        <Animated.View key={habit.id} entering={FadeInUp.delay(300 + idx * 60).springify()}>
                            <View style={[styles.habitCard, { borderLeftColor: color }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.habitName}>{habit.name}</Text>
                                    <Text style={styles.habitMeta}>{habit.category} · 🔥 {habit.currentStreak} day streak</Text>
                                </View>
                                <View style={styles.habitActions}>
                                    {status === 'pending' && (
                                        <Pressable style={styles.btnPrimary} onPress={() => handleStart(habit.id)}>
                                            <Text style={styles.btnPrimaryText}>Start</Text>
                                        </Pressable>
                                    )}
                                    {status === 'in_progress' && (
                                        <Pressable style={[styles.btnPrimary, { backgroundColor: colors.success }]} onPress={() => handleComplete(habit.id)}>
                                            <Text style={styles.btnPrimaryText}>✓ Done</Text>
                                        </Pressable>
                                    )}
                                    {status === 'completed' && (
                                        <View style={styles.completedBadge}>
                                            <MaterialIcons name="check-circle" size={16} color={colors.success} />
                                            <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>Done</Text>
                                        </View>
                                    )}
                                    <Pressable onPress={() => handleDelete(habit.id)} style={{ padding: 4 }}>
                                        <MaterialIcons name="delete-outline" size={18} color={colors.textMuted} />
                                    </Pressable>
                                </View>
                            </View>
                        </Animated.View>
                    );
                })}

                {habits.length === 0 && (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="add-task" size={48} color={colors.textMuted} style={{ opacity: 0.3 }} />
                        <Text style={styles.emptyText}>No habits yet. Tap + to create one!</Text>
                    </View>
                )}
            </ScrollView>

            {/* XP Celebration Overlay */}
            {celebration?.show && (
                <View style={styles.celebrationOverlay}>
                    <Animated.View entering={ZoomIn.springify()} style={styles.xpPopup}>
                        <Text style={styles.xpAmount}>+{celebration.xp} XP</Text>
                        <Text style={styles.xpQuote}>{celebration.quote}</Text>
                        {celebration.streak > 0 && (
                            <Text style={styles.xpStreak}>🔥 {celebration.streak} day streak</Text>
                        )}
                    </Animated.View>
                </View>
            )}

            {/* FAB */}
            <Pressable style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.9 }] }]} onPress={() => setShowCreate(true)}>
                <MaterialIcons name="add" size={28} color={colors.bgPrimary} />
            </Pressable>

            {/* Create Habit Modal */}
            <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowCreate(false)}>
                    <Animated.View entering={SlideInDown.springify()}>
                        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                            <Text style={styles.modalTitle}>New Habit</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Habit name"
                                placeholderTextColor={colors.textMuted}
                                value={newName}
                                onChangeText={setNewName}
                                onSubmitEditing={handleCreate}
                                autoFocus
                            />
                            <Pressable style={[styles.btnPrimary, { width: '100%', marginTop: 12 }]} onPress={handleCreate}>
                                <Text style={styles.btnPrimaryText}>Create</Text>
                            </Pressable>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
    pageTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },

    dateRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20 },
    dateCell: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14 },
    dateCellActive: { backgroundColor: colors.accent, ...shadows.accentBtn },
    dateDayName: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
    dateDayNum: { fontSize: 16, fontWeight: '700', marginTop: 2, color: colors.textPrimary },

    habitCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10 },
    habitName: { fontWeight: '700', fontSize: 15, color: colors.textPrimary },
    habitMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    habitActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },

    btnPrimary: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
    btnPrimaryText: { fontWeight: '700', fontSize: 13, color: colors.bgPrimary },

    completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74,222,128,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },

    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { color: colors.textMuted, marginTop: 8 },

    fab: { position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', ...shadows.accentBtn },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 24 },
    modalCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 24, borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontWeight: '800', fontSize: 18, color: colors.textPrimary, marginBottom: 16 },
    input: { backgroundColor: colors.bgInput, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 14, fontSize: 15, color: colors.textPrimary },

    celebrationOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 },
    xpPopup: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: colors.accent, ...shadows.glow },
    xpAmount: { fontSize: 36, fontWeight: '900', color: colors.accent, marginBottom: 8 },
    xpQuote: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 8 },
    xpStreak: { fontSize: 16, fontWeight: '700', color: '#FFD93D' },
});
