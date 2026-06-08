"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

import { Community } from "@/../shared/types";

export default function InviteJoinPage() {
    const { code } = useParams();
    const router = useRouter();
    const [community, setCommunity] = useState<Community | null>(null);
    const [error, setError] = useState("");
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        if (code) {
            api.getByInviteCode(code as string)
                .then(setCommunity)
                .catch(() => setError("Invalid or expired invite link"));
        }
    }, [code]);

    const handleJoin = async () => {
        setJoining(true);
        try {
            const res = await api.joinByInviteCode(code as string);
            if (res.id) {
                setJoined(true);
                setTimeout(() => router.push(`/community/${res.id}`), 1500);
            }
        } catch (err) {
            const errorObj = err as { error?: string };
            if (errorObj?.error?.includes("Already")) {
                setJoined(true);
                if (community?.id) setTimeout(() => router.push(`/community/${community.id}`), 1000);
            }
        }
        setJoining(false);
    };

    if (error) return (
        <div className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🔗</p>
            <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 22, marginBottom: 8 }}>Invalid Invite Link</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>This link may have expired or been removed.</p>
            <button className="btn-primary" onClick={() => router.push("/communities")}>Browse Communities</button>
        </div>
    );

    if (!community) return (
        <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
            <div className="loading-spinner" />
        </div>
    );

    return (
        <div className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center" }}>
            <div className="hc-card" style={{ maxWidth: 380, width: "100%", padding: "32px 24px" }}>
                {/* Community banner */}
                <div style={{
                    width: 80, height: 80, borderRadius: 20, margin: "0 auto 16px",
                    background: community.bannerColor || "var(--accent-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40,
                    boxShadow: `0 6px 20px ${community.bannerColor}44`,
                }}>
                    {community.icon || "🏠"}
                </div>

                <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 22, marginBottom: 4 }}>
                    {community.name}
                </h1>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                    {community.memberCount} members · {community.category}
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                    Created by <strong>{community.creatorName}</strong>
                </p>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24, marginTop: 12 }}>
                    {community.description}
                </p>

                {community.isJoined || joined ? (
                    <div>
                        <div style={{
                            background: "var(--success-bg)", color: "var(--success)",
                            padding: "12px 0", borderRadius: 12, fontWeight: 700, marginBottom: 12,
                        }}>✓ You&apos;re a member!</div>
                        <button className="btn-primary" style={{ width: "100%" }}
                            onClick={() => router.push(`/community/${community.id}`)}>
                            Open Community
                        </button>
                    </div>
                ) : (
                    <button className="btn-primary" style={{ width: "100%", padding: "14px 0", fontSize: 16, fontWeight: 800 }}
                        onClick={handleJoin} disabled={joining}>
                        {joining ? "Joining..." : `🚀 Join ${community.name}`}
                    </button>
                )}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>
                Invited to <strong>Rithmic</strong>
            </p>
        </div>
    );
}
