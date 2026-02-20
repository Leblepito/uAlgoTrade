"use client";

import type { PortfolioSnapshot } from "@/types/swarm";

interface PortfolioSummaryProps {
  latest: PortfolioSnapshot | null;
  totalSignalsToday: number;
}

export function PortfolioSummary({ latest, totalSignalsToday }: PortfolioSummaryProps) {
  const pnlColor = (latest?.total_pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="Portfolio Value"
        value={latest ? `$${latest.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$--"}
      />
      <StatCard
        label="Total PnL"
        value={latest ? `${latest.total_pnl >= 0 ? "+" : ""}${latest.total_pnl_pct.toFixed(2)}%` : "--%"}
        valueClass={pnlColor}
      />
      <StatCard
        label="Win Rate"
        value={latest?.win_rate != null ? `${(latest.win_rate * 100).toFixed(1)}%` : "--"}
      />
      <StatCard
        label="Signals Today"
        value={totalSignalsToday.toString()}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
