"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

import { ToastProvider } from "@/components/ToastProvider";

const tabs = [
    { path: "/tasks", icon: "checklist", label: "Tasks" },
    { path: "/friends", icon: "group", label: "Friends" },
    { path: "/dashboard", icon: "dashboard", label: "Home" },
    { path: "/communities", icon: "forum", label: "Groups" },
    { path: "/profile", icon: "person", label: "Profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showInstall, setShowInstall] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    // Fetch unread notification count + poll every 30s
    useEffect(() => {
        const fetchCount = () => {
            api.getUnreadCount().then(d => setUnreadCount(d.count)).catch(() => { });
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // PWA Install Prompt
    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => { });
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show install prompt after 5 seconds
            setTimeout(() => setShowInstall(true), 5000);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Also show a custom prompt for iOS (which doesn't support beforeinstallprompt)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isIOS && !isStandalone) {
            // Check if user has already dismissed
            const dismissed = localStorage.getItem('hc_install_dismissed');
            if (!dismissed) {
                setTimeout(() => setShowInstall(true), 5000);
            }
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
        }
        setShowInstall(false);
    };

    const dismissInstall = () => {
        setShowInstall(false);
        localStorage.setItem('hc_install_dismissed', 'true');
    };

    return (
        <ToastProvider>
            {children}

            {/* PWA Install Banner */}
            {showInstall && (
                <div className="install-banner">
                    <div className="install-banner-content">
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                            <span className="material-icons" style={{ fontSize: 28, color: "var(--accent)" }}>install_mobile</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>Install Rithmic</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                    {deferredPrompt ? "Add to your home screen for the best experience!" : "Tap Share → Add to Home Screen"}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {deferredPrompt && (
                                <button className="btn-primary btn-sm" onClick={handleInstall}>Install</button>
                            )}
                            <button onClick={dismissInstall} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                                <span className="material-icons" style={{ fontSize: 20, color: "var(--text-muted)" }}>close</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                {tabs.map((tab) => (
                    <button
                        key={tab.path}
                        className={`nav-item ${pathname === tab.path ? "active" : ""}`}
                        onClick={() => router.push(tab.path)}
                        style={{ position: "relative" }}
                    >
                        <span className="material-icons">{tab.icon}</span>
                        <span className="nav-label">{tab.label}</span>
                        {/* Notification badge on Profile tab */}
                        {tab.path === "/profile" && unreadCount > 0 && (
                            <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                        )}
                    </button>
                ))}
            </nav>
        </ToastProvider>
    );
}
