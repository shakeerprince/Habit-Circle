"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DashboardData, Badge } from "@/../shared/types";
import { ErrorState } from "@/components/ErrorState";

export default function AchievementsPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const router = useRouter();

    const loadData = () => {
        setHasError(false);
        setLoading(true);
        api.getDashboard()
            .then(setData)
            .catch(() => setHasError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (hasError || !data) {
        return <ErrorState title="Achievements Unavailable" message="We couldn't load your badges right now." onRetry={loadData} />;
    }

    const earnedBadges = data.badges.filter(b => b.isEarned);
    const lockedBadges = data.badges.filter(b => !b.isEarned);

    const getIcon = (tier: string) => {
        switch (tier) {
            case "diamond": return "💎";
            case "gold": return "🥇";
            case "silver": return "🥈";
            case "bronze": return "🥉";
            default: return "🏅";
        }
    };

    const getColor = (tier: string) => {
        switch (tier) {
            case "diamond": return "#00f2fe";
            case "gold": return "#FFD700";
            case "silver": return "#C0C0C0";
            case "bronze": return "#CD7F32";
            default: return "var(--accent)";
        }
    };

    return (
        <div className="page" style={{ paddingBottom: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <button className="icon-btn" onClick={() => router.back()}>
                    <span className="material-icons">arrow_back</span>
                </button>
                <h1 className="page-title" style={{ margin: 0 }}>Achievements</h1>
            </div>

            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Trophy Room</h2>
                <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
                    You have unlocked {earnedBadges.length} of {data.badges.length} badges
                </p>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Unlocked Achievements</h3>
            {earnedBadges.length === 0 && (
                <div className="hc-card" style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
                    Build your first streak to earn a badge!
                </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
                {earnedBadges.map(b => (
                    <div key={b.id} className="hc-card" style={{ 
                        padding: "20px 12px", 
                        textAlign: "center",
                        border: `1px solid ${getColor(b.tier)}40`,
                        background: `linear-gradient(180deg, var(--card) 0%, ${getColor(b.tier)}10 100%)`,
                        boxShadow: `0 8px 32px ${getColor(b.tier)}20`,
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 100, height: 100, background: getColor(b.tier), filter: "blur(50px)", opacity: 0.2 }} />
                        <div style={{ fontSize: 48, marginBottom: 12, filter: `drop-shadow(0 0 10px ${getColor(b.tier)}80)` }}>
                            {getIcon(b.tier)}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: getColor(b.tier), marginBottom: 4 }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{b.description}</div>
                        <div style={{ fontSize: 10, color: "var(--success)", marginTop: 8, fontWeight: 600 }}>
                            Earned {new Date(b.earnedAt || "").toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Locked</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {lockedBadges.map(b => (
                    <div key={b.id} className="hc-card" style={{ 
                        padding: 16, 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 16,
                        opacity: 0.5,
                        filter: "grayscale(100%)"
                    }}>
                        <div style={{ fontSize: 32 }}>{getIcon(b.tier)}</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{b.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.description}</div>
                        </div>
                        <div style={{ marginLeft: "auto" }}>
                            <span className="material-icons" style={{ fontSize: 20, color: "var(--text-muted)" }}>lock</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
