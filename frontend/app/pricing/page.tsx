"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getAccessToken, getMe } from "@/lib/auth";

type Plan = {
  code: "free" | "pro" | "premium";
  name: string;
  price: string;
  period: string;
  subtitle: string;
  bullets: string[];
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    code: "free",
    name: "Free",
    price: "$0",
    period: "",
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
    period: "/mo",
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
    period: "/mo",
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
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    setIsLoggedIn(!!token);
    if (token) {
      getMe()
        .then((me) => setCurrentPlan(me.planCode))
        .catch(() => {});
    }
  }, []);

  // Show success toast if returning from Stripe
  useEffect(() => {
    if (searchParams.get("session_id")) {
      setToast("Payment successful! Your plan has been upgraded.");
      // Refresh plan info
      getMe()
        .then((me) => setCurrentPlan(me.planCode))
        .catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleUpgrade = async (planCode: string) => {
    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }

    setLoading(planCode);
    try {
      const token = getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBase}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ planCode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading("manage");
    try {
      const token = getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${apiBase}/api/stripe/portal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to open billing portal");
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  const getButtonLabel = (planCode: string) => {
    if (loading === planCode) return "Redirecting...";
    if (planCode === "free") return currentPlan === "free" ? "Current plan" : "Downgrade";
    if (planCode === currentPlan) return "Current plan";
    return "Upgrade";
  };

  const isCurrentPlan = (planCode: string) => planCode === currentPlan;

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
                {isLoggedIn && currentPlan !== "free" && (
                  <button
                    type="button"
                    onClick={handleManageSubscription}
                    disabled={loading === "manage"}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {loading === "manage" ? "Opening..." : "Manage subscription"}
                  </button>
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
                    } ${isCurrentPlan(p.code) ? "ring-1 ring-cyan-500/50" : ""}`}
                >
                  {p.highlight && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      MOST POPULAR
                    </div>
                  )}

                  {isCurrentPlan(p.code) && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      YOUR PLAN
                    </div>
                  )}

                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-xl font-bold text-white">{p.name}</div>
                    <div className="text-sm font-semibold text-slate-300">
                      {p.price}
                      {p.period && <span className="text-slate-500">{p.period}</span>}
                    </div>
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
                      disabled={isCurrentPlan(p.code) || p.code === "free" || loading === p.code}
                      onClick={() => p.code !== "free" && !isCurrentPlan(p.code) && handleUpgrade(p.code)}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${isCurrentPlan(p.code) || p.code === "free"
                          ? "border border-white/10 bg-white/5 text-slate-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                        } ${loading === p.code ? "opacity-50 cursor-wait" : ""}`}
                    >
                      {getButtonLabel(p.code)}
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
