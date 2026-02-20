"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BacktestSettings } from "@/components/BacktestSettings";
import { BacktestResults } from "@/components/BacktestResults";
import type { BacktestResult, BacktestFormState, IndicatorInfo } from "@/types/backtest";
import { DEFAULT_FORM_STATE, formStateToRequest } from "@/types/backtest";
import { getMe, postAuthed } from "@/lib/auth";
import { UpgradeModal } from "@/components/UpgradeModal";

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
}

export default function BacktestClient() {
  const [formState, setFormState] = useState<BacktestFormState>(DEFAULT_FORM_STATE);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<IndicatorInfo[]>([]);
  const [maxBacktestsPerDay, setMaxBacktestsPerDay] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const canRunBacktest = maxBacktestsPerDay > 0;
  const backtestLimitText = canRunBacktest ? `Limit: ${maxBacktestsPerDay}/day` : "Pro/Premium required";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancelled) setMaxBacktestsPerDay(me.maxBacktestsPerDay || 0);
      } catch {
        if (!cancelled) setMaxBacktestsPerDay(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRunBacktest = useCallback(async () => {
    if (!canRunBacktest) {
      setUpgradeOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const request = formStateToRequest(formState);
      const data = await postAuthed<BacktestResult>("/api/Backtest/run", request);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [canRunBacktest, formState]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow px-2 py-4 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Backtest Engine
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">
              Test your trading strategies with historical data. Configure parameters and analyze performance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <div className="lg:col-span-4 xl:col-span-3">
              <BacktestSettings
                formState={formState}
                setFormState={setFormState}
                onRunBacktest={handleRunBacktest}
                isLoading={isLoading}
                strategies={strategies}
                setStrategies={setStrategies}
                canRunBacktest={canRunBacktest}
                backtestLimitText={backtestLimitText}
              />
            </div>

            <div className="lg:col-span-8 xl:col-span-9">
              {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {!canRunBacktest ? (
                <div className="flex flex-col items-center justify-center h-96 rounded-xl border border-white/5 bg-slate-900/50 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center text-cyan-300">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11V7a4 4 0 00-8 0v4m0 0h8m-8 0v8a2 2 0 002 2h4a2 2 0 002-2v-8" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-200">Backtest is locked</h3>
                  <p className="mt-2 text-sm text-slate-500 max-w-md">
                    Backtests are available on Pro/Premium plans. Upgrade to unlock runs and higher daily limits.
                  </p>
                  <button
                    type="button"
                    onClick={() => setUpgradeOpen(true)}
                    className="mt-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-500"
                  >
                    See plans
                  </button>
                </div>
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center h-96 rounded-xl border border-white/5 bg-slate-900/50">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-cyan-500/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="mt-4 text-slate-400">Running backtest...</p>
                  <p className="mt-1 text-slate-500 text-sm">This may take a few moments</p>
                </div>
              ) : result ? (
                <BacktestResults result={result} />
              ) : (
                <div className="flex flex-col items-center justify-center h-96 rounded-xl border border-white/5 bg-slate-900/50">
                  <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-slate-300">No Backtest Results</h3>
                  <p className="mt-2 text-slate-500 text-sm text-center max-w-sm">
                    Configure your backtest parameters on the left and click &quot;Run Backtest&quot; to see results.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <UpgradeModal
        open={upgradeOpen}
        title="Unlock Backtests"
        description="Backtests are a Pro/Premium feature. Upgrade to access daily backtest runs and keep your research workflow fast."
        onClose={() => setUpgradeOpen(false)}
      />
    </div>
  );
}
