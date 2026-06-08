"use client";

import React from "react";

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message = "We couldn't load this data. Please try again.", onRetry }: ErrorStateProps) {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            textAlign: "center",
            minHeight: "40vh"
        }}>
            <div style={{
                fontSize: 48,
                marginBottom: 16,
                opacity: 0.8
            }}>
                ⚠️
            </div>
            <h3 style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: 20,
                margin: "0 0 8px 0",
                color: "var(--text-primary)"
            }}>
                {title}
            </h3>
            <p style={{
                fontSize: 14,
                color: "var(--text-muted)",
                margin: "0 0 24px 0",
                maxWidth: 300
            }}>
                {message}
            </p>
            {onRetry && (
                <button 
                    onClick={onRetry}
                    className="btn-primary"
                    style={{ padding: "10px 24px", minWidth: 120 }}
                >
                    Retry
                </button>
            )}
        </div>
    );
}
