"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { getAccessToken, getMe, signIn, signOut, signUp, type MeResult } from "@/lib/auth";

type AuthMode = "signin" | "signup";

export default function GamesPage() {
  const [me, setMe] = useState<MeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [waveProgress, setWaveProgress] = useState<number[]>([]);
  const [srAnswer, setSrAnswer] = useState<string | null>(null);
  const [msAnswer, setMsAnswer] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!getAccessToken()) return;
        const account = await getMe();
        if (!cancelled) setMe(account);
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isPaid = useMemo(
    () => (me?.planCode || "free") === "pro" || (me?.planCode || "free") === "premium",
    [me]
  );

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim());
      }
      const account = await getMe();
      setMe(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMe(null);
  };

  const handleWavePick = (value: number) => {
    setWaveProgress((prev) => {
      const expected = prev.length + 1;
      if (value === expected) return [...prev, value];
      if (value === 1) return [1];
      return [];
    });
  };

  const waveCompleted = waveProgress.length === 5;
  const userLabel = me?.displayName || me?.email || null;
  const planLabel = (me?.planCode || "free").toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav userLabel={userLabel} onSignOut={me ? handleSignOut : undefined} />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <section className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-7 mb-6 sm:mb-8 animate-fade-in">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-cyan-300/80 mb-2">U2Algo Playground</p>
            <h1 className="font-space text-2xl sm:text-4xl font-bold text-white leading-tight">
              Training Games For <span className="text-gradient">Elliott, S/R, and OB-BB</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-3xl">
              Keep it simple: learn pattern recognition with short, repeatable mini-games designed for faster signal reading.
            </p>
          </section>

          {loading ? (
            <section className="glass-panel rounded-2xl p-5 sm:p-7 text-slate-300">Loading account...</section>
          ) : !me ? (
            <section className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-2xl">
              <div className="inline-flex p-1 rounded-xl border border-white/10 bg-slate-900/80 mb-4">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    mode === "signin" ? "bg-cyan-500/20 text-cyan-200" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    mode === "signup" ? "bg-cyan-500/20 text-cyan-200" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuth} className="grid gap-3">
                {mode === "signup" ? (
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Full name"
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                ) : null}
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                {error ? <p className="text-sm text-rose-300">{error}</p> : null}
                <button
                  disabled={submitting}
                  type="submit"
                  className="inline-flex justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:from-cyan-300 hover:to-blue-400 transition-colors disabled:opacity-70"
                >
                  {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
                </button>
              </form>
            </section>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              <section className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-white font-semibold">{userLabel || "U2Algo Member"}</p>
                  <p className="text-xs sm:text-sm text-slate-400">Current plan: {planLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="sm:hidden w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/70 transition-colors"
                >
                  Sign Out
                </button>
              </section>

              {!isPaid ? (
                <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
                  <p className="font-semibold text-amber-200">Upgrade Required</p>
                  <p className="text-sm text-amber-100/80 mt-1">
                    Games are available for Pro and Premium users.
                  </p>
                  <a
                    href="https://ualgotrade.com/pricing"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex mt-3 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Open pricing
                  </a>
                </section>
              ) : null}

              <section className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${isPaid ? "" : "opacity-60 pointer-events-none"}`}>
                <article className="glass-card rounded-2xl p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-white">Game 1: Elliott 1-5</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Tap numbers in order to complete a classic impulse sequence.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleWavePick(value)}
                        className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:border-cyan-400/40"
                      >
                        {value}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setWaveProgress([])}
                      className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white"
                    >
                      Reset
                    </button>
                  </div>
                  <p className={`mt-3 text-sm ${waveCompleted ? "text-emerald-300" : "text-slate-300"}`}>
                    Sequence: {waveProgress.join(" - ") || "none"} {waveCompleted ? "-> Nice, wave 5 completed." : ""}
                  </p>
                </article>

                <article className="glass-card rounded-2xl p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-white">Game 2: Support or Resistance</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Scenario: Price drops into a historical floor and strongly rejects upward.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSrAnswer("support")}
                      className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:border-cyan-400/40"
                    >
                      Support
                    </button>
                    <button
                      type="button"
                      onClick={() => setSrAnswer("resistance")}
                      className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:border-cyan-400/40"
                    >
                      Resistance
                    </button>
                  </div>
                  <p className={`mt-3 text-sm ${srAnswer === "support" ? "text-emerald-300" : "text-slate-300"}`}>
                    {!srAnswer
                      ? "Pick an answer."
                      : srAnswer === "support"
                        ? "Correct. This is a support reaction."
                        : "Try again. This setup describes support."}
                  </p>
                </article>

                <article className="glass-card rounded-2xl p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-white">Game 3: OB or BB</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Scenario: Price breaks up and retests the last bearish candle zone before expansion.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMsAnswer("bullish_ob")}
                      className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:border-cyan-400/40"
                    >
                      Bullish OB
                    </button>
                    <button
                      type="button"
                      onClick={() => setMsAnswer("bearish_bb")}
                      className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:border-cyan-400/40"
                    >
                      Bearish BB
                    </button>
                  </div>
                  <p className={`mt-3 text-sm ${msAnswer === "bullish_ob" ? "text-emerald-300" : "text-slate-300"}`}>
                    {!msAnswer
                      ? "Pick an answer."
                      : msAnswer === "bullish_ob"
                        ? "Correct. This scenario fits a bullish OB revisit."
                        : "Try again. This setup maps to bullish OB context."}
                  </p>
                </article>
              </section>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
