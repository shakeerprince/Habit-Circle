"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { User, FriendUser, FriendRequest } from "@/../shared/types";
import { useToast } from "@/components/ToastProvider";
import { ErrorState } from "@/components/ErrorState";

export default function FriendsPage() {
    const [tab, setTab] = useState<"friends" | "requests" | "discover" | "sent">("discover");
    const [friends, setFriends] = useState<User[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    const loadFriends = useCallback(() => {
        setHasError(false);
        Promise.all([
            api.getFriends(),
            api.getFriendRequests()
        ]).then(([f, r]) => {
            setFriends(f);
            setRequests(r);
        }).catch(() => {
            setHasError(true);
        });
    }, []);

    useEffect(() => {
        setLoading(true);
        loadFriends();
        // Load suggestions (people you may know)
        api.getSuggestions().then(setSuggestions).catch(() => { });
        // Load all users on initial load
        api.searchUsers("").then(setSearchResults).catch(() => { });
        setLoading(false);
    }, [loadFriends]);

    useEffect(() => {
        const t = setTimeout(() => {
            api.searchUsers(searchQuery).then(setSearchResults).catch(() => { });
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const handleAccept = async (id: string) => {
        try {
            await api.acceptFriendRequest(id);
            loadFriends();
            api.getSuggestions().then(setSuggestions).catch(() => { });
            showToast("Friend request accepted", "success");
        } catch {
            showToast("Failed to accept request.", "error");
        }
    };

    const handleReject = async (id: string) => {
        try {
            await api.rejectFriendRequest(id);
            setRequests(r => r.filter(req => req.id !== id));
            showToast("Request rejected", "info");
        } catch {
            showToast("Failed to reject request.", "error");
        }
    };

    const handleSendRequest = async (userId: string) => {
        try {
            await api.sendFriendRequest(userId);
            setSearchResults(r => r.map(u => u.id === userId ? { ...u, friendStatus: "pending" as const } : u));
            setSuggestions(s => s.map(u => u.id === userId ? { ...u, friendStatus: "pending" as const } : u));
            showToast("Friend request sent", "success");
        } catch { 
            showToast("Failed to send request.", "error");
        }
    };

    const handleRemove = async (friendId: string) => {
        try {
            await api.removeFriend(friendId);
            setFriends(f => f.filter(fr => fr.id !== friendId));
            showToast("Friend removed", "info");
        } catch {
            showToast("Failed to remove friend.", "error");
        }
    };

    const levelColor = (level: number) => {
        if (level >= 8) return "#FFD700";
        if (level >= 5) return "#C0C0C0";
        return "#CD7F32";
    };

    const UserCard = ({ u, action }: { u: User | FriendUser; action?: React.ReactNode }) => (
        <div className="hc-card interactive" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="avatar" style={{ background: "var(--accent-soft)", color: "var(--accent)", position: "relative" }}
                onClick={() => router.push(`/user/${u.id}`)}>
                {u.name?.[0]}
                <span className="profile-level-badge" style={{ background: levelColor(u.level || 1) }}>
                    {u.level || 1}
                </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }} onClick={() => router.push(`/user/${u.id}`)}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Level {u.level || 1} · {u.xp || 0} XP
                    {u.loginStreak > 0 && <span> · 🔥 {u.loginStreak}</span>}
                </div>
                {u.bio && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.bio}</div>}
            </div>
            {action}
        </div>
    );

    if (hasError) return (
        <ErrorState 
            title="Friends Unavailable" 
            message="We couldn't load your friends list. Please try again." 
            onRetry={loadFriends} 
        />
    );

    return (
        <div className="page" style={{ paddingBottom: 100 }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
                <h1 className="page-title">Friends</h1>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                    {friends.length} friend{friends.length !== 1 ? "s" : ""}
                    {requests.length > 0 && <span style={{ color: "var(--danger)", fontWeight: 700 }}> · {requests.length} pending</span>}
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto" }}>
                {([
                    { key: "discover", icon: "🌍", label: "Discover" },
                    { key: "friends", icon: "👥", label: `Friends (${friends.length})` },
                    { key: "requests", icon: "📩", label: `Requests${requests.length ? ` (${requests.length})` : ""}` },
                ] as const).map(t => (
                    <button key={t.key} className={`hc-chip ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}
                        style={{ whiteSpace: "nowrap" }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ─── Discover ──────────────── */}
            {tab === "discover" && (
                <div>
                    {/* Search Bar */}
                    <div style={{ position: "relative", marginBottom: 16 }}>
                        <span className="material-icons" style={{
                            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                            color: "var(--text-muted)", fontSize: 20
                        }}>search</span>
                        <input className="input-field" placeholder="Search people..." value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: 42 }} />
                    </div>

                    {/* Suggestions — People you may know */}
                    {!searchQuery && suggestions.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14, marginBottom: 10, color: "var(--text-muted)" }}>
                                👋 People you may know
                            </h3>
                            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                                {suggestions.slice(0, 10).map((u: FriendUser) => (
                                    <div key={u.id} className="hc-card" style={{
                                        minWidth: 140, maxWidth: 160, textAlign: "center", padding: "16px 12px", flexShrink: 0,
                                    }}>
                                        <div className="avatar" style={{
                                            background: "var(--accent-soft)", color: "var(--accent)",
                                            margin: "0 auto 8px", width: 52, height: 52, fontSize: 22,
                                        }} onClick={() => router.push(`/user/${u.id}`)}>
                                            {u.name?.[0]}
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{u.name}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                                            Lv.{u.level} · {u.xp} XP
                                        </div>
                                        <button className="btn-primary btn-sm" style={{ width: "100%", fontSize: 12 }}
                                            onClick={() => handleSendRequest(u.id)}>
                                            {u.friendStatus === "pending" ? "Pending" : "+ Add"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Users */}
                    <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14, marginBottom: 10, color: "var(--text-muted)" }}>
                        {searchQuery ? `Results for "${searchQuery}"` : "🔎 All Members"}
                    </h3>
                    <div className="stagger">
                        {searchResults.length === 0 && (
                            <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>
                                <p style={{ fontWeight: 600 }}>No users found</p>
                            </div>
                        )}
                        {searchResults.map((u: FriendUser) => (
                            <UserCard key={u.id} u={u} action={
                                u.friendStatus === "none" ? (
                                    <button className="btn-primary btn-sm" onClick={() => handleSendRequest(u.id)}>+ Add</button>
                                ) : u.friendStatus === "pending" ? (
                                    <span className="hc-chip" style={{ fontSize: 11, opacity: 0.7 }}>Pending</span>
                                ) : u.friendStatus === "accepted" ? (
                                    <span className="badge-completed">✓ Friends</span>
                                ) : null
                            } />
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Friends List ──────────────── */}
            {tab === "friends" && (
                <div className="stagger">
                    {friends.length === 0 && !loading && (
                        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                            <p style={{ fontSize: 32, marginBottom: 8 }}>👋</p>
                            <p style={{ fontWeight: 600 }}>No friends yet</p>
                            <p style={{ fontSize: 13, marginTop: 4 }}>Discover people and send friend requests!</p>
                            <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setTab("discover")}>
                                🌍 Discover People
                            </button>
                        </div>
                    )}
                    {friends.map(f => (
                        <UserCard key={f.id} u={f} action={
                            <button className="hc-chip" style={{ fontSize: 11 }}
                                onClick={e => { e.stopPropagation(); handleRemove(f.id); }}>✕</button>
                        } />
                    ))}
                </div>
            )}

            {/* ─── Requests ──────────────── */}
            {tab === "requests" && (
                <div className="stagger">
                    {requests.length === 0 && (
                        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                            <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
                            <p style={{ fontWeight: 600 }}>No pending requests</p>
                        </div>
                    )}
                    {requests.map(r => (
                        <UserCard key={r.id} u={r.requester} action={
                            <div style={{ display: "flex", gap: 6 }}>
                                <button className="btn-primary btn-sm" onClick={() => handleAccept(r.id)}>✓ Accept</button>
                                <button className="hc-chip" style={{ fontSize: 12 }} onClick={() => handleReject(r.id)}>✕</button>
                            </div>
                        } />
                    ))}
                </div>
            )}
        </div>
    );
}
