"use client";

import { useEffect, useState } from "react";
import { EquityCurveLarge } from "@/components/EquityCurveLarge";
import { getPerformance } from "@/lib/swarm";
import type { PerformanceData } from "@/types/swarm";

export default function PerformancePage() {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getPerformance(90);
        setPerformance(data);
      } catch (err) {
        console.error("Failed to fetch performance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse text-lg">Loading Performance...</div>
      </div>
    );
  }

  const data = performance?.data || [];
  const latest = data.length ? data[data.length - 1] : null;
  const first = data.length ? data[0] : null;

  const periodReturn = first && latest && first.total_value > 0
    ? ((latest.total_value - first.total_value) / first.total_value * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Performance Analysis</h1>
        <p className="text-sm text-slate-400 mb-8">90-day performance overview</p>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <MetricCard label="Period Return" value={`${periodReturn >= 0 ? "+" : ""}${periodReturn.toFixed(2)}%`} color={periodReturn >= 0 ? "text-emerald-400" : "text-red-400"} />
          <MetricCard label="Win Rate" value={latest?.win_rate != null ? `${(latest.win_rate * 100).toFixed(1)}%` : "--"} />
          <MetricCard label="Sharpe Ratio" value={latest?.sharpe_ratio != null ? latest.sharpe_ratio.toFixed(2) : "--"} />
          <MetricCard label="Max Drawdown" value={latest?.max_drawdown != null ? `${(latest.max_drawdown * 100).toFixed(2)}%` : "--"} color="text-red-400" />
          <MetricCard label="Data Points" value={data.length.toString()} />
        </div>

        {/* Equity Curve */}
        <EquityCurveLarge data={data} />

        {/* Daily breakdown table */}
        {data.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Daily Snapshots (Last 10)
            </h2>
            <div className="bg-slate-800/50 border border-white/5 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">Date</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-500 font-medium">Value</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-500 font-medium">PnL %</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-500 font-medium">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(-10).reverse().map((d, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2 text-slate-300">{d.date}</td>
                      <td className="px-4 py-2 text-right text-white font-medium">
                        ${d.total_value.toLocaleString()}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${d.total_pnl_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {d.total_pnl_pct >= 0 ? "+" : ""}{d.total_pnl_pct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-2 text-right text-slate-400">
                        {d.win_rate != null ? `${(d.win_rate * 100).toFixed(1)}%` : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
