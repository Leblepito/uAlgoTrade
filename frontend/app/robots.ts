import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/health"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/health"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
