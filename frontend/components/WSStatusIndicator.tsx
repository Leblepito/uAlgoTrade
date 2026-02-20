"use client";

import type { WSStatus } from "@/hooks/useWebSocket";

const STATUS_CONFIG: Record<WSStatus, { color: string; label: string; pulse: boolean }> = {
  connected: { color: "#22c55e", label: "Live", pulse: true },
  connecting: { color: "#f59e0b", label: "Connecting", pulse: true },
  disconnected: { color: "#6b7280", label: "Offline", pulse: false },
  error: { color: "#ef4444", label: "Error", pulse: false },
};

interface Props {
  status: WSStatus;
  className?: string;
}

/**
 * Tiny status dot that shows the WebSocket connection state.
 * Pulses green when connected, amber when connecting, etc.
 */
export default function WSStatusIndicator({ status, className = "" }: Props) {
  const cfg = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}
      title={`WebSocket: ${cfg.label}`}
    >
      <span
        className="relative flex h-2 w-2"
        aria-hidden="true"
      >
        {cfg.pulse && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: cfg.color }}
          />
        )}
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: cfg.color }}
        />
      </span>
      <span style={{ color: cfg.color }}>{cfg.label}</span>
    </span>
  );
}
