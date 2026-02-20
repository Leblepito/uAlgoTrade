import type { MetadataRoute } from "next";

import { getSiteUrl, LOCALE_META } from "@/lib/site";

const LOCALES = ["en", "tr", "th", "ar", "ru", "zh"] as const;

const PAGES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/indicators", changeFrequency: "daily" as const, priority: 1 },
  { path: "/backtest", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/pricing", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/privacy-policy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/terms-of-service", changeFrequency: "yearly" as const, priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const page of PAGES) {
    const alternates: Record<string, string> = {};
    for (const locale of LOCALES) {
      alternates[locale] = `${siteUrl}${page.path}?lang=${locale}`;
    }
    alternates["x-default"] = `${siteUrl}${page.path}`;

    entries.push({
      url: `${siteUrl}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages: alternates },
    });
  }

  return entries;
}
