export const LOCALES = ['en', 'tr', 'th', 'ar', 'ru', 'zh'] as const;
export type Locale = typeof LOCALES[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
  th: 'ภาษาไทย',
  ar: 'العربية',
  ru: 'Русский',
  zh: '中文',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  tr: '🇹🇷',
  th: '🇹🇭',
  ar: '🇦🇪',
  ru: '🇷🇺',
  zh: '🇨🇳',
};

export const RTL_LOCALES: readonly Locale[] = ['ar'];

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export const DEFAULT_LOCALE: Locale = 'en';
