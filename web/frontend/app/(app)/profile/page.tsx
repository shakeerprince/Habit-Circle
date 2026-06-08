"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import { Heatmap } from "@/components/Heatmap";
import { DashboardData, User, Badge } from "@/../shared/types";

export default function ProfilePage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        api.getDashboard().then(setData).catch(() => { });
        const stored = localStorage.getItem("hc_user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, []);

    const xpPercent = data?.xpToNext ? Math.round((data.xpInLevel / data.xpToNext) * 100) : 0;

    return (
        <div className="page-scroll" style={{ paddingBottom: 100 }}>
            <div style={{ padding: "16px 20px 8px" }}>
                <h1 className="page-title" style={{ margin: 0 }}>Profile</h1>
            </div>

            {/* Profile Card */}
            <div className="hc-card" style={{ textAlign: "center", padding: 24 }}>
                <div className="avatar avatar-xl" style={{ background: "var(--accent-soft)", color: "var(--accent)", margin: "0 auto 12px", position: "relative" }}>
                    {user?.name?.[0] || "?"}
                    {data && (
                        <div className="profile-level-badge">Lv.{data.level}</div>
                    )}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name || "Loading..."}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{user?.bio || ""}</div>

                {/* XP Progress */}
                {data && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                            <span>Level {data.level}</span>
                            <span>{data.xp} XP total</span>
                        </div>
                        <div className="xp-bar-container">
                            <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                            {data.xpInLevel} / {data.xpToNext} XP to Level {data.level + 1}
                        </div>
                    </div>
                )}
            </div>

            {/* Stats */}
            {data && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "12px 0" }}>
                    <div className="hc-card" style={{ textAlign: "center", padding: 16 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>{data.level}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Level</div>
                    </div>
                    <div className="hc-card" style={{ textAlign: "center", padding: 16 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--success)" }}>{data.currentStreak}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Streak</div>
                    </div>
                    <div className="hc-card" style={{ textAlign: "center", padding: 16 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#FFD93D" }}>🔥 {data.loginStreak}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Login Days</div>
                    </div>
                </div>
            )}

            {/* Heatmap */}
            <div style={{ marginBottom: 16 }}>
                <Heatmap />
            </div>

            {/* Badges */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>🏅 Badges</div>
                <button className="btn-primary btn-sm" onClick={() => router.push("/achievements")}>
                    View All
                </button>
            </div>
            <div className="hc-card" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                {(data?.badges || []).map((b: Badge) => (
                    <div key={b.id} style={{ textAlign: "center", opacity: b.isEarned ? 1 : 0.3, padding: 8, borderRadius: 12, background: b.isEarned ? "var(--card-hover)" : "transparent", transition: "all 0.3s" }}>
                        <div style={{ fontSize: 32 }}>
                            {b.tier === "diamond" ? "💎" : b.tier === "gold" ? "🥇" : b.tier === "silver" ? "🥈" : "🥉"}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, maxWidth: 80 }}>{b.name}</div>
                        {b.isEarned && <div style={{ fontSize: 9, color: "var(--success)", marginTop: 2 }}>Earned!</div>}
                    </div>
                ))}
            </div>

            {/* Analytics Link */}
            <div className="hc-card interactive" style={{ marginTop: 16, textAlign: "center", padding: 16 }} onClick={() => router.push("/stats")}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
                <div style={{ fontWeight: 700 }}>Detailed Analytics</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>View your XP history and habit breakdowns</div>
            </div>

            {/* Settings */}
            <div className="section-title" style={{ marginBottom: 12, marginTop: 16 }}>Settings</div>
            <div className="hc-card" style={{ padding: 4 }}>
                <ThemeToggle />
                <div className="divider" style={{ margin: "4px 0" }} />

                <div className="settings-row" onClick={() => router.push("/notifications")} style={{ cursor: "pointer" }}>
                    <div className="settings-icon"><span className="material-icons" style={{ fontSize: 20 }}>notifications</span></div>
                    <div style={{ flex: 1 }}><div className="settings-label">Notifications</div></div>
                    <span className="material-icons" style={{ fontSize: 20, color: "var(--text-muted)" }}>chevron_right</span>
                </div>
                <div className="divider" style={{ margin: "4px 0" }} />
                <div className="settings-row">
                    <div className="settings-icon"><span className="material-icons" style={{ fontSize: 20 }}>info</span></div>
                    <div style={{ flex: 1 }}><div className="settings-label">About Rithmic</div></div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>v2.0</span>
                </div>
            </div>
        </div>
    );
}
