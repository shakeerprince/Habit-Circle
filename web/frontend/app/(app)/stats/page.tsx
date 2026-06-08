"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AdvancedStats } from "@/../shared/types";
import { ErrorState } from "@/components/ErrorState";

export default function StatsPage() {
    const [stats, setStats] = useState<AdvancedStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const router = useRouter();

    const loadStats = () => {
        setHasError(false);
        setLoading(true);
        api.getStats()
            .then(setStats)
            .catch(() => setHasError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (hasError || !stats) {
        return <ErrorState title="Analytics Unavailable" message="We couldn't load your stats right now." onRetry={loadStats} />;
    }

    const maxCategoryCount = Math.max(...Object.values(stats.categories), 1);
    const maxDayCount = Math.max(...stats.dayOfWeekDistribution, 1);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="page" style={{ paddingBottom: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <button className="icon-btn" onClick={() => router.back()}>
                    <span className="material-icons">arrow_back</span>
                </button>
                <h1 className="page-title" style={{ margin: 0 }}>Analytics</h1>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                <div className="hc-card" style={{ padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)" }}>{stats.totalCompletions}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Lifetime Completions</div>
                </div>
                <div className="hc-card" style={{ padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "var(--success)" }}>{stats.perfectDays}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Perfect Days</div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="hc-card" style={{ padding: 20, marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Category Breakdown</h2>
                {Object.entries(stats.categories).length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No habits created yet.</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {Object.entries(stats.categories).map(([category, count]) => {
                            const percent = (count / maxCategoryCount) * 100;
                            return (
                                <div key={category}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
                                        <span>{category}</span>
                                        <span style={{ color: "var(--accent)" }}>{count} habits</span>
                                    </div>
                                    <div className="xp-bar-container" style={{ height: 8 }}>
                                        <div className="xp-bar-fill" style={{ width: `${percent}%`, background: "var(--accent)" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Day of Week Activity */}
            <div className="hc-card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Weekly Activity</h2>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Most active: <strong>{stats.mostActiveDay}</strong></span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 120, paddingBottom: 8 }}>
                    {stats.dayOfWeekDistribution.map((count, i) => {
                        const height = maxDayCount === 0 ? 0 : (count / maxDayCount) * 100;
                        return (
                            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "12%" }}>
                                <div style={{ 
                                    width: "100%", 
                                    height: `${Math.max(height, 5)}%`, 
                                    background: count === maxDayCount && count > 0 ? "var(--accent)" : "var(--card-hover)",
                                    borderRadius: 4,
                                    transition: "height 0.5s ease-out"
                                }} />
                                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: count === maxDayCount && count > 0 ? 700 : 400 }}>
                                    {days[i]}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
