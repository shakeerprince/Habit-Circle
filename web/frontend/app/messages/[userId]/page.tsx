"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { DirectMessage, DMHistory } from "@/../shared/types";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function DMChatPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = use(params);
    const [data, setData] = useState<DMHistory | null>(null);
    const [text, setText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { subscribe } = useWebSocket();

    const myId = (() => {
        try {
            const stored = localStorage.getItem("hc_user");
            return stored ? JSON.parse(stored).id : null;
        } catch {
            return null;
        }
    })();

    useEffect(() => {
        api.getDMHistory(userId).then(setData).catch(() => { });
    }, [userId]);

    // Listen for new DMs via WebSocket
    useEffect(() => {
        const unsubscribe = subscribe('new_dm', (newMsg: DirectMessage) => {
            // Check if message belongs to this conversation
            if (newMsg.senderId === userId || newMsg.recipientId === userId) {
                setData(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
            }
        });
        return unsubscribe;
    }, [subscribe, userId]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [data?.messages]);

    const sendMessage = async () => {
        if (!text.trim()) return;
        try {
            // Optimistically add message
            const optimisticMsg = {
                id: 'temp_' + Date.now(),
                senderId: myId,
                recipientId: userId,
                message: text.trim(),
                sentAt: new Date().toISOString(),
                isRead: true,
            } as DirectMessage;
            
            setData((prev: DMHistory | null) => prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : prev);
            const msgText = text.trim();
            setText("");
            
            // Replace optimistic message with real message
            const msg = await api.sendDM(userId, msgText);
            setData((prev: DMHistory | null) => prev ? { 
                ...prev, 
                messages: prev.messages.map(m => m.id === optimisticMsg.id ? msg : m) 
            } : prev);
        } catch { 
            // Better error handling: Could remove optimistic message here
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
            {/* Header */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
                <button className="back-btn" onClick={() => router.back()}>
                    <span className="material-icons">arrow_back</span>
                </button>
                <div className="avatar avatar-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)", cursor: "pointer" }}
                    onClick={() => router.push(`/user/${userId}`)}>
                    {data?.otherUser?.name?.[0] || "?"}
                </div>
                <div style={{ cursor: "pointer" }} onClick={() => router.push(`/user/${userId}`)}>
                    <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "var(--font-heading)" }}>{data?.otherUser?.name || "..."}</div>
                    {data?.otherUser?.bio && (
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{data.otherUser.bio.slice(0, 40)}</div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "16px 16px 8px" }}>
                {(!data?.messages || data.messages.length === 0) && (
                    <div className="empty-state" style={{ height: "100%" }}>
                        <span className="material-icons">chat_bubble_outline</span>
                        <p>Start the conversation!</p>
                    </div>
                )}
                {data?.messages?.map((msg: DirectMessage) => {
                    const isMe = msg.senderId === myId;
                    return (
                        <div key={msg.id} style={{
                            display: "flex", justifyContent: isMe ? "flex-end" : "flex-start",
                            alignItems: "flex-end", gap: 6, marginBottom: 12,
                        }}>
                            {!isMe && (
                                <div className="avatar avatar-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)", cursor: "pointer" }}
                                    onClick={() => router.push(`/user/${msg.senderId}`)}>
                                    {data.otherUser?.name?.[0]}
                                </div>
                            )}
                            <div className={`chat-bubble ${isMe ? "sent" : "received"}`}>
                                <div style={{ fontSize: 14 }}>{msg.message}</div>
                                <div style={{ fontSize: 9, opacity: 0.6, textAlign: "right", marginTop: 4 }}>{timeAgo(msg.sentAt)}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div style={{ padding: "8px 16px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-card)" }}>
                <input className="hc-input" style={{ borderRadius: "var(--radius-full)" }}
                    placeholder="Message..." value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()} />
                <button className="send-btn" onClick={sendMessage}>
                    <span className="material-icons">send</span>
                </button>
            </div>
        </div>
    );
}
