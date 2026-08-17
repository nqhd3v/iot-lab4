"use client";

import { useEffect, useRef } from "react";
import { WS_URL } from "./api";

type Handler = (data: unknown) => void;

// Minimal reconnecting WS hook: subscribe to a message `type`, get called
// back with its `data` payload. Used for item 4 (realtime sensor values).
export function useSocket(type: string, onMessage: Handler) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      socket = new WebSocket(WS_URL);

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === type) handlerRef.current(parsed.data);
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        if (!cancelled) reconnectTimer = setTimeout(connect, 2000);
      };
      socket.onerror = () => socket?.close();
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [type]);
}
