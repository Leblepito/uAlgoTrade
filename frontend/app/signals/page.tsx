"use client";

import { useEffect, useState } from "react";
import { SignalFeed } from "@/components/SignalFeed";
import { getRecentSignals } from "@/lib/swarm";
import type { TradingSignal } from "@/types/swarm";

export default function SignalsPage() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const data = await getRecentSignals(50);
        setSignals(data.signals);
      } catch (err) {
        console.error("Failed to fetch signals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSignals();
    const interval = setInterval(fetchSignals, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredSignals = filter === "all"
    ? signals
    : signals.filter((s) => s.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse text-lg">Loading Signals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Signal History</h1>
            <p className="text-sm text-slate-400 mt-1">
              {signals.length} signals generated
            </p>
          </div>
          <div className="flex gap-2">
            {["all", "approved", "rejected", "pending", "executed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === f
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <SignalFeed signals={filteredSignals} />
      </div>
    </div>
  );
}
