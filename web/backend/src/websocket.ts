import type { ServerWebSocket } from "bun";
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_rithmic_key_2026';

// Global manager to track connected clients by userId
export const connectedClients = new Map<string, Set<any>>();

export function addClient(userId: string, ws: any) {
    if (!connectedClients.has(userId)) {
        connectedClients.set(userId, new Set());
    }
    connectedClients.get(userId)!.add(ws);
}

export function removeClient(userId: string, ws: any) {
    const clients = connectedClients.get(userId);
    if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
            connectedClients.delete(userId);
        }
    }
}

// Broadcast to a specific user
export function notifyUser(userId: string, event: string, payload: any) {
    const clients = connectedClients.get(userId);
    if (clients) {
        const message = JSON.stringify({ event, payload });
        for (const ws of clients) {
            ws.send(message);
        }
    }
}

// Extract userId from token
export function authenticateToken(token: string): string | null {
    try {
        const decoded = verify(token, JWT_SECRET) as { id: string };
        return decoded.id;
    } catch {
        return null;
    }
}
