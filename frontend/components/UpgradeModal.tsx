"use client";

import Link from "next/link";
import { useEffect } from "react";

export function UpgradeModal({
  open,
  title,
  description,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b0b] shadow-2xl shadow-black/60">
          <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
                Pro / Premium
              </div>
              <h3 className="mt-3 text-xl font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              {"\u00D7"}
            </button>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-white font-semibold">Pro Indicators</div>
                <div className="mt-1 text-slate-400">Order Block / Breaker Block, Elliott Wave</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-white font-semibold">Funding</div>
                <div className="mt-1 text-slate-400">Unblur aggregated funding rate</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-white font-semibold">Backtests</div>
                <div className="mt-1 text-slate-400">20/day (Pro) &bull; 50/day (Premium)</div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                href="/pricing"
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-500"
              >
                View plans
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                Not now
              </button>
            </div>

            <p className="mt-4 text-[11px] text-slate-500">
              Tip: if you&apos;re just exploring, start with Support/Resistance &mdash; it&apos;s included in the Free plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

