"""
Seo-Ads Python Integration Example

Usage in any Python app (Django, Flask, FastAPI, scripts):
    from seo_ads_client import SeoAdsClient
    client = SeoAdsClient(base_url="https://your-seo-ads.railway.app", api_key="xxx")
    content = client.generate(region="tr", platform="meta_ig")
"""

from __future__ import annotations

import httpx


class SeoAdsClient:
    """Lightweight Python client for the Seo-Ads API."""

    def __init__(self, base_url: str = "http://localhost:8080", api_key: str | None = None):
        self.base_url = base_url.rstrip("/")
        self.headers: dict[str, str] = {"Content-Type": "application/json"}
        if api_key:
            self.headers["X-API-Key"] = api_key

    def generate(
        self,
        region: str = "en",
        platform: str = "meta_ig",
        topic: str = "crypto_trading",
        symbol: str | None = None,
    ) -> dict:
        """Generate a single content piece."""
        resp = httpx.post(
            f"{self.base_url}/content/generate",
            headers=self.headers,
            json={"region": region, "platform": platform, "topic": topic, "symbol": symbol},
        )
        resp.raise_for_status()
        return resp.json()

    def bulk(
        self,
        regions: list[str] | None = None,
        platforms: list[str] | None = None,
        topic: str = "crypto_trading",
        symbol: str | None = None,
    ) -> dict:
        """Generate content for multiple regions x platforms."""
        resp = httpx.post(
            f"{self.base_url}/content/bulk",
            headers=self.headers,
            json={
                "regions": regions or ["en", "tr", "th", "ar", "ru", "zh"],
                "platforms": platforms or ["meta_ig"],
                "topic": topic,
                "symbol": symbol,
            },
        )
        resp.raise_for_status()
        return resp.json()

    def regions(self) -> list[dict]:
        """List available regions."""
        resp = httpx.get(f"{self.base_url}/content/regions", headers=self.headers)
        resp.raise_for_status()
        return resp.json()

    def platforms(self) -> list[dict]:
        """List available platforms."""
        resp = httpx.get(f"{self.base_url}/content/platforms", headers=self.headers)
        resp.raise_for_status()
        return resp.json()


# ---------------------------------------------------------------------------
# Usage examples
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    client = SeoAdsClient(base_url="http://localhost:8080")

    # Single content
    print("=== Single content (TR / Instagram) ===")
    result = client.generate(region="tr", platform="meta_ig", symbol="BTCUSDT")
    piece = result["pieces"][0]
    print(f"Headline: {piece['headline']}")
    print(f"Body: {piece['body']}")
    print(f"CTA: {piece['cta']}")
    print(f"Hashtags: {' '.join(piece['hashtags'])}")
    print()

    # Bulk
    print("=== Bulk content (all regions / X Twitter) ===")
    bulk = client.bulk(platforms=["x_twitter"])
    print(f"Total pieces: {bulk['total']}")
    for p in bulk["content"]:
        print(f"  [{p['region']}] {p['headline']}")
    print()

    # Regions
    print("=== Available regions ===")
    for r in client.regions():
        print(f"  {r['code']}: {r['name']} ({r['tone']})")
