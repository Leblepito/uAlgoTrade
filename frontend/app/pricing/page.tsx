"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getAccessToken } from "@/lib/auth";

type Plan = {
  code: "free" | "pro" | "premium";
  name: string;
  price: string;
  subtitle: string;
  bullets: string[];
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    code: "free",
    name: "Free",
    price: "$0",
    subtitle: "Get started with the basics",
    bullets: [
      "Support / Resistance indicator",
      "BTC aggregated funding rate (blurred)",
      "Backtest: not available",
    ],
  },
  {
    code: "pro",
    name: "Pro",
    price: "$39.99",
    subtitle: "For serious retail traders",
    bullets: [
      "Order Block / Breaker Block + Elliott Wave",
      "Unblur aggregated funding rate",
      "Backtests per day: 20",
    ],
    highlight: true,
  },
  {
    code: "premium",
    name: "Premium",
    price: "$59.99",
    subtitle: "Higher limits for power users",
    bullets: [
      "Order Block / Breaker Block + Elliott Wave",
      "Unblur aggregated funding rate",
      "Backtests per day: 50",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setIsLoggedIn(!!getAccessToken());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleUpgrade = (planCode: string) => {
    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }
    setToast(`${planCode === "pro" ? "Pro" : "Premium"} plan â€” payment integration coming soon!`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Navbar />

      <main className="flex-grow">
        <div className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  Pricing
                </div>
                <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Upgrade your edge
                </h1>
                <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-xl">
                  Unlock Pro indicators, unblur the BTC aggregated funding rate, and access backtests.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isLoggedIn && (
                  <Link
                    href="/auth"
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                  >
                    Sign in
                  </Link>
                )}
                <Link
                  href="/indicators"
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-500 transition-colors"
                >
                  Open app
                </Link>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {plans.map((p) => (
                <div
                  key={p.code}
                  className={`relative flex flex-col rounded-2xl border p-5 sm:p-6 overflow-hidden ${p.highlight
                      ? "border-cyan-500/30 bg-cyan-500/5"
                      : "border-white/10 bg-white/[0.03]"
                    }`}
                >
                  {p.highlight && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      MOST POPULAR
                    </div>
                  )}

                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-xl font-bold text-white">{p.name}</div>
                    <div className="text-sm font-semibold text-slate-300">{p.price}</div>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{p.subtitle}</div>

                  <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-500" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    <button
                      type="button"
                      disabled={p.code === "free"}
                      onClick={() => p.code !== "free" && handleUpgrade(p.code)}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${p.code === "free"
                          ? "border border-white/10 bg-white/5 text-slate-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                        }`}
                    >
                      {p.code === "free" ? "Current plan" : "Upgrade"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
          <div className="rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/60 px-5 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-slate-200">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
