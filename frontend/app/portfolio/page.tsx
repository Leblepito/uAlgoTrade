"use client";

import { useEffect, useState } from "react";
import { EquityCurveLarge } from "@/components/EquityCurveLarge";
import { getPerformance } from "@/lib/swarm";
import type { PerformanceData } from "@/types/swarm";

export default function PortfolioPage() {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const data = await getPerformance(days);
        setPerformance(data);
      } catch (err) {
        console.error("Failed to fetch performance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [days]);

  const latest = performance?.data?.length
    ? performance.data[performance.data.length - 1]
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse text-lg">Loading Portfolio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Portfolio</h1>
            <p className="text-sm text-slate-400 mt-1">Performance tracking and equity curve</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                onClick={() => { setDays(d); setLoading(true); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  days === d
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatBox label="Total Value" value={latest ? `$${latest.total_value.toLocaleString()}` : "--"} />
          <StatBox
            label="PnL"
            value={latest ? `${latest.total_pnl >= 0 ? "+" : ""}${latest.total_pnl_pct.toFixed(2)}%` : "--"}
            color={latest && latest.total_pnl >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <StatBox label="Win Rate" value={latest?.win_rate != null ? `${(latest.win_rate * 100).toFixed(1)}%` : "--"} />
          <StatBox label="Sharpe Ratio" value={latest?.sharpe_ratio != null ? latest.sharpe_ratio.toFixed(2) : "--"} />
        </div>

        {/* Equity Curve */}
        <EquityCurveLarge data={performance?.data || []} />

        {/* Max Drawdown */}
        {latest?.max_drawdown != null && (
          <div className="mt-4 bg-slate-800/50 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Max Drawdown</span>
              <span className="text-sm font-bold text-red-400">
                {(latest.max_drawdown * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
