/**
 * Seo-Ads Next.js Integration Example
 *
 * Usage in any Next.js / React app:
 *   import { SeoAdsClient } from './seo-ads-client';
 *   const client = new SeoAdsClient({ baseUrl: 'https://your-seo-ads.railway.app', apiKey: 'xxx' });
 *   const content = await client.generate('tr', 'meta_ig');
 */

// --- Types ---

export type Region = 'en' | 'tr' | 'th' | 'ar' | 'ru' | 'zh';
export type Platform = 'google_ads' | 'meta_fb' | 'meta_ig' | 'x_twitter' | 'youtube' | 'seo_blog';
export type Topic = 'crypto_trading' | 'market_update' | 'product_promo' | 'educational';

export interface ContentPiece {
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];
  character_count: number;
  platform: Platform;
  region: Region;
  tone: string;
}

export interface ContentResponse {
  pieces: ContentPiece[];
  region_profile: string;
  platform_spec: string;
}

export interface BulkResponse {
  total: number;
  content: ContentPiece[];
}

export interface RegionInfo {
  code: string;
  name: string;
  tone: string;
  style: string;
  emoji_density: string;
}

export interface PlatformInfo {
  code: string;
  name: string;
  headline_max: number;
  body_max: number;
  hashtags: boolean;
  tips: string;
}

// --- Client ---

export interface SeoAdsConfig {
  baseUrl: string;
  apiKey?: string;
}

export class SeoAdsClient {
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor(config: SeoAdsConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
  }

  private async request<T>(path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: body ? 'POST' : 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Seo-Ads API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  /** Generate a single content piece */
  async generate(
    region: Region,
    platform: Platform,
    topic: Topic = 'crypto_trading',
    symbol?: string,
  ): Promise<ContentResponse> {
    return this.request('/content/generate', { region, platform, topic, symbol });
  }

  /** Generate content for multiple regions x platforms */
  async bulk(
    regions: Region[],
    platforms: Platform[],
    topic: Topic = 'crypto_trading',
    symbol?: string,
  ): Promise<BulkResponse> {
    return this.request('/content/bulk', { regions, platforms, topic, symbol });
  }

  /** List available regions */
  async regions(): Promise<RegionInfo[]> {
    return this.request('/content/regions');
  }

  /** List available platforms */
  async platforms(): Promise<PlatformInfo[]> {
    return this.request('/content/platforms');
  }
}

// --- React Hook Example ---

/*
import { useState, useCallback } from 'react';

const client = new SeoAdsClient({
  baseUrl: process.env.NEXT_PUBLIC_SEO_ADS_URL || 'http://localhost:8080',
  apiKey: process.env.NEXT_PUBLIC_SEO_ADS_KEY,
});

export function useSeoAds() {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<ContentPiece | null>(null);

  const generate = useCallback(async (region: Region, platform: Platform, topic?: Topic) => {
    setLoading(true);
    try {
      const resp = await client.generate(region, platform, topic);
      setContent(resp.pieces[0] || null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, content, generate };
}
*/
