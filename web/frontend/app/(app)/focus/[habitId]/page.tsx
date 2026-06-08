"use client";
import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export default function FocusPage({ params }: { params: Promise<{ habitId: string }> }) {
    const { habitId } = use(params);
    const router = useRouter();
    const { showToast } = useToast();
    const [habitName, setHabitName] = useState("Habit");
    
    // 25 minutes in seconds
    const INITIAL_TIME = 25 * 60;
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
    const [isActive, setIsActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        api.getHabits().then(habits => {
            const h = habits.find(x => x.id === habitId);
            if (h) setHabitName(h.name);
        }).catch(() => {});
    }, [habitId]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0 && !isFinished) {
            setIsFinished(true);
            setIsActive(false);
            handleComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, isFinished]);

    const handleComplete = async () => {
        try {
            // First start it if not started
            await api.startHabit(habitId).catch(() => {});
            // Then complete it
            await api.completeHabit(habitId);
            showToast("Focus session complete!", "success");
            // Vibrate if supported
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            setTimeout(() => {
                router.push("/tasks");
            }, 3000);
        } catch {
            showToast("Failed to complete habit.", "error");
        }
    };

    const toggleTimer = () => {
        if (timeLeft === 0) return;
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(INITIAL_TIME);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * 100;

    return (
        <div className="page" style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            minHeight: "100vh",
            background: "linear-gradient(180deg, var(--bg-color) 0%, #1a1a2e 100%)",
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 100
        }}>
            <button className="icon-btn" onClick={() => router.back()} style={{ position: "absolute", top: 20, left: 20 }}>
                <span className="material-icons">close</span>
            </button>

            <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div style={{ fontSize: 14, color: "var(--accent)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Focus Mode</div>
                <h1 style={{ fontSize: 24, margin: "8px 0 0 0" }}>{habitName}</h1>
            </div>

            {/* Circular Timer Display */}
            <div style={{ position: "relative", width: 280, height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* SVG Progress Circle */}
                <svg width="280" height="280" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                    <circle cx="140" cy="140" r="130" fill="none" stroke="var(--card-hover)" strokeWidth="8" />
                    <circle cx="140" cy="140" r="130" fill="none" stroke="var(--accent)" strokeWidth="8" 
                            strokeDasharray="816" strokeDashoffset={816 - (816 * progressPercent) / 100}
                            style={{ transition: "stroke-dashoffset 1s linear" }} />
                </svg>
                
                <div style={{ textAlign: "center", zIndex: 2 }}>
                    <div style={{ fontSize: 64, fontWeight: 800, fontFamily: "monospace", textShadow: "0 0 20px rgba(124, 92, 252, 0.5)" }}>
                        {formatTime(timeLeft)}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>
                        {isFinished ? "Session Complete!" : isActive ? "Focusing..." : "Paused"}
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
                <button className="btn-primary" 
                    onClick={toggleTimer} 
                    style={{ 
                        width: 120, height: 50, borderRadius: 25, fontSize: 16,
                        background: isActive ? "var(--card-hover)" : "var(--accent)",
                        color: isActive ? "var(--text)" : "#fff"
                    }}>
                    {isActive ? "Pause" : "Start"}
                </button>
                {!isActive && timeLeft !== INITIAL_TIME && !isFinished && (
                    <button className="btn-primary" onClick={resetTimer} style={{ width: 120, height: 50, borderRadius: 25, fontSize: 16, background: "var(--danger)" }}>
                        Reset
                    </button>
                )}
            </div>
            
            {isFinished && (
                <div style={{ marginTop: 24, color: "var(--success)", fontWeight: 700, animation: "pulse 2s infinite" }}>
                    Saving completion...
                </div>
            )}
        </div>
    );
}
