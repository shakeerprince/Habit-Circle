"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Community } from "@/../shared/types";
import { useToast } from "@/components/ToastProvider";
import { ErrorState } from "@/components/ErrorState";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const CATEGORIES = ["All", "Fitness", "Mindfulness", "Study", "Health", "General"];

export default function CommunitiesPage() {
    const [tab, setTab] = useState<"explore" | "my">("explore");
    const [communities, setCommunities] = useState<Community[]>([]);
    const [myCommunities, setMyCommunities] = useState<Community[]>([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newIcon, setNewIcon] = useState("🏠");
    const [newCategory, setNewCategory] = useState("General");
    const [newColor, setNewColor] = useState("#7c5cfc");
    const [newBannerImage, setNewBannerImage] = useState<string | undefined>(undefined);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [creating, setCreating] = useState(false);
    const [hasError, setHasError] = useState(false);
    const bannerFileRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { showToast } = useToast();

    const loadData = () => {
        setHasError(false);
        Promise.all([
            api.getCommunities(search || undefined),
            api.getMyCommunities()
        ]).then(([explore, my]) => {
            setCommunities(explore);
            setMyCommunities(my);
        }).catch(() => {
            setHasError(true);
        });
    };

    useEffect(() => {
        loadData();
    }, [search]);

    const filtered = category === "All" ? communities : communities.filter((c: Community) => c.category === category);

    const handleJoin = async (id: string) => {
        try {
            await api.joinCommunity(id);
            setCommunities((prev: Community[]) => prev.map((c: Community) => c.id === id ? { ...c, isJoined: true, memberCount: c.memberCount + 1 } : c));
            api.getMyCommunities().then(setMyCommunities).catch(() => { });
            showToast("Joined community", "success");
        } catch { 
            showToast("Failed to join community.", "error");
        }
    };

    const handleLeave = async (id: string) => {
        try {
            await api.leaveCommunity(id);
            setCommunities((prev: Community[]) => prev.map((c: Community) => c.id === id ? { ...c, isJoined: false, memberCount: c.memberCount - 1 } : c));
            setMyCommunities((prev: Community[]) => prev.filter((c: Community) => c.id !== id));
            showToast("Left community", "info");
        } catch { 
            showToast("Failed to leave community.", "error");
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingBanner(true);
        try {
            const result = await api.uploadFile(file);
            setNewBannerImage(`${API_BASE}${result.url}`);
            showToast("Banner uploaded", "success");
        } catch { 
            showToast("Failed to upload banner.", "error");
        }
        setUploadingBanner(false);
    };

    const handleCreate = async () => {
        if (!newName || !newDesc) return;
        setCreating(true);
        try {
            const result = (await api.createCommunity({
                name: newName, description: newDesc, icon: newIcon,
                category: newCategory, bannerColor: newColor,
                bannerImage: newBannerImage,
            })) as { id: string };
            setShowCreate(false);
            setNewName(""); setNewDesc(""); setNewBannerImage(undefined);
            showToast("Community created!", "success");
            router.push(`/community/${result.id}`);
        } catch { 
            showToast("Failed to create community.", "error");
        }
        setCreating(false);
    };

    if (hasError) return (
        <ErrorState 
            title="Communities Unavailable" 
            message="We couldn't load communities. Please try again." 
            onRetry={loadData} 
        />
    );

    return (
        <div className="page" style={{ paddingBottom: 100 }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
                <h1 className="page-title">Communities</h1>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                    Discover and join habit communities
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button className={`hc-chip ${tab === "explore" ? "active" : ""}`} onClick={() => setTab("explore")}>
                    🌍 Explore
                </button>
                <button className={`hc-chip ${tab === "my" ? "active" : ""}`} onClick={() => setTab("my")}>
                    ⭐ My Communities ({myCommunities.length})
                </button>
            </div>

            {tab === "explore" && (
                <>
                    {/* Search */}
                    <div style={{ position: "relative", marginBottom: 12 }}>
                        <span className="material-icons" style={{
                            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                            color: "var(--text-muted)", fontSize: 20
                        }}>search</span>
                        <input className="input-field" placeholder="Search communities..." value={search}
                            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 42 }} />
                    </div>

                    {/* Category filter */}
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
                        {CATEGORIES.map(cat => (
                            <button key={cat} className={`hc-chip ${category === cat ? "active" : ""}`}
                                onClick={() => setCategory(cat)} style={{ whiteSpace: "nowrap", fontSize: 12 }}>{cat}</button>
                        ))}
                    </div>

                    {/* Community cards */}
                    <div className="stagger">
                        {filtered.map((c) => (
                            <div key={c.id} className="hc-card interactive" onClick={() => router.push(`/community/${c.id}`)}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 14,
                                        background: c.bannerColor || "var(--accent-soft)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 24, flexShrink: 0,
                                    }}>{c.icon || "🏠"}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, fontSize: 16, fontFamily: "var(--font-heading)" }}>{c.name}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                            {c.memberCount} member{c.memberCount !== 1 ? "s" : ""} · {c.category}
                                        </div>
                                    </div>
                                    {c.isJoined ? (
                                        <span className="badge-completed" onClick={e => { e.stopPropagation(); handleLeave(c.id); }}
                                            style={{ cursor: "pointer" }}>✓ Joined</span>
                                    ) : (
                                        <button className="btn-primary btn-sm" onClick={e => { e.stopPropagation(); handleJoin(c.id); }}>
                                            + Join
                                        </button>
                                    )}
                                </div>
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                    {c.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ─── My Communities ──────────── */}
            {tab === "my" && (
                <div className="stagger">
                    {myCommunities.length === 0 && (
                        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                            <p style={{ fontSize: 32, marginBottom: 8 }}>🏘️</p>
                            <p style={{ fontWeight: 600 }}>You haven&apos;t joined any communities yet</p>
                            <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setTab("explore")}>
                                🌍 Explore Communities
                            </button>
                        </div>
                    )}
                    {myCommunities.map((c) => (
                        <div key={c.id} className="hc-card interactive" onClick={() => router.push(`/community/${c.id}`)}
                            style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: c.bannerColor || "var(--accent-soft)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 22, flexShrink: 0,
                            }}>{c.icon || "🏠"}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                    {c.memberCount} members
                                    {c.myRole === "admin" && <span style={{ color: "var(--accent)", fontWeight: 700 }}> · Admin</span>}
                                </div>
                            </div>
                            <span className="material-icons" style={{ color: "var(--text-muted)", fontSize: 20 }}>chevron_right</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── FAB: Create Community ──────── */}
            <button className="fab" onClick={() => setShowCreate(true)} style={{ bottom: 80 }}>
                <span className="material-icons">add</span>
            </button>

            {/* ─── Create Community Modal ──────── */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-card hc-card" onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 18, marginBottom: 16 }}>
                            Create Community
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input className="input-field" placeholder="Icon (emoji)" value={newIcon}
                                    onChange={e => setNewIcon(e.target.value)} style={{ width: 60, textAlign: "center", fontSize: 20 }} />
                                <input className="input-field" placeholder="Community name" value={newName}
                                    onChange={e => setNewName(e.target.value)} style={{ flex: 1 }} />
                            </div>
                            <textarea className="input-field" placeholder="Description" value={newDesc}
                                onChange={e => setNewDesc(e.target.value)} rows={3} style={{ resize: "none" }} />
                            <select className="input-field" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                                {CATEGORIES.filter(c => c !== "All").map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <div>
                                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Banner Color</label>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {["#7c5cfc", "#4ADE80", "#FF4D6A", "#6CB4EE", "#FFD93D", "#9C27B0"].map(color => (
                                        <div key={color} onClick={() => setNewColor(color)} style={{
                                            width: 32, height: 32, borderRadius: 8, background: color, cursor: "pointer",
                                            border: newColor === color ? "3px solid var(--text-primary)" : "3px solid transparent",
                                        }} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Banner Image (optional)</label>
                                <input ref={bannerFileRef} type="file" accept="image/*" onChange={handleBannerUpload}
                                    style={{ display: "none" }} />
                                <button className="hc-chip" onClick={() => bannerFileRef.current?.click()} disabled={uploadingBanner}
                                    style={{ fontSize: 13, width: "100%", justifyContent: "center" }}>
                                    {uploadingBanner ? "⏳ Uploading..." : "📷 Upload Banner Image"}
                                </button>
                                {newBannerImage && (
                                    <div style={{ position: "relative", marginTop: 8, borderRadius: 10, overflow: "hidden" }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={newBannerImage} alt="" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 10 }} />
                                        <button onClick={() => setNewBannerImage(undefined)} style={{
                                            position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff",
                                            border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 12,
                                        }}>✕</button>
                                    </div>
                                )}
                            </div>
                            <button className="btn-primary" onClick={handleCreate} disabled={creating}
                                style={{ width: "100%", padding: "12px 0", marginTop: 4 }}>
                                {creating ? "Creating..." : "🚀 Create Community"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
