import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { getSiteOrigin, getSiteUrl, SITE_DESCRIPTION, SITE_NAME, LOCALE_META } from "@/lib/site";
import { I18nProvider } from "@/lib/i18n/context";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space' });

const siteUrl = getSiteOrigin();
const siteUrlStr = getSiteUrl();

const LOCALES = ["en", "tr", "th", "ar", "ru", "zh"] as const;

const alternateLanguages: Record<string, string> = {};
for (const locale of LOCALES) {
  alternateLanguages[locale] = `${siteUrlStr}/?lang=${locale}`;
}
alternateLanguages["x-default"] = `${siteUrlStr}/`;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: alternateLanguages,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
    alternateLocale: ["tr_TR", "th_TH", "ar_AE", "ru_RU", "zh_CN"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: siteUrl.origin,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    inLanguage: LOCALES.map((l) => l),
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "Basic crypto indicators and support/resistance",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "39.99",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "Order Block, Breaker Block, Elliott Wave + 20 backtests/day",
      },
      {
        "@type": "Offer",
        name: "Premium",
        price: "59.99",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "All Pro features + 50 backtests/day",
      },
    ],
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl.origin}/indicators?symbol={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl.origin,
    sameAs: [],
  };

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-black text-slate-200 antialiased selection:bg-cyan-500/30 selection:text-cyan-200`}>
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-black via-black to-black opacity-100 pointer-events-none"></div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
