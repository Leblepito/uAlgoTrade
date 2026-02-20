"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "./locales";
import { translations, t as translateFn } from "./translations";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

/* ------------------------------------------------------------------ */
/*  Context                                                             */
/* ------------------------------------------------------------------ */

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
});

/* ------------------------------------------------------------------ */
/*  Storage key                                                         */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "u2algo_locale";

function detectBrowserLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const lang = (navigator.language || "en").split("-")[0].toLowerCase();
  if ((LOCALES as readonly string[]).includes(lang)) return lang as Locale;
  return DEFAULT_LOCALE;
}

function loadStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (LOCALES as readonly string[]).includes(stored)) return stored as Locale;
  return detectBrowserLocale();
}

/* ------------------------------------------------------------------ */
/*  Provider                                                            */
/* ------------------------------------------------------------------ */

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setLocaleState(loadStoredLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (!(LOCALES as readonly string[]).includes(newLocale)) return;
      setLocaleState(newLocale);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, newLocale);
      }
      // Optionally sync with backend if user is authenticated
      syncLocaleWithBackend(newLocale).catch(() => {});
    },
    []
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translateFn(locale, key, vars),
    [locale]
  );

  // Avoid hydration mismatch — render with default locale until mounted
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: DEFAULT_LOCALE, setLocale, t: (k, v) => translateFn(DEFAULT_LOCALE, k, v) }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */

export function useI18n() {
  return useContext(I18nContext);
}

/* ------------------------------------------------------------------ */
/*  Backend sync (best-effort, no throw)                               */
/* ------------------------------------------------------------------ */

async function syncLocaleWithBackend(locale: Locale): Promise<void> {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("fp_access_token");
  if (!token) return;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  await fetch(`${base}/api/account/language`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ language: locale }),
    credentials: "include",
  });
}
