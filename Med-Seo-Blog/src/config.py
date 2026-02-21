"""Med-Seo-Blog — Configuration."""
from __future__ import annotations

import os

PORT = int(os.getenv("PORT", "8083"))
HOST = os.getenv("HOST", "0.0.0.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# LLM
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-2.5-pro-preview-06-05")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Integration
THAITURK_API_URL = os.getenv("THAITURK_API_URL", "http://localhost:8000")
THAITURK_API_KEY = os.getenv("THAITURK_API_KEY", "")

# CORS
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]

# Content
DEFAULT_LANG = os.getenv("DEFAULT_LANG", "tr")
SUPPORTED_LANGS = [l.strip() for l in os.getenv("SUPPORTED_LANGS", "tr,en,ru,ar,th").split(",")]
DEFAULT_REGION = os.getenv("DEFAULT_REGION", "turkey")
