export const LOCALES = ['en', 'tr', 'th', 'ru', 'zh', 'es'] as const;
export type Locale = typeof LOCALES[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
  th: 'ภาษาไทย',
  ru: 'Русский',
  zh: '中文',
  es: 'Español',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  tr: '🇹🇷',
  th: '🇹🇭',
  ru: '🇷🇺',
  zh: '🇨🇳',
  es: '🇪🇸',
};

export const DEFAULT_LOCALE: Locale = 'en';
