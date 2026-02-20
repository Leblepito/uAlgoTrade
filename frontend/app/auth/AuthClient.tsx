"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES, LOCALE_FLAGS, LOCALE_NAMES, type Locale } from "@/lib/i18n/locales";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthClient() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedLang, setSelectedLang] = useState<Locale>(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  const emailOk = EMAIL_RE.test(email.trim());
  const pwLenOk = password.length >= 12 && password.length <= 128;
  const pwLowerOk = /[a-z]/.test(password);
  const pwUpperOk = /[A-Z]/.test(password);
  const pwDigitOk = /\d/.test(password);
  const pwSymbolOk = /[^A-Za-z0-9]/.test(password);
  const passwordOk =
    mode === "signin"
      ? password.length > 0
      : pwLenOk && pwLowerOk && pwUpperOk && pwDigitOk && pwSymbolOk;
  const nameOk = mode === "signin" ? true : name.trim().length >= 2;
  const canSubmit = emailOk && passwordOk && nameOk && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!emailOk || !passwordOk || !nameOk) return;
    setLoading(true);
    setError(null);

    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim(), selectedLang);
        // Apply selected language after signup
        setLocale(selectedLang);
      }
      router.push("/indicators");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <img
              src="/brand/logo-mark.svg"
              alt="U2Algo"
              className="w-12 h-12 rounded-xl border border-white/10 bg-slate-900"
              draggable={false}
            />
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-white font-space">U2ALGO</span>
              <span className="text-xs font-medium text-slate-400 tracking-wider sm:tracking-widest uppercase">
                BACKTEST & SIGNAL PLATFORM
              </span>
            </div>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            {t("auth_hero_title")}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {t("auth_hero_subtitle")}
            </span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed max-w-md mb-10">
            {t("auth_hero_desc")}
          </p>

          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">3+</span>
              <span className="text-sm text-slate-500">{t("auth_stat_indicators")}</span>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">Real-time</span>
              <span className="text-sm text-slate-500">{t("auth_stat_data")}</span>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">Pro</span>
              <span className="text-sm text-slate-500">{t("auth_stat_charts")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <img
              src="/brand/logo-mark.svg"
              alt="U2Algo"
              className="w-10 h-10 rounded-xl border border-white/10 bg-slate-900"
              draggable={false}
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white font-space">U2ALGO</span>
              <span className="text-xs font-medium text-slate-400 tracking-wider sm:tracking-widest uppercase">
                BACKTEST & SIGNAL PLATFORM
              </span>
            </div>
          </Link>

          {/* Sign In / Sign Up toggle */}
          <div className="flex gap-1 p-1 bg-slate-900/50 rounded-xl mb-8 border border-white/5">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === "signin" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {t("auth_sign_in")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === "signup" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {t("auth_create_account")}
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === "signin" ? t("auth_welcome_back") : t("auth_get_started")}
          </h2>
          <p className="text-slate-400 mb-8">
            {mode === "signin" ? t("auth_enter_credentials") : t("auth_create_desc")}
          </p>

          {error && (
            <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  {t("auth_full_name")}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  required
                />
                {touched.name && !nameOk && (
                  <p className="mt-2 text-xs text-rose-400">{t("auth_name_hint")}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                {t("auth_email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                required
              />
              {touched.email && !emailOk && <p className="mt-2 text-xs text-rose-400">{t("auth_email_hint")}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  {t("auth_password")}
                </label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                required
              />

              {mode === "signup" && (
                <div className="mt-3 grid grid-cols-1 gap-1.5 text-[11px]">
                  <Rule ok={pwLenOk} label={t("auth_pw_len")} />
                  <Rule ok={pwLowerOk} label={t("auth_pw_lower")} />
                  <Rule ok={pwUpperOk} label={t("auth_pw_upper")} />
                  <Rule ok={pwDigitOk} label={t("auth_pw_digit")} />
                  <Rule ok={pwSymbolOk} label={t("auth_pw_symbol")} />
                </div>
              )}

              {touched.password && mode === "signup" && !passwordOk && (
                <p className="mt-2 text-xs text-rose-400">{t("auth_pw_hint")}</p>
              )}
            </div>

            {/* Language selection — only on signup */}
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t("auth_select_language")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LOCALES.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setSelectedLang(loc as Locale)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        selectedLang === loc
                          ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                          : "border-white/10 bg-slate-900/50 text-slate-300 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-base">{LOCALE_FLAGS[loc as Locale]}</span>
                      <span className="truncate">{LOCALE_NAMES[loc as Locale]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t("common_loading")}
                </span>
              ) : mode === "signin" ? (
                t("auth_sign_in")
              ) : (
                t("auth_create_account")
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            {t("auth_terms_prefix")}{" "}
            <a href="/terms-of-service" className="text-cyan-400 hover:text-cyan-300">
              {t("auth_terms_link")}
            </a>{" "}
            {t("auth_and")}{" "}
            <a href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300">
              {t("auth_privacy_link")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 ${ok ? "text-emerald-300" : "text-slate-500"}`}>
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
          ok ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5"
        }`}
      >
        {ok ? (
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.42 0l-3.49-3.49a1 1 0 011.42-1.42l2.78 2.78 6.49-6.49a1 1 0 011.42 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
        )}
      </span>
      <span>{label}</span>
    </div>
  );
}
