// Rithmic — Friends Screen
import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { colors, radius } from '../../lib/theme';
import { User, FriendUser, FriendRequest } from '../../lib/types';

export default function FriendsScreen() {
    const [tab, setTab] = useState<'discover' | 'friends' | 'requests'>('discover');
    const [friends, setFriends] = useState<User[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FriendUser[]>([]);

    const loadData = useCallback(() => {
        api.getFriends().then(setFriends).catch(() => { });
        api.getFriendRequests().then(setRequests).catch(() => { });
        api.getSuggestions().then(setSuggestions).catch(() => { });
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const t = setTimeout(() => { api.searchUsers(searchQuery).then(setSearchResults).catch(() => { }); }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const handleAccept = async (id: string) => { await api.acceptFriendRequest(id); loadData(); };
    const handleReject = async (id: string) => { await api.rejectFriendRequest(id); setRequests(r => r.filter(req => req.id !== id)); };
    const handleSendRequest = async (userId: string) => {
        await api.sendFriendRequest(userId);
        setSearchResults(r => r.map(u => u.id === userId ? { ...u, friendStatus: 'pending' as const } : u));
        setSuggestions(s => s.map(u => u.id === userId ? { ...u, friendStatus: 'pending' as const } : u));
    };
    const handleRemove = async (id: string) => { await api.removeFriend(id); setFriends(f => f.filter(fr => fr.id !== id)); };

    const UserCard = ({ u, action }: { u: User | FriendUser; action?: React.ReactNode }) => (
        <View style={s.userCard}>
            <View style={s.avatar}><Text style={s.avatarText}>{u.name?.[0]}</Text></View>
            <View style={{ flex: 1 }}>
                <Text style={s.userName}>{u.name}</Text>
                <Text style={s.userMeta}>Lv.{u.level} · {u.xp} XP{u.loginStreak > 0 ? ` · 🔥${u.loginStreak}` : ''}</Text>
            </View>
            {action}
        </View>
    );

    const tabs: { key: typeof tab; label: string }[] = [
        { key: 'discover', label: '🌍 Discover' },
        { key: 'friends', label: `👥 Friends (${friends.length})` },
        { key: 'requests', label: `📩 Requests${requests.length ? ` (${requests.length})` : ''}` },
    ];

    return (
        <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <View style={s.header}>
                <Text style={s.pageTitle}>Friends</Text>
            </View>

            <View style={s.tabRow}>
                {tabs.map(t => (
                    <Pressable key={t.key} style={[s.chip, tab === t.key && s.chipActive]} onPress={() => setTab(t.key)}>
                        <Text style={[s.chipText, tab === t.key && s.chipTextActive]}>{t.label}</Text>
                    </Pressable>
                ))}
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                {tab === 'discover' && (
                    <>
                        <View style={s.searchWrap}>
                            <MaterialIcons name="search" size={20} color={colors.textMuted} style={{ position: 'absolute', left: 14, top: 14, zIndex: 1 }} />
                            <TextInput style={s.searchInput} placeholder="Search people..." placeholderTextColor={colors.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
                        </View>

                        {!searchQuery && suggestions.length > 0 && (
                            <>
                                <Text style={s.sectionLabel}>👋 Suggestions</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                                    {suggestions.slice(0, 10).map(u => (
                                        <View key={u.id} style={s.suggCard}>
                                            <View style={[s.avatar, { width: 48, height: 48, marginBottom: 8 }]}><Text style={[s.avatarText, { fontSize: 20 }]}>{u.name?.[0]}</Text></View>
                                            <Text style={{ fontWeight: '700', color: colors.textPrimary, fontSize: 13 }}>{u.name}</Text>
                                            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>Lv.{u.level}</Text>
                                            <Pressable style={s.btnPrimary} onPress={() => handleSendRequest(u.id)}>
                                                <Text style={s.btnPrimaryText}>{u.friendStatus === 'pending' ? 'Pending' : '+ Add'}</Text>
                                            </Pressable>
                                        </View>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        <Text style={s.sectionLabel}>{searchQuery ? `Results for "${searchQuery}"` : '🔎 All Members'}</Text>
                        {searchResults.map((u, i) => (
                            <Animated.View key={u.id} entering={FadeInUp.delay(i * 50)}>
                                <UserCard u={u} action={
                                    u.friendStatus === 'none' ? <Pressable style={s.btnPrimary} onPress={() => handleSendRequest(u.id)}><Text style={s.btnPrimaryText}>+ Add</Text></Pressable>
                                        : u.friendStatus === 'pending' ? <View style={s.chip}><Text style={s.chipText}>Pending</Text></View>
                                            : u.friendStatus === 'accepted' ? <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>✓ Friends</Text>
                                                : null
                                } />
                            </Animated.View>
                        ))}
                    </>
                )}

                {tab === 'friends' && friends.map((f, i) => (
                    <Animated.View key={f.id} entering={FadeInUp.delay(i * 50)}>
                        <UserCard u={f} action={<Pressable style={s.chip} onPress={() => handleRemove(f.id)}><Text style={s.chipText}>✕</Text></Pressable>} />
                    </Animated.View>
                ))}

                {tab === 'requests' && requests.map((r, i) => (
                    <Animated.View key={r.id} entering={FadeInUp.delay(i * 50)}>
                        <UserCard u={r.requester} action={
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                <Pressable style={s.btnPrimary} onPress={() => handleAccept(r.id)}><Text style={s.btnPrimaryText}>✓</Text></Pressable>
                                <Pressable style={s.chip} onPress={() => handleReject(r.id)}><Text style={s.chipText}>✕</Text></Pressable>
                            </View>
                        } />
                    </Animated.View>
                ))}

                {tab === 'friends' && friends.length === 0 && <Text style={s.empty}>No friends yet. Discover people!</Text>}
                {tab === 'requests' && requests.length === 0 && <Text style={s.empty}>No pending requests.</Text>}
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    header: { alignItems: 'center', paddingTop: 60, paddingBottom: 8 },
    pageTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
    tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
    chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border },
    chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    chipTextActive: { color: colors.bgPrimary },
    searchWrap: { position: 'relative', marginBottom: 16 },
    searchInput: { backgroundColor: colors.bgInput, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingLeft: 42, paddingRight: 18, paddingVertical: 12, fontSize: 15, color: colors.textPrimary },
    sectionLabel: { fontWeight: '800', fontSize: 14, color: colors.textMuted, marginBottom: 8, marginTop: 4 },
    userCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: colors.accent, fontWeight: '700', fontSize: 16 },
    userName: { fontWeight: '700', fontSize: 15, color: colors.textPrimary },
    userMeta: { fontSize: 12, color: colors.textMuted },
    suggCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, minWidth: 130, alignItems: 'center', padding: 14, marginRight: 10 },
    btnPrimary: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
    btnPrimaryText: { fontWeight: '700', fontSize: 12, color: colors.bgPrimary },
    empty: { textAlign: 'center', padding: 40, color: colors.textMuted },
});
