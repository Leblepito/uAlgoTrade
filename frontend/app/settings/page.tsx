"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMe, getAccessToken, postAuthed } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES, LOCALE_FLAGS, LOCALE_NAMES, type Locale } from "@/lib/i18n/locales";
import { Navbar } from "@/components/Navbar";

/* ------------------------------------------------------------------ */
/*  Plan badge                                                          */
/* ------------------------------------------------------------------ */

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free: "bg-slate-700/50 text-slate-300 border-slate-600",
    pro: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    premium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  };
  const labels: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    premium: "Premium",
  };
  const key = (plan || "free").toLowerCase();
  return (
    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${styles[key] || styles.free}`}>
      {labels[key] || key}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings Page                                                       */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();

  const [me, setMe] = useState<{
    userId: string;
    email: string | null;
    displayName: string | null;
    planCode: string;
  } | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* Load user info */
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/auth");
      return;
    }
    getMe()
      .then((data) => {
        setMe(data);
        setDisplayName(data.displayName || "");
      })
      .catch((err) => {
        if ((err as Error & { status?: number }).status === 401) {
          router.push("/auth");
        } else {
          setLoadError("Failed to load account info.");
        }
      });
  }, [router]);

  /* Save display name */
  const saveDisplayName = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await postAuthed("/api/account/display-name", { displayName: displayName.trim() });
      setSaveMsg(t("settings_saved"));
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg(t("settings_save_error"));
    } finally {
      setSaving(false);
    }
  };

  /* Change language */
  const handleLocaleChange = (loc: Locale) => {
    setLocale(loc);
    setSaveMsg(t("settings_lang_changed", { lang: LOCALE_NAMES[loc] }));
    setTimeout(() => setSaveMsg(null), 3000);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-rose-400">{loadError}</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {t("common_loading")}
        </div>
      </div>
    );
  }

  const displayLabel = me.displayName || me.email || "User";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/indicators"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("nav_indicators")}
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              {(displayLabel[0] || "?").toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("settings_title")}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-400">{me.email}</span>
                <PlanBadge plan={me.planCode} />
              </div>
            </div>
          </div>
        </div>

        {/* Success / error message */}
        {saveMsg && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {saveMsg}
          </div>
        )}

        {/* ---- Profile section ---- */}
        <section className="mb-6">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">{t("settings_profile")}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t("settings_display_name")}</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={me.email || "Your name"}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={saveDisplayName}
                    disabled={saving || !displayName.trim()}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "..." : t("settings_save")}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t("settings_email")}</label>
                <p className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/5 text-slate-400 text-sm">
                  {me.email}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Language section ---- */}
        <section className="mb-6">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">{t("settings_language")}</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-400 mb-4">{t("settings_language_desc")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {LOCALES.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleLocaleChange(loc as Locale)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-medium transition-all text-sm ${
                      locale === loc
                        ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                        : "border-white/10 bg-slate-800/50 text-slate-300 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xl">{LOCALE_FLAGS[loc as Locale]}</span>
                    <span>{LOCALE_NAMES[loc as Locale]}</span>
                    {locale === loc && (
                      <svg className="w-4 h-4 ml-auto text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- Subscription section ---- */}
        <section className="mb-6">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">{t("settings_subscription")}</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300 font-medium">{t("settings_current_plan")}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t("settings_plan_desc")}</p>
                </div>
                <PlanBadge plan={me.planCode} />
              </div>
              {me.planCode === "free" && (
                <Link
                  href="/pricing"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all"
                >
                  {t("settings_upgrade")}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ---- Danger zone ---- */}
        <section>
          <div className="bg-slate-900/60 border border-rose-500/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-rose-500/10">
              <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">{t("settings_danger_zone")}</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-400 mb-4">{t("settings_delete_desc")}</p>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/10 transition-colors"
                onClick={() => {
                  if (confirm(t("settings_delete_confirm"))) {
                    // TODO: implement account deletion API
                    alert(t("settings_delete_contact"));
                  }
                }}
              >
                {t("settings_delete_account")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
