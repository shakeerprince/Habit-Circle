"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = isLogin
                ? await api.login(email, password)
                : await api.register(email, password, name);
            
            localStorage.setItem("hc_token", res.token);
            if (res.user) {
                localStorage.setItem("hc_user", JSON.stringify(res.user));
                if (res.loginReward && res.loginReward > 0) {
                    localStorage.setItem("hc_login_reward", JSON.stringify({
                        xp: res.loginReward,
                        streak: res.user.loginStreak,
                    }));
                }
            } else {
                // For register response which might not return user immediately
                // In a real app we'd fetch /api/auth/me here
                router.push("/");
                return;
            }
            router.push("/tasks");
        } catch (err) {
            const error = err as Error;
            alert(error.message || (isLogin ? "Login failed" : "Registration failed"));
        } finally {
            setLoading(false);
        }
    };

    // Deterministic particle positions to avoid hydration mismatch
    const particles = [
        { left: "18%", bottom: "5%", delay: "0s", duration: "12s" },
        { left: "35%", bottom: "15%", delay: "2s", duration: "14s" },
        { left: "52%", bottom: "8%", delay: "4s", duration: "11s" },
        { left: "70%", bottom: "22%", delay: "6s", duration: "13s" },
        { left: "25%", bottom: "28%", delay: "8s", duration: "15s" },
        { left: "80%", bottom: "12%", delay: "10s", duration: "10s" },
    ];

    return (
        <div className="login-container">
            <div className="particles">
                {particles.map((p, i) => (
                    <div key={i} className="particle" style={{
                        left: p.left, bottom: p.bottom,
                        animationDelay: p.delay, animationDuration: p.duration,
                    }} />
                ))}
            </div>

            <div style={{ animation: "pageIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                <div className="login-logo">Rithmic</div>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, textAlign: "center", marginBottom: 20 }}>
                    Build habits. Together.
                </p>

                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                    <button 
                        className={`hc-btn ${isLogin ? 'hc-btn-primary' : 'hc-btn-outline'}`} 
                        style={{ flex: 1 }}
                        onClick={() => setIsLogin(true)}>
                        Log In
                    </button>
                    <button 
                        className={`hc-btn ${!isLogin ? 'hc-btn-primary' : 'hc-btn-outline'}`} 
                        style={{ flex: 1 }}
                        onClick={() => setIsLogin(false)}>
                        Sign Up
                    </button>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div>
                            <label className="hc-label">Full Name</label>
                            <input className="hc-input" type="text" placeholder="John Doe"
                                value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                    )}
                    <div>
                        <label className="hc-label">Email</label>
                        <input className="hc-input" type="text" placeholder="you@example.com"
                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label className="hc-label">Password</label>
                        <input className="hc-input" type="password" placeholder="••••••••"
                            value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button className="hc-btn hc-btn-primary hc-btn-full" type="submit" disabled={loading} style={{ marginTop: 10 }}>
                        {loading ? "Please wait..." : (isLogin ? "Log In" : "Create Account")}
                        {!loading && <span className="material-icons" style={{ fontSize: 18 }}>{isLogin ? 'login' : 'person_add'}</span>}
                    </button>
                </form>

                <div style={{ textAlign: "center", margin: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>or</div>

                <button className="google-btn" onClick={() => alert("Google Auth not configured")}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>
            </div>
        </div>
    );
}
