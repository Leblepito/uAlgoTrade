"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe } from "@/lib/auth";

function formatFundingRate(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(4)}%`;
}

type FundingState = {
  status: "loading" | "success" | "error";
  current: number;
  predicted: number;
  error?: string;
};

export function FundingRateBanner() {
  const [isPaid, setIsPaid] = useState(false);
  const [state, setState] = useState<FundingState>({
    status: "loading",
    current: 0,
    predicted: 0,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await getMe();
        const paid = me.planCode === "pro" || me.planCode === "premium";
        if (!cancelled) setIsPaid(paid);
      } catch {
        if (!cancelled) setIsPaid(false);
      }
    })();

    const fetchFunding = async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5033";
      
      try {
        const res = await fetch(`${apiBaseUrl}/api/FundingRate/btc`, { 
          cache: "no-store"
        });
        
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        
        const data = await res.json() as {
          current: number;
          predicted: number;
          fetchedAt: number;
        };
        
        setState({
          status: "success",
          current: data.current,
          predicted: data.predicted,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setState({
          status: "error",
          current: 0,
          predicted: 0,
          error: msg,
        });
      }
    };

    const timer = setTimeout(fetchFunding, 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 border-t border-white/5 bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-slate-400">BTC Aggregated Funding Rate</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-[10px] sm:text-xs">Getting funding data...</span>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 border-t border-white/5 bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-slate-400">BTC Aggregated Funding Rate</span>
        </div>
        <div className="text-[10px] sm:text-xs text-rose-300">{state.error}</div>
      </div>
    );
  }

  const currentText = formatFundingRate(state.current);
  const predictedText = state.predicted !== 0 ? formatFundingRate(state.predicted) : "n/a";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 border-t border-white/5 bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
      <div className="flex items-center gap-2 text-slate-300">
        <span className="text-slate-400">BTC Aggregated Funding Rate</span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 text-[10px] sm:text-xs">Current:</span>
          <span
            className={`font-semibold tabular-nums ${state.current >= 0 ? "text-emerald-400" : "text-rose-400"} ${isPaid ? "" : "blur-[3px] select-none"}`}
            aria-label={isPaid ? currentText : "Locked"}
          >
            {currentText}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 text-[10px] sm:text-xs">Predicted:</span>
          <span className={`text-slate-300 tabular-nums ${isPaid ? "" : "blur-[3px] select-none"}`} aria-label={isPaid ? predictedText : "Locked"}>
            {predictedText}
          </span>
        </div>

        {!isPaid && (
          <div className="flex items-center gap-2 pl-1">
            <span className="hidden sm:inline text-[10px] text-slate-500">Pro/Premium required</span>
            <Link
              href="/pricing"
              className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-500/15"
            >
              <span className="sm:hidden">Unblur</span>
              <span className="hidden sm:inline">Unblur aggregated funding rate</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
