"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export type WSStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WSMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
}

interface UseWebSocketOptions {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number;
  /** Max reconnect attempts (default: 10) */
  maxReconnects?: number;
  /** Called on every incoming message */
  onMessage?: (msg: WSMessage) => void;
  /** Called when connection is established */
  onOpen?: () => void;
  /** Called when connection is lost */
  onClose?: () => void;
}

const WS_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ||
        (window.location.protocol === "https:" ? "wss://" : "ws://") +
          (process.env.NEXT_PUBLIC_API_HOST || window.location.host))
    : "";

/**
 * React hook for a persistent WebSocket connection to the Swarm Hub.
 *
 * Usage:
 * ```tsx
 * const { status, lastMessage, send } = useWebSocket({
 *   onMessage(msg) {
 *     if (msg.type === "swarm:status") setSwarmStatus(msg.data);
 *   },
 * });
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectDelay = 3000,
    maxReconnects = 10,
    onMessage,
    onOpen,
    onClose,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [status, setStatus] = useState<WSStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  // Store latest callbacks in refs so we don't re-connect on every render
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  onMessageRef.current = onMessage;
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (!WS_BASE) return;

    setStatus("connecting");

    const ws = new WebSocket(`${WS_BASE}/ws/swarm`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      reconnectCountRef.current = 0;
      onOpenRef.current?.();
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        setLastMessage(msg);
        onMessageRef.current?.(msg);
      } catch {
        // Non-JSON message — ignore
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
      onCloseRef.current?.();

      // Auto-reconnect
      if (reconnectCountRef.current < maxReconnects) {
        reconnectCountRef.current += 1;
        const delay = reconnectDelay * Math.min(reconnectCountRef.current, 5);
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      setStatus("error");
      ws.close();
    };
  }, [maxReconnects, reconnectDelay]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimerRef.current);
    reconnectCountRef.current = maxReconnects; // prevent reconnect
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("disconnected");
  }, [maxReconnects]);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    if (autoConnect) connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [autoConnect, connect]);

  return { status, lastMessage, send, connect, disconnect };
}
