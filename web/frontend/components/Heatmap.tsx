"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function Heatmap() {
    const [data, setData] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getHeatmap()
            .then(setData)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Generate last 365 days
    const today = new Date();
    const days = [];
    for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
    }

    // Split into weeks for the grid
    const weeks: string[][] = [];
    let currentWeek: string[] = [];
    days.forEach((day, i) => {
        currentWeek.push(day);
        if (currentWeek.length === 7 || i === days.length - 1) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    const getColor = (count: number) => {
        if (count === 0) return "var(--card-hover)";
        if (count === 1) return "rgba(124, 92, 252, 0.4)"; // soft accent
        if (count === 2) return "rgba(124, 92, 252, 0.7)"; // med accent
        return "var(--accent)"; // bright accent
    };

    if (loading) {
        return <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading heatmap...</div>;
    }

    return (
        <div className="hc-card" style={{ padding: 16, overflowX: "auto" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text-muted)" }}>
                Activity Heatmap
            </div>
            <div style={{ display: "flex", gap: 4 }}>
                {weeks.map((week, wIndex) => (
                    <div key={wIndex} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {week.map((day) => {
                            const count = data[day] || 0;
                            return (
                                <div
                                    key={day}
                                    title={`${day}: ${count} habits completed`}
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 2,
                                        background: getColor(count),
                                        transition: "transform 0.2s",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.target as HTMLDivElement).style.transform = "scale(1.2)";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.target as HTMLDivElement).style.transform = "scale(1)";
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
                <span>Less</span>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: getColor(0) }} />
                <div style={{ width: 10, height: 10, borderRadius: 2, background: getColor(1) }} />
                <div style={{ width: 10, height: 10, borderRadius: 2, background: getColor(2) }} />
                <div style={{ width: 10, height: 10, borderRadius: 2, background: getColor(3) }} />
                <span>More</span>
            </div>
        </div>
    );
}
