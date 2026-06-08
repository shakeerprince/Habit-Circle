"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getHabitCompleteQuote } from "@/lib/motivational";
import { Habit, HabitEntry, HabitCompleteResponse } from "@/../shared/types";
import { useToast } from "@/components/ToastProvider";
import { ErrorState } from "@/components/ErrorState";

const COLORS = ['#4ADE80', '#6CB4EE', '#CB6CE6', '#FFD93D', '#FF4D6A', '#FF9F43'];

export default function TasksPage() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [entries, setEntries] = useState<HabitEntry[]>([]);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [celebration, setCelebration] = useState<{ show: boolean; xp: number; quote: string; streak: number } | null>(null);
    const [hasError, setHasError] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const router = useRouter();
    const { showToast } = useToast();

    const loadData = useCallback(async () => {
        try {
            setHasError(false);
            const [h, e] = await Promise.all([api.getHabits(), api.getEntries(selectedDate)]);
            setHabits(h);
            setEntries(e);
        } catch { 
            setHasError(true);
        }
    }, [selectedDate]);

    useEffect(() => { loadData(); }, [loadData]);

    // Check for login reward toast
    useEffect(() => {
        const reward = localStorage.getItem("hc_login_reward");
        if (reward) {
            try {
                const data = JSON.parse(reward);
                setCelebration({ show: true, xp: data.xp, quote: `Day ${data.streak} streak! 🔥`, streak: data.streak });
                localStorage.removeItem("hc_login_reward");
                setTimeout(() => setCelebration(null), 3500);
            } catch { }
        }
    }, []);

    const getStatus = (habitId: string) => entries.find(e => e.habitId === habitId)?.status || "pending";

    const handleStart = async (id: string) => {
        try {
            await api.startHabit(id);
            showToast("Habit started", "success");
            loadData();
        } catch {
            showToast("Failed to start habit.", "error");
        }
    };

    const handleComplete = async (id: string) => {
        try {
            const result = await api.completeHabit(id);
            // 🎉 Celebrate!
            setCelebration({
                show: true,
                xp: result.xpEarned || 25,
                quote: getHabitCompleteQuote(),
                streak: result.newStreak || 0,
            });
            fireConfetti();
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
            setTimeout(() => setCelebration(null), 3500);
            loadData();
        } catch { 
            showToast("Failed to complete habit.", "error");
            loadData(); 
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            await api.createHabit({ name: newName, category: "Custom" });
            setNewName("");
            setShowCreate(false);
            showToast("Habit created successfully", "success");
            loadData();
        } catch {
            showToast("Failed to create habit.", "error");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.deleteHabit(id);
            showToast("Habit deleted", "info");
            loadData();
        } catch {
            showToast("Failed to delete habit.", "error");
        }
    };

    // 🎉 Confetti Animation
    const fireConfetti = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.display = "block";

        const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; rotation: number; vr: number }[] = [];
        const confettiColors = ["#7c5cfc", "#4ADE80", "#FFD93D", "#FF4D6A", "#6CB4EE", "#CB6CE6", "#FF9F43", "#ffffff"];

        for (let i = 0; i < 80; i++) {
            particles.push({
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 15,
                vy: -(Math.random() * 12 + 5),
                color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                size: Math.random() * 8 + 4,
                rotation: Math.random() * 360,
                vr: (Math.random() - 0.5) * 10,
            });
        }

        let frame = 0;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.4; // gravity
                p.rotation += p.vr;
                p.vx *= 0.99;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, 1 - frame / 80);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });
            frame++;
            if (frame < 80) requestAnimationFrame(animate);
            else { canvas.style.display = "none"; ctx.clearRect(0, 0, canvas.width, canvas.height); }
        };
        animate();
    };

    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 3 + i);
        return { date: d.toISOString().split("T")[0], day: d.toLocaleDateString("en", { weekday: "short" }), num: d.getDate() };
    });

    if (hasError) return (
        <ErrorState 
            title="Unable to Load Habits" 
            message="We couldn't fetch your tasks. Please try again." 
            onRetry={loadData} 
        />
    );

    return (
        <div className="page-scroll" style={{ paddingBottom: 120 }}>
            {/* Confetti Canvas */}
            <canvas ref={canvasRef} className="confetti-canvas" />

            {/* XP Celebration Overlay */}
            {celebration?.show && (
                <div className="celebration-overlay">
                    <div className="xp-popup">
                        <div className="xp-amount">+{celebration.xp} XP</div>
                        <div className="xp-quote">{celebration.quote}</div>
                        {celebration.streak > 0 && (
                            <div className="xp-streak">🔥 {celebration.streak} day streak</div>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 8px" }}>
                <h1 className="page-title" style={{ margin: 0 }}>My Habits</h1>
                <button onClick={() => router.push("/notifications")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <span className="material-icons" style={{ color: "var(--text-muted)" }}>notifications</span>
                </button>
            </div>

            {/* Date Selector */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "12px 0 20px" }}>
                {dates.map(d => (
                    <button key={d.date} onClick={() => setSelectedDate(d.date)}
                        style={{
                            display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 12px",
                            borderRadius: 14, border: "none", cursor: "pointer",
                            background: d.date === selectedDate ? "var(--accent)" : "var(--card)",
                            color: d.date === selectedDate ? "#fff" : "var(--text-secondary)",
                            transition: "all 0.3s ease",
                        }}>
                        <span style={{ fontSize: 11, fontWeight: 500 }}>{d.day}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{d.num}</span>
                    </button>
                ))}
            </div>

            {/* Habits List */}
            {habits.map((habit, idx) => {
                const status = getStatus(habit.id);
                const color = COLORS[idx % COLORS.length];
                return (
                    <div key={habit.id} className="hc-card" style={{ borderLeft: `3px solid ${color}`, marginBottom: 10, position: "relative" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>{habit.name}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                    {habit.category} · 🔥 {habit.currentStreak} day streak
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                {status === "pending" && (
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button className="btn-primary btn-sm" style={{ background: "var(--card-hover)", color: "var(--text)" }} onClick={() => router.push(`/focus/${habit.id}`)}>
                                            🎯 Focus
                                        </button>
                                        <button className="btn-primary btn-sm" onClick={() => handleStart(habit.id)}>Start</button>
                                    </div>
                                )}
                                {status === "in_progress" && (
                                    <button className="btn-primary btn-sm" style={{ background: "var(--success)" }} onClick={() => handleComplete(habit.id)}>
                                        ✓ Done
                                    </button>
                                )}
                                {status === "completed" && (
                                    <div className="badge-completed">
                                        <span className="material-icons" style={{ fontSize: 16 }}>check_circle</span> Done
                                    </div>
                                )}
                                <button onClick={() => handleDelete(habit.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                                    <span className="material-icons" style={{ fontSize: 18, color: "var(--text-muted)" }}>delete_outline</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}

            {habits.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                    <span className="material-icons" style={{ fontSize: 48, opacity: 0.3 }}>add_task</span>
                    <p style={{ marginTop: 8 }}>No habits yet. Tap + to create one!</p>
                </div>
            )}

            {/* Create Habit Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="hc-card modal-card" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 12 }}>New Habit</h3>
                        <input className="input-field" placeholder="Habit name" value={newName}
                            onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()} autoFocus />
                        <button className="btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={handleCreate}>Create</button>
                    </div>
                </div>
            )}

            {/* FAB */}
            <button className="fab" onClick={() => setShowCreate(true)}>
                <span className="material-icons">add</span>
            </button>
        </div>
    );
}
