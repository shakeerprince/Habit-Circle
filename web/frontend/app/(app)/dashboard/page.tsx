"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DashboardData, LeaderboardResponse, Habit } from "@/../shared/types";
import { useToast } from "@/components/ToastProvider";
import { ErrorState } from "@/components/ErrorState";

function getGreeting() {
    const h = new Date().getHours();
    if (h < 5) return "Good night";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
    const [hasError, setHasError] = useState(false);
    const chartRef = useRef<HTMLCanvasElement>(null);
    const router = useRouter();
    const { showToast } = useToast();

    const fetchDashboardData = () => {
        setHasError(false);
        api.getDashboard()
            .then(setData)
            .catch(() => setHasError(true));
        api.getLeaderboard()
            .then(setLeaderboard)
            .catch(() => { }); // Keep leaderboard failure silent as it's not critical
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Draw chart
    useEffect(() => {
        if (!data?.chartData || !chartRef.current) return;
        const ctx = chartRef.current.getContext("2d");
        if (!ctx) return;
        const W = chartRef.current.width = chartRef.current.offsetWidth * 2;
        const H = chartRef.current.height = 200;
        ctx.clearRect(0, 0, W, H);
        const pts = data.chartData;
        const max = Math.max(...pts, 1);
        const stepX = W / (pts.length - 1 || 1);
        const pad = 20;

        // Gradient fill
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "rgba(124,92,252,0.35)");
        grad.addColorStop(1, "rgba(124,92,252,0)");
        ctx.beginPath(); ctx.moveTo(0, H);
        pts.forEach((v: number, i: number) => { ctx.lineTo(i * stepX, H - pad - ((v / max) * (H - pad * 2))); });
        ctx.lineTo(W, H); ctx.fillStyle = grad; ctx.fill();

        // Line
        ctx.beginPath();
        pts.forEach((v, i) => {
            const x = i * stepX;
            const y = H - pad - ((v / max) * (H - pad * 2));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = "#7c5cfc"; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.stroke();

        // Dots
        pts.forEach((v: number, i: number) => {
            ctx.beginPath(); ctx.arc(i * stepX, H - pad - ((v / max) * (H - pad * 2)), 5, 0, Math.PI * 2);
            ctx.fillStyle = "#7c5cfc"; ctx.fill(); ctx.strokeStyle = "#0a0a0f"; ctx.lineWidth = 2; ctx.stroke();
        });
    }, [data]);

    const handleStartHabit = async (id: string) => {
        try {
            await api.startHabit(id);
            // Optimistic update
            setData((prev: DashboardData | null) => {
                if (!prev) return null;
                return {
                    ...prev,
                    habits: prev.habits.map((h: Habit) => h.id === id ? { ...h, status: "in_progress" as const } : h)
                };
            });
            showToast("Habit started", "success");
        } catch { 
            showToast("Failed to start habit. Please try again.", "error");
        }
    };

    const handleCompleteHabit = async (id: string) => {
        try {
            await api.completeHabit(id);
            // Optimistic update
            setData((prev: DashboardData | null) => {
                if (!prev) return null;
                return {
                    ...prev,
                    habits: prev.habits.map((h: Habit) => h.id === id ? { ...h, status: "completed" as const } : h),
                    momentumScore: Math.min(100, (prev.momentumScore || 0) + 1), // visual feedback
                };
            });
            showToast("Habit completed! +1 Momentum", "success");
        } catch { 
            showToast("Failed to complete habit.", "error");
        }
    };

    if (hasError) return (
        <ErrorState 
            title="Dashboard Unavailable" 
            message="We couldn't load your dashboard data." 
            onRetry={fetchDashboardData} 
        />
    );

    if (!data) return (
        <div className="page-scroll" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <div className="loading-spinner" />
        </div>
    );

    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const xpPercent = data.xpToNext ? Math.round((data.xpInLevel / data.xpToNext) * 100) : 0;
    const tierColor = data.level >= 8 ? "#FFD700" : data.level >= 5 ? "#C0C0C0" : "#CD7F32";

    // Data from unified endpoint
    const activeChallenges = data.challenges || [];
    const communities = data.communities || [];
    const friends = data.friends || [];

    // Filter habits for today
    const todayHabits = data.habits.filter((h: Habit) => {
        const dow = new Date().getDay(); // 0=Sun
        const mapped = dow === 0 ? 7 : dow; // 1=Mon...7=Sun
        return h.daysOfWeek.includes(mapped);
    });

    const completedToday = todayHabits.filter((h: Habit) => h.status === "completed").length;
    const todayPercent = todayHabits.length ? Math.round((completedToday / todayHabits.length) * 100) : 0;

    return (
        <div className="page-scroll" style={{ paddingBottom: 100 }}>

            {/* ═══════ Hero Greeting ═══════ */}
            <div style={{
                padding: "28px 20px 20px",
                background: "linear-gradient(135deg, rgba(124,92,252,0.12) 0%, rgba(108,180,238,0.08) 100%)",
                borderRadius: "0 0 24px 24px",
                marginBottom: 16,
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                        <h1 style={{
                            fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 24, margin: 0,
                            background: "linear-gradient(135deg, var(--text-primary), var(--accent))",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>
                            {getGreeting()} 👋
                        </h1>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>
                            &ldquo;{data.quote}&rdquo;
                        </p>
                    </div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(255,217,61,0.15)", padding: "6px 12px", borderRadius: 20,
                    }}>
                        <span className="material-icons" style={{ fontSize: 18, color: "#FFD93D" }}>local_fire_department</span>
                        <span style={{ fontWeight: 800, fontSize: 15, color: "#FFD93D" }}>{data.loginStreak}</span>
                    </div>
                </div>

                {/* Today's progress summary */}
                <div style={{
                    display: "flex", gap: 10, marginTop: 8,
                }}>
                    <div style={{
                        flex: 1, background: "var(--card)", borderRadius: 14, padding: "12px 14px",
                        display: "flex", alignItems: "center", gap: 10,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12, background: "var(--accent-soft)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                        }}>✅</div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>{completedToday}/{todayHabits.length}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Today&apos;s Habits</div>
                        </div>
                    </div>
                    <div style={{
                        flex: 1, background: "var(--card)", borderRadius: 14, padding: "12px 14px",
                        display: "flex", alignItems: "center", gap: 10,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12, background: "rgba(74,222,128,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                        }}>⚡</div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>{data.momentumScore}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Momentum</div>
                        </div>
                    </div>
                    <div style={{
                        flex: 1, background: "var(--card)", borderRadius: 14, padding: "12px 14px",
                        display: "flex", alignItems: "center", gap: 10,
                    }}>
                        <div className="level-badge" style={{ background: tierColor, width: 40, height: 40, borderRadius: 12 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#000" }}>Lv.{data.level}</span>
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>{data.xp}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total XP</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: "0 16px" }}>

                {/* ═══════ Today's Habits Checklist ═══════ */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, margin: 0 }}>
                            📋 Today&apos;s Habits
                        </h2>
                        <span style={{ fontSize: 12, color: todayPercent >= 80 ? "var(--success)" : "var(--text-muted)", fontWeight: 700 }}>
                            {todayPercent}%
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                        height: 6, background: "var(--border)", borderRadius: 3, marginBottom: 12, overflow: "hidden",
                    }}>
                        <div style={{
                            height: "100%", borderRadius: 3, width: `${todayPercent}%`,
                            background: todayPercent === 100 ? "var(--success)" : "var(--accent)",
                            transition: "width 0.5s ease",
                        }} />
                    </div>

                    {todayHabits.length === 0 && (
                        <div className="hc-card" style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>
                            <p>No habits scheduled for today!</p>
                            <button className="btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => router.push("/tasks")}>
                                + Create Habit
                            </button>
                        </div>
                    )}

                    {todayHabits.map((h) => {
                        const isCompleted = h.status === "completed";
                        const isInProgress = h.status === "in_progress";

                        return (
                            <div key={h.id} className="hc-card interactive" style={{
                                display: "flex", alignItems: "center", gap: 12, marginBottom: 8,
                                opacity: isCompleted ? 0.7 : 1,
                                borderLeft: `3px solid ${isCompleted ? "var(--success)" : isInProgress ? "var(--accent)" : "var(--border)"}`,
                            }}>
                                {/* Status indicator */}
                                <button onClick={() => {
                                    if (isCompleted) return;
                                    if (isInProgress) handleCompleteHabit(h.id);
                                    else handleStartHabit(h.id);
                                }} style={{
                                    width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: isCompleted ? "var(--success)" : isInProgress ? "var(--accent)" : "var(--surface-elevated)",
                                    color: isCompleted || isInProgress ? "#fff" : "var(--text-muted)",
                                    fontSize: 16, transition: "all 0.2s ease",
                                }}>
                                    {isCompleted ? "✓" : isInProgress ? "▶" : "○"}
                                </button>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: 600, fontSize: 14,
                                        textDecoration: isCompleted ? "line-through" : "none",
                                        color: isCompleted ? "var(--text-muted)" : "var(--text-primary)",
                                    }}>{h.name}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                        {h.category} · 🔥 {h.currentStreak} streak
                                    </div>
                                </div>
                                {isCompleted && <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 700 }}>Done!</span>}
                                {isInProgress && <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>Tap to finish</span>}
                            </div>
                        );
                    })}
                </div>

                {/* ═══════ Active Challenges ═══════ */}
                {activeChallenges.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, margin: "0 0 10px" }}>
                            🏆 Active Challenges
                        </h2>
                        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
                            {activeChallenges.slice(0, 3).map((ch) => (
                                <div key={ch.id} className="hc-card interactive" onClick={() => router.push(`/challenges`)}
                                    style={{
                                        minWidth: 220, flexShrink: 0,
                                        borderTop: `3px solid ${ch.daysRemaining < 7 ? "#FF4D6A" : "#4ADE80"}`,
                                    }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{ch.title}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                                        ⏰ {ch.daysRemaining}d left · {ch.participantCount} joined
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{
                                            flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden",
                                        }}>
                                            <div style={{
                                                height: "100%", borderRadius: 2,
                                                width: `${Math.max(5, 100 - (ch.daysRemaining / 30 * 100))}%`,
                                                background: ch.daysRemaining < 7 ? "#FF4D6A" : "#4ADE80",
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══════ XP & Level Card ═══════ */}
                <div className="hc-card" style={{ position: "relative", overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div className="level-badge" style={{ background: tierColor }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: "#000" }}>Lv.{data.level}</span>
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 16 }}>Level {data.level}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{data.xp} XP total</div>
                            </div>
                        </div>
                    </div>
                    <div className="xp-bar-container">
                        <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        <span>{data.xpInLevel} / {data.xpToNext} XP</span>
                        <span>Next: Level {data.level + 1}</span>
                    </div>
                </div>

                {/* ═══════ Weekly Progress Chart ═══════ */}
                <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, margin: "0 0 8px" }}>📊 Weekly Progress</h2>
                <div className="hc-card" style={{ marginBottom: 16 }}>
                    <canvas ref={chartRef} style={{ width: "100%", height: 100 }} />
                </div>

                {/* ═══════ Weekly Streak ═══════ */}
                <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, margin: "0 0 8px" }}>🔥 This Week</h2>
                <div className="hc-card" style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-around" }}>
                        {(data.weeklyStreak || []).map((s, i) => (
                            <div key={i} style={{ textAlign: "center" }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 16, margin: "0 auto 4px",
                                    background: s === "completed" ? "var(--success)" : s === "missed" ? "rgba(255,77,106,0.2)" : "var(--card)",
                                    color: s === "completed" ? "#fff" : s === "missed" ? "#FF4D6A" : "var(--text-muted)",
                                    boxShadow: s === "completed" ? "0 2px 8px rgba(74,222,128,0.3)" : "none",
                                }}>
                                    {s === "completed" ? "✓" : s === "missed" ? "✗" : "·"}
                                </div>
                                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{weekDays[i]}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══════ Friend Activity ═══════ */}
                {friends.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, margin: "0 0 10px" }}>
                            👥 Friends
                        </h2>
                        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
                            {friends.slice(0, 8).map((f) => (
                                <div key={f.id} className="hc-card interactive" onClick={() => router.push(`/user/${f.id}`)}
                                    style={{ minWidth: 100, textAlign: "center", padding: "12px 10px", flexShrink: 0 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 14, margin: "0 auto 6px",
                                        background: "var(--accent-soft)", color: "var(--accent)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontWeight: 700, fontSize: 18,
                                    }}>{f.name?.[0]}</div>
                                    <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {f.name?.split(" ")[0]}
                                    </div>
                                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                        🔥 {f.loginStreak || 0}d · Lv.{f.level}
                                    </div>
                                </div>
                            ))}
                            <div className="hc-card interactive" onClick={() => router.push("/friends")}
                                style={{
                                    minWidth: 100, textAlign: "center", padding: "12px 10px", flexShrink: 0,
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 14, margin: "0 auto 6px",
                                    background: "var(--surface-elevated)", color: "var(--text-muted)",
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                                }}>+</div>
                                <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text-muted)" }}>Find More</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ My Communities ═══════ */}
                {communities.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, margin: 0 }}>
                                🌍 My Communities
                            </h2>
                            <button onClick={() => router.push("/communities")} style={{
                                background: "none", border: "none", color: "var(--accent)", fontSize: 12,
                                fontWeight: 600, cursor: "pointer",
                            }}>See all →</button>
                        </div>
                        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
                            {communities.slice(0, 4).map((c) => (
                                <div key={c.id} className="hc-card interactive" onClick={() => router.push(`/community/${c.id}`)}
                                    style={{ minWidth: 160, flexShrink: 0 }}>
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        background: c.bannerColor || "var(--accent-soft)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 22, marginBottom: 8,
                                    }}>{c.icon || "🏠"}</div>
                                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.name}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                        {c.memberCount} members
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══════ Leaderboard ═══════ */}
                {leaderboard && (
                    <div style={{ marginBottom: 16 }}>
                        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, margin: "0 0 10px" }}>🏆 Leaderboard</h2>
                        <div className="hc-card">
                            {leaderboard.leaderboard.slice(0, 5).map((u) => (
                                <div key={u.id} className={`leaderboard-row ${u.isCurrentUser ? "leaderboard-me" : ""}`}>
                                    <div className="leaderboard-rank" style={{
                                        background: u.rank === 1 ? "#FFD700" : u.rank === 2 ? "#C0C0C0" : u.rank === 3 ? "#CD7F32" : "var(--card-hover)",
                                        color: u.rank <= 3 ? "#000" : "var(--text-secondary)",
                                    }}>
                                        {u.rank <= 3 ? ["🥇", "🥈", "🥉"][u.rank - 1] : `#${u.rank}`}
                                    </div>
                                    <div className="avatar avatar-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                                        {u.name?.[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name} {u.isCurrentUser ? "(You)" : ""}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Level {u.level}</div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)" }}>{u.xp} XP</div>
                                </div>
                            ))}
                            {leaderboard.myRank > 5 && (
                                <div className="leaderboard-row leaderboard-me" style={{ marginTop: 8, borderTop: "1px solid var(--border)" }}>
                                    <div className="leaderboard-rank" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>#{leaderboard.myRank}</div>
                                    <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>You</div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)" }}>{leaderboard.myXp} XP</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════ Badges ═══════ */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, margin: 0 }}>🏅 Badges</h2>
                    <button onClick={() => router.push("/achievements")} style={{
                        background: "none", border: "none", color: "var(--accent)", fontSize: 12,
                        fontWeight: 600, cursor: "pointer",
                    }}>See all →</button>
                </div>
                <div className="hc-card" style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 16 }}>
                    {(data.badges || []).map((b) => (
                        <div key={b.id} style={{
                            textAlign: "center", opacity: b.isEarned ? 1 : 0.3,
                            transition: "transform 0.2s ease",
                        }}>
                            <div style={{
                                fontSize: 30, width: 52, height: 52, borderRadius: 14,
                                background: b.isEarned ? "rgba(124,92,252,0.15)" : "var(--surface-elevated)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 4px",
                            }}>
                                {b.tier === "diamond" ? "💎" : b.tier === "gold" ? "🥇" : b.tier === "silver" ? "🥈" : "🥉"}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 600, maxWidth: 70, lineHeight: 1.2 }}>{b.name}</div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
