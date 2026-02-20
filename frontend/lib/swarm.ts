import type { SwarmStatus, TradingSignal, PerformanceData } from "@/types/swarm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("fp_access_token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getSwarmStatus(): Promise<SwarmStatus> {
  return apiFetch<SwarmStatus>("/api/swarm/status");
}

export async function getRecentSignals(limit = 20): Promise<{ signals: TradingSignal[]; count: number }> {
  return apiFetch(`/api/swarm/signals?limit=${limit}`);
}

export async function triggerScan(symbols?: string[]): Promise<unknown> {
  return apiFetch("/api/swarm/scan", {
    method: "POST",
    body: JSON.stringify({ symbols: symbols || ["BTCUSDT", "ETHUSDT"] }),
  });
}

export async function getPerformance(days = 30): Promise<PerformanceData> {
  return apiFetch(`/api/performance?days=${days}`);
}

export async function runOrchestration(symbol: string): Promise<unknown> {
  return apiFetch("/api/swarm/orchestrate", {
    method: "POST",
    body: JSON.stringify({ symbol }),
  });
}

export async function getConsensus(signalId: number): Promise<unknown> {
  return apiFetch(`/api/swarm/consensus/${signalId}`);
}
