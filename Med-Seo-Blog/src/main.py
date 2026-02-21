"""
Med-Seo-Blog — AI-powered Medical Tourism SEO & Blog Engine
AntiGravity Ventures / ThaiTurk platform icin optimize edilmis.

Yetenekler:
- LLM-powered blog yazisi uretimi (Gemini / Claude / OpenAI)
- SEO analiz, skorlama ve optimizasyon
- Keyword arastirma ve genisleme
- Schema.org structured data (MedicalWebPage, FAQ, Hospital)
- Meta tag uretimi (OG, Twitter Card)
- XML sitemap uretimi
- 9 medikal prosedur x 5 dil (TR/EN/RU/AR/TH)
"""
from __future__ import annotations

import logging
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from src import config
from src.agents import llm_provider

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("med-seo-blog")


# ---------------------------------------------------------------------------
# Lifespan — LLM provider check
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    gemini_ok = llm_provider.check_gemini()
    claude_ok = llm_provider.check_anthropic()
    openai_ok = llm_provider.check_openai()

    logger.info(
        f"Med-Seo-Blog starting — "
        f"Gemini={'OK' if gemini_ok else 'NO'} | "
        f"Claude={'OK' if claude_ok else 'NO'} | "
        f"OpenAI={'OK' if openai_ok else 'NO'}"
    )

    if not any([gemini_ok, claude_ok, openai_ok]):
        logger.warning("No LLM provider configured — will use template-based fallbacks")

    yield
    logger.info("Med-Seo-Blog shutting down")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Med-Seo-Blog",
    description=(
        "AI-powered Medical Tourism SEO & Blog Engine. "
        "9 procedures x 5 languages. Gemini/Claude/OpenAI multi-LLM. "
        "Designed for ThaiTurk / AntiGravity Ventures platform."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-Id"],
)


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = secrets.token_hex(8)
    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    return response


# ---------------------------------------------------------------------------
# Register routers
# ---------------------------------------------------------------------------

from src.api.endpoints.blog import router as blog_router  # noqa: E402
from src.api.endpoints.seo import router as seo_router  # noqa: E402
from src.api.endpoints.content import router as content_router  # noqa: E402

app.include_router(blog_router)
app.include_router(seo_router)
app.include_router(content_router)


# ---------------------------------------------------------------------------
# System routes
# ---------------------------------------------------------------------------

@app.get("/health", tags=["system"])
async def health():
    return {
        "status": "healthy",
        "service": "med-seo-blog",
        "version": "1.0.0",
        "llm_providers": {
            "gemini": llm_provider.check_gemini(),
            "claude": llm_provider.check_anthropic(),
            "openai": llm_provider.check_openai(),
        },
    }


@app.get("/", tags=["system"])
async def root():
    return {
        "service": "Med-Seo-Blog",
        "version": "1.0.0",
        "description": "AI-powered Medical Tourism SEO & Blog Engine",
        "platform": "ThaiTurk / AntiGravity Ventures",
        "capabilities": [
            "AI blog generation (9 procedures x 5 languages)",
            "SEO analysis & scoring",
            "Keyword research & expansion",
            "Schema.org structured data",
            "Meta tag generation",
            "XML sitemap generation",
            "Content optimization",
        ],
        "procedures": [
            "hair_transplant", "dental", "aesthetic", "bariatric",
            "ivf", "ophthalmology", "checkup", "dermatology", "oncology",
        ],
        "languages": ["tr", "en", "ru", "ar", "th"],
        "docs": "/docs",
    }


@app.get("/router-status", tags=["system"])
async def router_status():
    from src.agents.orchestrator import MedSeoOrchestrator
    orch = MedSeoOrchestrator()
    return orch.get_status()
