"""Med-Seo-Blog — SEO Analysis API Endpoints."""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import Response

from src.agents.orchestrator import MedSeoOrchestrator
from src.models.content import (
    KeywordAnalysisRequest,
    KeywordExpandRequest,
    ContentScoreRequest,
    ContentOptimizeRequest,
    MetaTagRequest,
    SitemapRequest,
    KeywordGapRequest,
)

router = APIRouter(prefix="/api/seo", tags=["SEO"])
orchestrator = MedSeoOrchestrator()


# ---------------------------------------------------------------------------
# Keywords
# ---------------------------------------------------------------------------

@router.post("/keywords/analyze")
def keyword_analysis(body: KeywordAnalysisRequest) -> dict:
    """Prosedur keyword analizi — volume, difficulty, CPC."""
    return orchestrator.analyze_keywords(
        procedure=body.procedure.value,
        region=body.region.value,
        lang=body.lang.value,
    )


@router.post("/keywords/expand")
async def keyword_expand(body: KeywordExpandRequest) -> dict:
    """LLM ile keyword genisleme — yeni long-tail keyword'ler kesfet."""
    return await orchestrator.expand_keywords(
        procedure=body.procedure.value,
        region=body.region.value,
        lang=body.lang.value,
        count=body.count,
    )


@router.get("/keywords/all")
def all_keywords(procedure: str | None = None, lang: str | None = None) -> dict:
    """Tum keyword veritabanini listele."""
    return orchestrator.get_all_keywords(procedure=procedure, lang=lang)


@router.post("/keywords/gap")
def keyword_gap(body: KeywordGapRequest) -> dict:
    """Rakip keyword gap analizi."""
    return orchestrator.seo_optimizer.keyword_gap_analysis(
        our_keywords=body.our_keywords,
        competitor_keywords=body.competitor_keywords,
    )


# ---------------------------------------------------------------------------
# Content Analysis
# ---------------------------------------------------------------------------

@router.post("/score")
def content_score(body: ContentScoreRequest) -> dict:
    """Icerik SEO skoru hesapla (0-100)."""
    return orchestrator.score_content(body.text, body.target_keywords)


@router.post("/optimize")
async def content_optimize(body: ContentOptimizeRequest) -> dict:
    """LLM ile icerik optimizasyonu onerileri al."""
    return await orchestrator.optimize_content(
        text=body.text,
        keywords=body.target_keywords,
        lang=body.lang.value,
    )


# ---------------------------------------------------------------------------
# Meta Tags
# ---------------------------------------------------------------------------

@router.post("/meta-tags")
def meta_tags(body: MetaTagRequest) -> dict:
    """SEO meta tag seti uret (title, description, OG, Twitter)."""
    return orchestrator.generate_meta_tags(
        title=body.title,
        description=body.description,
        keywords=body.keywords,
        lang=body.lang.value,
    )


# ---------------------------------------------------------------------------
# Schema.org
# ---------------------------------------------------------------------------

@router.post("/schema")
def generate_schema(body: dict) -> dict:
    """Schema.org JSON-LD structured data uret."""
    return orchestrator.generate_schema(
        title=body.get("title", ""),
        description=body.get("description", ""),
        procedure=body.get("procedure", "hair_transplant"),
        lang=body.get("lang", "tr"),
        url=body.get("url", ""),
        faqs=body.get("faqs"),
    )


# ---------------------------------------------------------------------------
# Sitemap
# ---------------------------------------------------------------------------

@router.post("/sitemap")
def generate_sitemap(body: SitemapRequest) -> Response:
    """XML sitemap uret."""
    procedures = [p.value for p in body.procedures] if body.procedures else None
    langs = [l.value for l in body.langs] if body.langs else None

    xml = orchestrator.generate_sitemap(
        base_url=body.base_url,
        procedures=procedures,
        langs=langs,
    )
    return Response(content=xml, media_type="application/xml")
