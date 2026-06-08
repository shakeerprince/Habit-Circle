// Rithmic — Communities Screen
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Modal } from 'react-native';
import Animated, { FadeInUp, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { colors, radius, shadows } from '../../lib/theme';
import { Community } from '../../lib/types';

export default function CommunitiesScreen() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [myCommunities, setMyCommunities] = useState<Community[]>([]);
    const [searchQ, setSearchQ] = useState('');
    const [tab, setTab] = useState<'browse' | 'mine'>('mine');
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const load = () => {
        api.getCommunities(searchQ).then(setCommunities).catch(() => { });
        api.getMyCommunities().then(setMyCommunities).catch(() => { });
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { const t = setTimeout(() => api.getCommunities(searchQ).then(setCommunities).catch(() => { }), 300); return () => clearTimeout(t); }, [searchQ]);

    const handleJoin = async (id: string) => { await api.joinCommunity(id); load(); };
    const handleLeave = async (id: string) => { Alert.alert('Leave?', 'Leave this community?', [{ text: 'Cancel' }, { text: 'Leave', style: 'destructive', onPress: async () => { await api.leaveCommunity(id); load(); } }]); };
    const handleCreate = async () => {
        if (!newName.trim()) return;
        await api.createCommunity({ name: newName, description: newDesc, category: 'General' });
        setShowCreate(false); setNewName(''); setNewDesc(''); load();
    };

    const CommunityCard = ({ c, joined }: { c: Community; joined: boolean }) => (
        <View style={s.communityCard}>
            <View style={[s.communityIcon, { backgroundColor: c.bannerColor || colors.accentSoft }]}>
                <Text style={{ fontSize: 24 }}>{c.icon || '🏠'}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.communityName}>{c.name}</Text>
                <Text style={s.communityMeta}>{c.memberCount} members · {c.category}</Text>
                {c.description ? <Text style={s.communityDesc} numberOfLines={1}>{c.description}</Text> : null}
            </View>
            {joined ? (
                <Pressable style={s.chipOutline} onPress={() => handleLeave(c.id)}><Text style={s.chipOutlineText}>Leave</Text></Pressable>
            ) : (
                <Pressable style={s.btnPrimary} onPress={() => handleJoin(c.id)}><Text style={s.btnPrimaryText}>Join</Text></Pressable>
            )}
        </View>
    );

    return (
        <View style={s.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(100).springify()} style={s.header}>
                    <Text style={s.pageTitle}>Communities</Text>
                </Animated.View>

                <View style={s.tabRow}>
                    <Pressable style={[s.chip, tab === 'mine' && s.chipActive]} onPress={() => setTab('mine')}>
                        <Text style={[s.chipText, tab === 'mine' && s.chipTextActive]}>🏠 My Groups ({myCommunities.length})</Text>
                    </Pressable>
                    <Pressable style={[s.chip, tab === 'browse' && s.chipActive]} onPress={() => setTab('browse')}>
                        <Text style={[s.chipText, tab === 'browse' && s.chipTextActive]}>🌍 Browse</Text>
                    </Pressable>
                </View>

                <View style={{ paddingHorizontal: 16 }}>
                    {tab === 'browse' && (
                        <View style={s.searchWrap}>
                            <MaterialIcons name="search" size={20} color={colors.textMuted} style={{ position: 'absolute', left: 14, top: 14, zIndex: 1 }} />
                            <TextInput style={s.searchInput} placeholder="Search communities..." placeholderTextColor={colors.textMuted} value={searchQ} onChangeText={setSearchQ} />
                        </View>
                    )}

                    {(tab === 'mine' ? myCommunities : communities).map((c, i) => (
                        <Animated.View key={c.id} entering={FadeInUp.delay(i * 60)}>
                            <CommunityCard c={c} joined={tab === 'mine' || (c.isJoined ?? false)} />
                        </Animated.View>
                    ))}

                    {tab === 'mine' && myCommunities.length === 0 && (
                        <View style={{ alignItems: 'center', padding: 40 }}>
                            <Text style={{ fontSize: 32, marginBottom: 8 }}>🏠</Text>
                            <Text style={{ color: colors.textMuted, fontWeight: '600' }}>No communities yet</Text>
                            <Pressable style={[s.btnPrimary, { marginTop: 16 }]} onPress={() => setTab('browse')}>
                                <Text style={s.btnPrimaryText}>Browse Communities</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Pressable style={({ pressed }) => [s.fab, pressed && { transform: [{ scale: 0.9 }] }]} onPress={() => setShowCreate(true)}>
                <MaterialIcons name="add" size={28} color={colors.bgPrimary} />
            </Pressable>

            <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
                <Pressable style={s.modalOverlay} onPress={() => setShowCreate(false)}>
                    <Animated.View entering={SlideInDown.springify()}>
                        <Pressable style={s.modalCard} onPress={e => e.stopPropagation()}>
                            <Text style={s.modalTitle}>Create Community</Text>
                            <TextInput style={s.input} placeholder="Community name" placeholderTextColor={colors.textMuted} value={newName} onChangeText={setNewName} autoFocus />
                            <TextInput style={[s.input, { marginTop: 10 }]} placeholder="Description (optional)" placeholderTextColor={colors.textMuted} value={newDesc} onChangeText={setNewDesc} multiline />
                            <Pressable style={[s.btnPrimary, { width: '100%', marginTop: 12 }]} onPress={handleCreate}>
                                <Text style={s.btnPrimaryText}>Create</Text>
                            </Pressable>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
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
    communityCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    communityIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    communityName: { fontWeight: '700', fontSize: 15, color: colors.textPrimary },
    communityMeta: { fontSize: 12, color: colors.textMuted },
    communityDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    btnPrimary: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
    btnPrimaryText: { fontWeight: '700', fontSize: 12, color: colors.bgPrimary },
    chipOutline: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.danger },
    chipOutlineText: { fontSize: 12, fontWeight: '600', color: colors.danger },
    fab: { position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', ...shadows.accentBtn },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 24 },
    modalCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 24, borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontWeight: '800', fontSize: 18, color: colors.textPrimary, marginBottom: 16 },
    input: { backgroundColor: colors.bgInput, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 14, fontSize: 15, color: colors.textPrimary },
});
