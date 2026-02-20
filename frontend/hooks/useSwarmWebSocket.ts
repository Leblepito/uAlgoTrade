"use client";

import { useCallback, useState } from "react";
import { useWebSocket, type WSMessage } from "./useWebSocket";
import type { SwarmStatus, TradingSignal } from "@/types/swarm";

interface SwarmWSState {
  swarmStatus: SwarmStatus | null;
  signals: TradingSignal[];
  riskAlert: { message: string; level: string } | null;
  killSwitch: boolean;
}

/**
 * High-level hook for consuming real-time Swarm data via WebSocket.
 *
 * Wraps useWebSocket and parses incoming event types into typed state.
 *
 * ```tsx
 * const { swarmStatus, signals, killSwitch, wsStatus } = useSwarmWebSocket();
 * ```
 */
export function useSwarmWebSocket() {
  const [state, setState] = useState<SwarmWSState>({
    swarmStatus: null,
    signals: [],
    riskAlert: null,
    killSwitch: false,
  });

  const handleMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case "swarm:status":
        setState((prev) => ({
          ...prev,
          swarmStatus: msg.data as SwarmStatus,
          killSwitch: (msg.data as SwarmStatus).kill_switch_active,
        }));
        break;

      case "swarm:signals":
        setState((prev) => {
          const incoming = msg.data as { signals?: TradingSignal[] };
          return {
            ...prev,
            signals: incoming.signals ?? (msg.data as TradingSignal[]),
          };
        });
        break;

      case "swarm:signal:new": {
        const newSignal = msg.data as TradingSignal;
        setState((prev) => ({
          ...prev,
          signals: [newSignal, ...prev.signals].slice(0, 50),
        }));
        break;
      }

      case "agent:risk_alert":
        setState((prev) => ({
          ...prev,
          riskAlert: msg.data as { message: string; level: string },
        }));
        break;

      case "agent:kill_switch":
        setState((prev) => ({
          ...prev,
          killSwitch: (msg.data as { active: boolean }).active,
        }));
        break;

      default:
        // Unknown event — ignore
        break;
    }
  }, []);

  const { status: wsStatus, send, connect, disconnect } = useWebSocket({
    onMessage: handleMessage,
  });

  return {
    ...state,
    wsStatus,
    send,
    connect,
    disconnect,
  };
}
