import { useEffect, useState, useCallback, useRef } from 'react';

export function useWebSocket() {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    // Listeners map for event names -> array of callbacks
    const listenersRef = useRef<Record<string, ((payload: any) => void)[]>>({});

    useEffect(() => {
        const token = localStorage.getItem('hc_token');
        if (!token) return;

        // Build WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Assuming API runs on the same host or next config rewrites API
        const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^http(s?):\/\//, '') || window.location.host;
        const wsUrl = `${protocol}//${host}/api/ws?token=${token}`;

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            setIsConnected(true);
        };

        socket.onclose = () => {
            setIsConnected(false);
        };

        socket.onmessage = (event) => {
            try {
                if (event.data === 'pong') return; // Ignore keep-alive

                const data = JSON.parse(event.data);
                const { event: eventName, payload } = data;

                if (eventName && listenersRef.current[eventName]) {
                    listenersRef.current[eventName].forEach(cb => cb(payload));
                }
            } catch (err) {
                console.error("WebSocket message parse error:", err);
            }
        };

        setWs(socket);

        // Keep alive
        const interval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send('ping');
            }
        }, 30000);

        return () => {
            clearInterval(interval);
            socket.close();
        };
    }, []);

    const subscribe = useCallback((event: string, callback: (payload: any) => void) => {
        if (!listenersRef.current[event]) {
            listenersRef.current[event] = [];
        }
        listenersRef.current[event].push(callback);

        return () => {
            // Unsubscribe
            listenersRef.current[event] = listenersRef.current[event].filter(cb => cb !== callback);
        };
    }, []);

    return { ws, isConnected, subscribe };
}
