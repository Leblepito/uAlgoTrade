"use client";

import { useEffect, useState } from "react";
import type { BacktestFormState, IndicatorInfo, SymbolInfo, TimeframeInfo } from "@/types/backtest";

interface BacktestSettingsProps {
  formState: BacktestFormState;
  setFormState: React.Dispatch<React.SetStateAction<BacktestFormState>>;
  onRunBacktest: () => void;
  isLoading: boolean;
  strategies: IndicatorInfo[];
  setStrategies: React.Dispatch<React.SetStateAction<IndicatorInfo[]>>;
  canRunBacktest?: boolean;
  backtestLimitText?: string | null;
}

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();

  if (!res.ok) {
    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 180);
    throw new Error(`Request failed (${res.status}): ${snippet || "No response body"}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 180);
    throw new Error(`Invalid JSON: ${snippet || "Empty response"}`);
  }
}

export function BacktestSettings({
  formState,
  setFormState,
  onRunBacktest,
  isLoading,
  strategies,
  setStrategies,
  canRunBacktest = true,
  backtestLimitText = null,
}: BacktestSettingsProps) {
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [timeframes, setTimeframes] = useState<TimeframeInfo[]>([]);

  useEffect(() => {
    const base = apiBaseUrl();
    let cancelled = false;

    Promise.all([
      fetchJson<IndicatorInfo[]>(`${base}/api/Backtest/strategies`),
      fetchJson<SymbolInfo[]>(`${base}/api/Backtest/symbols`),
      fetchJson<TimeframeInfo[]>(`${base}/api/Backtest/timeframes`),
    ])
      .then(([strategiesData, symbolsData, timeframesData]) => {
        if (cancelled) return;
        setStrategies(strategiesData);
        setSymbols(symbolsData);
        setTimeframes(timeframesData);
      })
      .catch((err) => console.error("Failed to fetch backtest options:", err));

    return () => {
      cancelled = true;
    };
  }, [setStrategies]);

  const currentIndicator = strategies.find((s) => s.id === formState.indicatorType);
  const availableStrategies = currentIndicator?.strategies || [];

  const handleIndicatorChange = (indicatorType: string) => {
    const indicator = strategies.find((s) => s.id === indicatorType);
    const defaultSignal = indicator?.strategies[0]?.id || "bounce";
    const defaultParams = indicator?.defaultParameters || {};

    setFormState((prev) => ({
      ...prev,
      indicatorType,
      signalType: defaultSignal,
      parameters: Object.fromEntries(
        Object.entries(defaultParams).map(([k, v]) => [k, String(v)])
      ),
    }));
  };

  const updateField = (field: keyof BacktestFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateParameter = (key: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      parameters: { ...prev.parameters, [key]: value },
    }));
  };

  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-white">Backtest Settings</h2>
          {backtestLimitText && (
            <span className="text-[11px] font-medium text-slate-500">{backtestLimitText}</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Symbol</label>
            <select
              value={formState.symbol}
              onChange={(e) => updateField("symbol", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 [&>option]:bg-slate-800 [&>option]:text-white"
            >
              {symbols.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-800 text-white">
                  {s.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Timeframe</label>
            <select
              value={formState.timeframe}
              onChange={(e) => updateField("timeframe", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 [&>option]:bg-slate-800 [&>option]:text-white"
            >
              {timeframes.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-800 text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Start Date</label>
            <input
              type="date"
              value={formState.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">End Date</label>
            <input
              type="date"
              value={formState.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        <div className="border-t border-white/5" />

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Indicator</label>
          <div className="grid grid-cols-1 gap-2">
            {strategies.map((indicator) => (
              <button
                key={indicator.id}
                type="button"
                onClick={() => handleIndicatorChange(indicator.id)}
                className={`px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${
                  formState.indicatorType === indicator.id
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 border"
                    : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                {indicator.name}
              </button>
            ))}
          </div>
        </div>

        {availableStrategies.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Strategy</label>
            <div className="space-y-2">
              {availableStrategies.map((strategy) => (
                <button
                  key={strategy.id}
                  type="button"
                  onClick={() => updateField("signalType", strategy.id)}
                  className={`w-full px-3 py-2.5 rounded-lg text-left transition-all ${
                    formState.signalType === strategy.id
                      ? "bg-cyan-500/10 border-cyan-500/40 border"
                      : "bg-white/[0.03] border border-white/5 hover:bg-white/5"
                  }`}
                >
                  <div className={`text-sm font-medium ${formState.signalType === strategy.id ? "text-cyan-400" : "text-slate-300"}`}>
                    {strategy.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{strategy.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-white/5" />

        <div>
          <h3 className="text-xs font-medium text-slate-400 mb-3">Trading Parameters</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Initial Wallet (USD)</label>
              <input
                type="number"
                value={formState.initialWallet}
                onChange={(e) => updateField("initialWallet", e.target.value)}
                min="1"
                step="100"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Stop Loss (%)</label>
                <input
                  type="number"
                  value={formState.stopLossPercent}
                  onChange={(e) => updateField("stopLossPercent", e.target.value)}
                  min="0.1"
                  max="50"
                  step="0.1"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Take Profit (%)</label>
                <input
                  type="number"
                  value={formState.takeProfitPercent}
                  onChange={(e) => updateField("takeProfitPercent", e.target.value)}
                  min="0.1"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Maker Fee (%)</label>
                <input
                  type="number"
                  value={formState.makerFee}
                  onChange={(e) => updateField("makerFee", e.target.value)}
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Taker Fee (%)</label>
                <input
                  type="number"
                  value={formState.takerFee}
                  onChange={(e) => updateField("takerFee", e.target.value)}
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Position Size (%)</label>
              <input
                type="number"
                value={formState.positionSizePercent}
                onChange={(e) => updateField("positionSizePercent", e.target.value)}
                min="1"
                max="100"
                step="1"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>
          </div>
        </div>

        {currentIndicator && Object.keys(currentIndicator.defaultParameters).length > 0 && (
          <>
            <div className="border-t border-white/5" />
            <div>
              <h3 className="text-xs font-medium text-slate-400 mb-3">Indicator Parameters</h3>
              <div className="space-y-3">
                {Object.entries(currentIndicator.defaultParameters).map(([key, defaultValue]) => {
                  const isBoolean = typeof defaultValue === "boolean";
                  const currentValue = formState.parameters[key] ?? String(defaultValue);

                  return (
                    <div key={key}>
                      <label className="block text-xs text-slate-500 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      {isBoolean ? (
                        <select
                          value={currentValue}
                          onChange={(e) => updateParameter(key, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 [&>option]:bg-slate-800 [&>option]:text-white"
                        >
                          <option value="true" className="bg-slate-800 text-white">Enabled</option>
                          <option value="false" className="bg-slate-800 text-white">Disabled</option>
                        </select>
                      ) : (
                        <input
                          type="number"
                          value={currentValue}
                          onChange={(e) => updateParameter(key, e.target.value)}
                          step={typeof defaultValue === "number" && defaultValue < 1 ? "0.01" : "1"}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onRunBacktest}
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all shadow-lg ${
            canRunBacktest
              ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-400 hover:to-teal-400 shadow-cyan-500/20"
              : "border border-cyan-500/20 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/15 shadow-black/30"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Running...
            </span>
          ) : canRunBacktest ? (
            "Run Backtest"
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11V7a4 4 0 00-8 0v4m0 0h8m-8 0v8a2 2 0 002 2h4a2 2 0 002-2v-8" />
              </svg>
              Unlock Backtest (Pro/Premium)
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
