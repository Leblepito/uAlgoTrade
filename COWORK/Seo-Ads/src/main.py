"""Seo-Ads: Standalone AI Social Media Content Engine.

A culture-aware, platform-optimized content generation API
designed to be integrated into any website or app.
"""

from __future__ import annotations

import os
import time
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse

from src.api.endpoints import content
from src.api.endpoints import agent
from src.api.endpoints import blog

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PORT = int(os.getenv("PORT", "8080"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
API_KEYS = set(filter(None, os.getenv("SEO_ADS_API_KEYS", "").split(",")))
RATE_LIMIT_RPM = int(os.getenv("RATE_LIMIT_RPM", "120"))  # requests per minute

# ---------------------------------------------------------------------------
# Rate limiter (in-memory, per API key)
# ---------------------------------------------------------------------------

_rate_store: dict[str, list[float]] = {}


def _check_rate_limit(key: str) -> bool:
    """Return True if within rate limit, False if exceeded."""
    now = time.time()
    window = 60.0
    if key not in _rate_store:
        _rate_store[key] = []
    # Remove old entries
    _rate_store[key] = [t for t in _rate_store[key] if now - t < window]
    if len(_rate_store[key]) >= RATE_LIMIT_RPM:
        return False
    _rate_store[key].append(now)
    return True


# ---------------------------------------------------------------------------
# API Key auth
# ---------------------------------------------------------------------------

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str | None = Security(api_key_header)) -> str | None:
    """Verify API key if API_KEYS are configured. Skip auth if none set."""
    # If no API keys configured, allow all (dev mode)
    if not API_KEYS:
        return "anonymous"
    if not api_key or api_key not in API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    if not _check_rate_limit(api_key):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    return api_key


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    gemini_ok = bool(os.getenv("GEMINI_API_KEY"))
    claude_ok = bool(os.getenv("ANTHROPIC_API_KEY"))
    print(f"Seo-Ads starting on port {PORT}")
    print(f"CORS origins: {CORS_ORIGINS}")
    print(f"API key auth: {'enabled' if API_KEYS else 'disabled (dev mode)'}")
    print(f"Rate limit: {RATE_LIMIT_RPM} req/min")
    print(f"AI Agent LLM Router:")
    print(f"  Gemini: {'configured' if gemini_ok else 'NOT SET'} (primary — content, SEO, hashtags)")
    print(f"  Claude: {'configured' if claude_ok else 'NOT SET'} (secondary — orchestration, cultural)")
    if not gemini_ok and not claude_ok:
        print(f"  WARNING: No LLM keys configured! /agent endpoints will fail.")
    yield
    print("Seo-Ads shutting down")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Seo-Ads",
    description="AI-powered, culture-aware social media content generation API. "
                "Integrates into any website or app via REST API.",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow configured origins (default: all)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-Id", "X-RateLimit-Remaining"],
)


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def add_request_headers(request: Request, call_next):
    """Add request ID and rate limit headers."""
    request_id = secrets.token_hex(8)
    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    return response


# ---------------------------------------------------------------------------
# Health & info routes
# ---------------------------------------------------------------------------

@app.get("/health", tags=["system"])
async def health():
    """Health check for load balancers and monitoring."""
    return {"status": "healthy", "service": "seo-ads", "version": "1.0.0"}


@app.get("/", tags=["system"])
async def root():
    """Service info and quick-start links."""
    return {
        "service": "Seo-Ads",
        "version": "2.0.0",
        "description": "AI Social Media Content Engine + AI Agent System",
        "docs": "/docs",
        "endpoints": {
            "generate": "POST /content/generate",
            "bulk": "POST /content/bulk",
            "regions": "GET /content/regions",
            "platforms": "GET /content/platforms",
            "agent_run": "POST /agent/run",
            "agent_campaign": "POST /agent/campaign",
            "agent_roles": "GET /agent/roles",
            "blog_generate": "POST /blog/generate",
            "blog_bulk": "POST /blog/bulk",
            "blog_projects": "GET /blog/projects",
        },
        "integration": {
            "auth": "Set X-API-Key header (optional in dev mode)",
            "cors": "Configured via CORS_ORIGINS env var",
            "embed_js": "GET /embed/sdk.js",
        },
    }


