"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div style={{
                position: "fixed",
                bottom: 24,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                zIndex: 9999,
                pointerEvents: "none"
            }}>
                {toasts.map((toast) => (
                    <div key={toast.id} style={{
                        background: toast.type === "error" ? "var(--error, #FF4D6A)" : toast.type === "success" ? "var(--success, #4ADE80)" : "var(--card, #2A2A35)",
                        color: toast.type === "info" ? "var(--text-primary, #ffffff)" : "#fff",
                        padding: "12px 20px",
                        borderRadius: 12,
                        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                        fontWeight: 600,
                        fontSize: 14,
                        textAlign: "center",
                        minWidth: 200,
                        pointerEvents: "auto",
                        animation: "slideUp 0.3s ease"
                    }}>
                        {toast.type === "error" && "⚠️ "}
                        {toast.type === "success" && "✅ "}
                        {toast.type === "info" && "ℹ️ "}
                        {toast.message}
                    </div>
                ))}
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
