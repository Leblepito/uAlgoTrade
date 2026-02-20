export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (!raw) return "https://ualgotrade.com";

  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteOrigin(): URL {
  return new URL(getSiteUrl());
}

export const SITE_NAME = "U2Algo";
export const SITE_DESCRIPTION =
  "Crypto indicators workbench with backend-calculated signals and modern charting.";

/** Per-locale meta descriptions for SEO */
export const LOCALE_META: Record<string, { description: string; title: string }> = {
  en: {
    title: "U2Algo — AI-Powered Crypto Trading Platform",
    description: "Trade smarter with multi-agent AI swarm intelligence. Real-time indicators, backtesting, and risk management for cryptocurrency markets.",
  },
  tr: {
    title: "U2Algo — Yapay Zeka Destekli Kripto Ticaret Platformu",
    description: "Çoklu ajan AI sürü zekası ile daha akıllı trade edin. Kripto piyasaları için gerçek zamanlı göstergeler, geri test ve risk yönetimi.",
  },
  th: {
    title: "U2Algo — แพลตฟอร์มเทรดคริปโตด้วย AI",
    description: "เทรดอัจฉริยะด้วยระบบฝูง AI หลายตัวแทน ตัวชี้วัดเรียลไทม์ การทดสอบย้อนหลัง และการจัดการความเสี่ยงสำหรับตลาดคริปโต",
  },
  ar: {
    title: "U2Algo — منصة تداول العملات الرقمية بالذكاء الاصطناعي",
    description: "تداول أذكى مع ذكاء سرب متعدد الوكلاء. مؤشرات فورية واختبار رجعي وإدارة مخاطر لأسواق العملات الرقمية.",
  },
  ru: {
    title: "U2Algo — Платформа для крипто-трейдинга на основе ИИ",
    description: "Торгуйте умнее с мультиагентным роевым интеллектом. Индикаторы в реальном времени, бэктестинг и управление рисками для криптовалютных рынков.",
  },
  zh: {
    title: "U2Algo — AI驱动的加密货币交易平台",
    description: "利用多代理AI群体智能更聪明地交易。为加密货币市场提供实时指标、回测和风险管理。",
  },
};