# ---------------------------------------------------------------------------
# Embed SDK (JavaScript snippet for website integration)
# ---------------------------------------------------------------------------

@app.get("/embed/sdk.js", tags=["integration"], response_class=JSONResponse)
async def embed_sdk(request: Request):
    """Return embeddable JavaScript SDK for website integration."""
    base_url = str(request.base_url).rstrip("/")
    sdk_code = f"""
// Seo-Ads SDK v1.0.0
// Add to your website: <script src="{base_url}/embed/sdk.js"></script>
(function(window) {{
  'use strict';

  var SeoAds = {{
    _baseUrl: '{base_url}',
    _apiKey: null,

    init: function(config) {{
      this._baseUrl = config.baseUrl || this._baseUrl;
      this._apiKey = config.apiKey || null;
      console.log('[SeoAds] Initialized', this._baseUrl);
      return this;
    }},

    _fetch: function(path, body) {{
      var headers = {{ 'Content-Type': 'application/json' }};
      if (this._apiKey) headers['X-API-Key'] = this._apiKey;
      return fetch(this._baseUrl + path, {{
        method: body ? 'POST' : 'GET',
        headers: headers,
        body: body ? JSON.stringify(body) : undefined
      }}).then(function(r) {{ return r.json(); }});
    }},

    generate: function(region, platform, topic, symbol) {{
      return this._fetch('/content/generate', {{
        region: region,
        platform: platform,
        topic: topic || 'crypto_trading',
        symbol: symbol || null
      }});
    }},

    bulk: function(regions, platforms, topic, symbol) {{
      return this._fetch('/content/bulk', {{
        regions: regions,
        platforms: platforms,
        topic: topic || 'crypto_trading',
        symbol: symbol || null
      }});
    }},

    regions: function() {{
      return this._fetch('/content/regions');
    }},

    platforms: function() {{
      return this._fetch('/content/platforms');
    }}
  }};

  window.SeoAds = SeoAds;
}})(window);
"""
    return JSONResponse(
        content={"sdk": sdk_code, "usage": {
            "html": f'<script src="{base_url}/embed/sdk.js"></script>',
            "init": "SeoAds.init({ apiKey: 'YOUR_KEY' })",
            "generate": "SeoAds.generate('tr', 'meta_ig', 'crypto_trading', 'BTCUSDT')",
            "bulk": "SeoAds.bulk(['en','tr'], ['meta_fb','x_twitter'])",
        }},
        headers={"Content-Type": "application/json"},
    )


# ---------------------------------------------------------------------------
# Webhook endpoint (for async delivery to integrators)
# ---------------------------------------------------------------------------

_webhook_urls: dict[str, str] = {}


@app.post("/webhooks/register", tags=["integration"])
async def register_webhook(payload: dict):
    """Register a webhook URL for async content delivery.

    Body: {"url": "https://yourapp.com/webhook", "events": ["content.generated"]}
    """
    url = payload.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="url is required")
    hook_id = secrets.token_hex(8)
    _webhook_urls[hook_id] = url
    return {"hook_id": hook_id, "url": url, "status": "registered"}


@app.delete("/webhooks/{hook_id}", tags=["integration"])
async def delete_webhook(hook_id: str):
    """Unregister a webhook."""
    if hook_id not in _webhook_urls:
        raise HTTPException(status_code=404, detail="Webhook not found")
    del _webhook_urls[hook_id]
    return {"hook_id": hook_id, "status": "deleted"}


# ---------------------------------------------------------------------------
# Register content router
# ---------------------------------------------------------------------------

app.include_router(content.router, prefix="/content", tags=["content"])
app.include_router(agent.router, tags=["AI Agent"])
app.include_router(blog.router, tags=["Blog"])


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=PORT, log_level=LOG_LEVEL, reload=True)
