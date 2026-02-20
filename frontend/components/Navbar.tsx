"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getAccessToken, setAccessToken, signOut as authSignOut } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES, LOCALE_FLAGS, LOCALE_NAMES, type Locale } from "@/lib/i18n/locales";

/* ------------------------------------------------------------------ */
/*  Language Switcher Dropdown                                          */
/* ------------------------------------------------------------------ */

function LanguageSwitcher() {
    const { locale, setLocale } = useI18n();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-white/10"
                title="Change language"
            >
                <span className="text-base leading-none">{LOCALE_FLAGS[locale]}</span>
                <span className="uppercase text-[11px] font-bold tracking-wider">{locale}</span>
                <svg
                    className={`w-3 h-3 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {LOCALES.map((loc) => (
                        <button
                            key={loc}
                            type="button"
                            onClick={() => {
                                setLocale(loc as Locale);
                                setOpen(false);
                            }}
                            className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors ${
                                loc === locale
                                    ? "bg-cyan-500/10 text-cyan-300"
                                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            <span className="text-base">{LOCALE_FLAGS[loc as Locale]}</span>
                            <span>{LOCALE_NAMES[loc as Locale]}</span>
                            {loc === locale && (
                                <svg className="w-3.5 h-3.5 ml-auto text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Mobile Language Picker                                              */
/* ------------------------------------------------------------------ */

function MobileLangPicker({ onClose }: { onClose: () => void }) {
    const { locale, setLocale } = useI18n();
    return (
        <div className="px-4 py-2">
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Language</p>
            <div className="grid grid-cols-3 gap-2">
                {LOCALES.map((loc) => (
                    <button
                        key={loc}
                        type="button"
                        onClick={() => { setLocale(loc as Locale); onClose(); }}
                        className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs transition-colors ${
                            loc === locale
                                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                        }`}
                    >
                        <span className="text-lg">{LOCALE_FLAGS[loc as Locale]}</span>
                        <span className="uppercase font-bold">{loc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                              */
/* ------------------------------------------------------------------ */

export const Navbar = () => {
    const router = useRouter();
    const { t } = useI18n();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<{ displayName: string | null; email: string | null } | null>(null);
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setTimeout(() => {
                    setUser({
                        displayName: payload.display_name || null,
                        email: payload.email || null,
                    });
                }, 0);
            } catch {
                setTimeout(() => setUser(null), 0);
            }
        }
    }, []);

    useEffect(() => {
        const update = (token: string | null) => {
            if (!token) {
                setUser(null);
                return;
            }
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setUser({
                    displayName: payload.display_name || null,
                    email: payload.email || null,
                });
            } catch {
                setUser(null);
            }
        };
        const onStorage = (e: StorageEvent) => {
            if (e.key === "fp_access_token") update(e.newValue);
        };
        const onAuthChange = (e: Event) => {
            update((e as CustomEvent).detail?.token ?? null);
        };
        window.addEventListener("storage", onStorage);
        window.addEventListener("auth-change", onAuthChange);
        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("auth-change", onAuthChange);
        };
    }, []);

    const handleSignOut = useCallback(async () => {
        setSigningOut(true);
        try {
            await authSignOut();
        } catch {
            setAccessToken(null);
        }
        setUser(null);
        setSigningOut(false);
        router.push("/auth");
    }, [router]);

    const displayLabel = user?.displayName || user?.email || "Account";

    return (
        <nav className="w-full relative z-50 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-20">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                            <Image
                                src="/brand/logo-mark.svg"
                                alt="U2Algo"
                                width={40}
                                height={40}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border border-white/10 bg-slate-900 relative"
                                draggable={false}
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base sm:text-lg font-bold tracking-tight text-white font-space leading-none">
                                U2ALGO
                            </span>
                            <span className="text-[10px] sm:text-xs font-medium text-slate-400 tracking-wider sm:tracking-widest uppercase">
                                BACKTEST &amp; SIGNAL PLATFORM
                            </span>
                        </div>
                    </Link>

                    <div className="hidden sm:flex items-center gap-1">
                        <Link
                            href="/indicators"
                            className="px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                            {t("nav_indicators")}
                        </Link>
                        <Link
                            href="/backtest"
                            className="px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                            {t("nav_backtest")}
                        </Link>
                        <Link
                            href="/education"
                            className="px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                            {t("nav_education")}
                        </Link>
                        <Link
                            href="/swarm"
                            className="px-3 py-2 text-sm font-semibold text-cyan-400 hover:text-white hover:bg-cyan-500/10 rounded-lg transition-all"
                        >
                            {t("nav_swarm")}
                        </Link>
                        <Link
                            href="/signals"
                            className="px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                            {t("nav_signals")}
                        </Link>
                        <Link
                            href="/pricing"
                            className="px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                            {t("nav_pricing")}
                        </Link>

                        <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

                        {/* Language switcher */}
                        <LanguageSwitcher />

                        <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

                        {user ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
                                    title="Settings"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                                        {(displayLabel[0] || "?").toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">
                                        {displayLabel}
                                    </span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    disabled={signingOut}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {signingOut ? "..." : t("nav_sign_out")}
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/auth"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors group"
                            >
                                <svg className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{t("nav_sign_in")}</span>
                            </Link>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="sm:hidden p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="sm:hidden border-t border-white/5 py-3 space-y-1">
                        <Link href="/indicators" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            {t("nav_indicators")}
                        </Link>
                        <Link href="/backtest" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            {t("nav_backtest")}
                        </Link>
                        <Link href="/education" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            {t("nav_education")}
                        </Link>
                        <Link href="/swarm" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-cyan-400 hover:text-white hover:bg-cyan-500/10 rounded-lg transition-all">
                            {t("nav_swarm")}
                        </Link>
                        <Link href="/signals" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            {t("nav_signals")}
                        </Link>
                        <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            {t("nav_pricing")}
                        </Link>

                        {/* Mobile language switcher */}
                        <MobileLangPicker onClose={() => setMobileMenuOpen(false)} />

                        {user ? (
                            <>
                                <Link
                                    href="/settings"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                                        {(displayLabel[0] || "?").toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-slate-200 truncate">{displayLabel}</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                                    disabled={signingOut}
                                    className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {signingOut ? "Signing out..." : t("nav_sign_out")}
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/auth"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{t("nav_sign_in")}</span>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};
