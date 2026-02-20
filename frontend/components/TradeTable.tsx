"use client";

import { useState, useMemo } from "react";
import type { TradeRecord } from "@/types/backtest";
import { formatCurrency, formatPercent, formatDate } from "@/types/backtest";

interface TradeTableProps {
  trades: TradeRecord[];
}

type SortField = "id" | "entryDate" | "pnL" | "pnLPercent";
type SortDirection = "asc" | "desc";

function SortIcon({ field, activeField, direction }: { field: SortField; activeField: SortField; direction: SortDirection }) {
  if (activeField !== field) {
    return <span className="text-slate-600 ml-1">{"\u2195"}</span>;
  }
  return <span className="text-cyan-400 ml-1">{direction === "asc" ? "\u2191" : "\u2193"}</span>;
}

export function TradeTable({ trades }: TradeTableProps) {
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");

  const sortedTrades = useMemo(() => {
    let filtered = [...trades];

    if (filter === "wins") {
      filtered = filtered.filter((t) => t.pnL > 0);
    } else if (filter === "losses") {
      filtered = filtered.filter((t) => t.pnL <= 0);
    }

    filtered.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case "id":
          aVal = a.id;
          bVal = b.id;
          break;
        case "entryDate":
          aVal = new Date(a.entryDate).getTime();
          bVal = new Date(b.entryDate).getTime();
          break;
        case "pnL":
          aVal = a.pnL;
          bVal = b.pnL;
          break;
        case "pnLPercent":
          aVal = a.pnLPercent;
          bVal = b.pnLPercent;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [trades, sortField, sortDirection, filter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No trades executed during this backtest</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Filter:</span>
        {(["all", "wins", "losses"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === f
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            {f === "all" ? "All" : f === "wins" ? "Winners" : "Losers"}
            <span className="ml-1.5 opacity-70">
              ({f === "all" ? trades.length : f === "wins" ? trades.filter((t) => t.pnL > 0).length : trades.filter((t) => t.pnL <= 0).length})
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th
                className="px-3 py-2.5 text-left font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("id")}
              >
                # <SortIcon field="id" activeField={sortField} direction={sortDirection} />
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-400">Dir</th>
              <th
                className="px-3 py-2.5 text-left font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("entryDate")}
              >
                Entry <SortIcon field="entryDate" activeField={sortField} direction={sortDirection} />
              </th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-400">Entry Price</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-400">Exit Price</th>
              <th className="px-3 py-2.5 text-center font-medium text-slate-400">Exit</th>
              <th
                className="px-3 py-2.5 text-right font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("pnL")}
              >
                P&L <SortIcon field="pnL" activeField={sortField} direction={sortDirection} />
              </th>
              <th
                className="px-3 py-2.5 text-right font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("pnLPercent")}
              >
                P&L % <SortIcon field="pnLPercent" activeField={sortField} direction={sortDirection} />
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-400 hidden lg:table-cell">Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedTrades.map((trade) => {
              const isProfit = trade.pnL > 0;
              return (
                <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2.5 text-slate-400">{trade.id}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        trade.direction === "LONG"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {trade.direction}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">
                    {formatDate(trade.entryDate)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-300 font-mono">
                    {trade.entryPrice.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-300 font-mono">
                    {trade.exitPrice.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <ExitReasonBadge reason={trade.exitReason} />
                  </td>
                  <td className={`px-3 py-2.5 text-right font-medium ${isProfit ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(trade.pnL)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-medium ${isProfit ? "text-green-400" : "text-red-400"}`}>
                    {formatPercent(trade.pnLPercent)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 text-xs hidden lg:table-cell max-w-[200px] truncate">
                    {trade.signalSource}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {sortedTrades.length} of {trades.length} trades
        </span>
        <span>
          Total Fees: {formatCurrency(trades.reduce((sum, t) => sum + t.fees, 0))}
        </span>
      </div>
    </div>
  );
}

function ExitReasonBadge({ reason }: { reason: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    TP: { bg: "bg-green-500/10", text: "text-green-400", label: "TP" },
    SL: { bg: "bg-red-500/10", text: "text-red-400", label: "SL" },
    Signal: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Signal" },
    EndOfData: { bg: "bg-slate-500/10", text: "text-slate-400", label: "End" },
  };

  const { bg, text, label } = config[reason] || config.EndOfData;

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}
