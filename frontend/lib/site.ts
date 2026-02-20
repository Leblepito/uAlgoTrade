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

