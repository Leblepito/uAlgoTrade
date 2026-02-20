"use client";

import type { TradingSignal } from "@/types/swarm";

const directionStyles = {
  LONG: "text-emerald-400 bg-emerald-500/10",
  SHORT: "text-red-400 bg-red-500/10",
  NEUTRAL: "text-slate-400 bg-slate-500/10",
};

const statusStyles: Record<string, string> = {
  approved: "text-emerald-400",
  rejected: "text-red-400",
  pending: "text-amber-400",
  executed: "text-cyan-400",
  expired: "text-slate-500",
};

export function SignalFeed({ signals }: { signals: TradingSignal[] }) {
  if (!signals.length) {
    return (
      <div className="text-center text-slate-500 py-8">
        No signals yet. Run a scan to generate signals.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {signals.map((signal) => (
        <div
          key={signal.id}
          className="bg-slate-800/50 border border-white/5 rounded-lg p-3 flex items-center gap-4 hover:border-white/10 transition-colors"
        >
          <div className={`px-2 py-1 rounded text-xs font-bold ${directionStyles[signal.direction]}`}>
            {signal.direction}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{signal.symbol}</span>
              <span className="text-xs text-slate-500">{signal.timeframe}</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {signal.entry_price ? `Entry: ${signal.entry_price.toFixed(2)}` : ""}
              {signal.stop_loss ? ` | SL: ${signal.stop_loss.toFixed(2)}` : ""}
              {signal.take_profit ? ` | TP: ${signal.take_profit.toFixed(2)}` : ""}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-medium text-slate-300">
              {(signal.confidence * 100).toFixed(0)}%
            </div>
            <div className={`text-xs ${statusStyles[signal.status] || "text-slate-500"}`}>
              {signal.status}
            </div>
          </div>
          <div className="text-xs text-slate-600 shrink-0">
            {new Date(signal.created_at).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
