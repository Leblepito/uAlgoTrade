"use client";

import { useState } from "react";
import type { BacktestResult } from "@/types/backtest";
import { formatCurrency, formatPercent } from "@/types/backtest";
import { EquityChart } from "@/components/EquityChart";
import { TradeTable } from "@/components/TradeTable";

interface BacktestResultsProps {
  result: BacktestResult;
}

type TabId = "overview" | "trades" | "equity";

export function BacktestResults({ result }: BacktestResultsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const isProfitable = result.totalPnL >= 0;

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "equity", label: "Equity Curve" },
    { id: "trades", label: `Trades (${result.totalTrades})` },
  ];

  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/50 overflow-hidden">
      <div className="px-4 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">Backtest Results</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {result.symbol} | {result.timeframe} | {result.strategyUsed}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-500">Final Balance</div>
              <div className="text-lg font-bold text-white">{formatCurrency(result.finalBalance)}</div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg ${isProfitable ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              <div className="text-xs opacity-80">P&L</div>
              <div className="font-bold">{formatPercent(result.totalPnLPercent)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-white/5">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-cyan-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === "overview" && <OverviewTab result={result} />}
        {activeTab === "equity" && <EquityChart equityCurve={result.equityCurve} />}
        {activeTab === "trades" && <TradeTable trades={result.trades} />}
      </div>
    </div>
  );
}

function OverviewTab({ result }: { result: BacktestResult }) {
  const isProfitable = result.totalPnL >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total P&L"
          value={formatCurrency(result.totalPnL)}
          subValue={formatPercent(result.totalPnLPercent)}
          positive={isProfitable}
        />
        <MetricCard
          label="Win Rate"
          value={`${result.winRate.toFixed(1)}%`}
          subValue={`${result.winningTrades}W / ${result.losingTrades}L`}
          positive={result.winRate >= 50}
        />
        <MetricCard
          label="Profit Factor"
          value={result.profitFactor.toFixed(2)}
          subValue="Gross Profit / Gross Loss"
          positive={result.profitFactor >= 1}
        />
        <MetricCard
          label="Max Drawdown"
          value={formatCurrency(result.maxDrawdown)}
          subValue={`${result.maxDrawdownPercent.toFixed(2)}%`}
          positive={false}
          isNegativeMetric
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Trading Statistics</h3>
          <div className="space-y-2.5">
            <StatRow label="Total Trades" value={result.totalTrades.toString()} />
            <StatRow label="Winning Trades" value={result.winningTrades.toString()} valueColor="text-green-400" />
            <StatRow label="Losing Trades" value={result.losingTrades.toString()} valueColor="text-red-400" />
            <StatRow label="Avg. Holding Period" value={result.averageHoldingPeriod} />
            <StatRow label="Total Fees Paid" value={formatCurrency(result.totalFeesPaid)} />
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Win/Loss Analysis</h3>
          <div className="space-y-2.5">
            <StatRow label="Average Win" value={formatCurrency(result.averageWin)} valueColor="text-green-400" />
            <StatRow label="Average Loss" value={formatCurrency(result.averageLoss)} valueColor="text-red-400" />
            <StatRow label="Largest Win" value={formatCurrency(result.largestWin)} valueColor="text-green-400" />
            <StatRow label="Largest Loss" value={formatCurrency(result.largestLoss)} valueColor="text-red-400" />
            <StatRow label="Sharpe Ratio" value={result.sharpeRatio.toFixed(2)} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Trade Distribution</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Win Rate</span>
              <span className="text-slate-400">{result.winRate.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400"
                style={{ width: `${result.winRate}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-400"
                style={{ width: `${100 - result.winRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-green-400">{result.winningTrades} wins</span>
              <span className="text-red-400">{result.losingTrades} losses</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5">
            <div className="text-xs text-slate-500 mb-2">Exit Reasons</div>
            <div className="flex gap-4">
              {["TP", "SL", "Signal", "EndOfData"].map((reason) => {
                const count = result.trades.filter((t) => t.exitReason === reason).length;
                if (count === 0) return null;
                return (
                  <div key={reason} className="text-center">
                    <div className="text-lg font-semibold text-white">{count}</div>
                    <div className="text-xs text-slate-500">{reason}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subValue,
  positive,
  isNegativeMetric = false,
}: {
  label: string;
  value: string;
  subValue: string;
  positive: boolean;
  isNegativeMetric?: boolean;
}) {
  const colorClass = isNegativeMetric
    ? "text-red-400"
    : positive
    ? "text-green-400"
    : "text-red-400";

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{subValue}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  valueColor = "text-white",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}
