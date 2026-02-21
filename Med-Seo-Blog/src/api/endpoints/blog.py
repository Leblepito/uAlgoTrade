"""Med-Seo-Blog — Blog Generation API Endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from src.agents.orchestrator import MedSeoOrchestrator
from src.models.content import BlogRequest, FullBlogPackageRequest

router = APIRouter(prefix="/api/blog", tags=["Blog"])
orchestrator = MedSeoOrchestrator()


@router.post("/generate")
async def generate_blog(body: BlogRequest) -> dict:
    """AI-powered blog yazisi uret."""
    return await orchestrator.write_blog(
        procedure=body.procedure.value,
        region=body.region.value,
        lang=body.lang.value,
        tone=body.tone.value,
        target_keywords=body.target_keywords,
    )


@router.post("/full-package")
async def full_blog_package(body: FullBlogPackageRequest) -> dict:
    """
    Tam blog paketi: Blog + SEO skor + Meta tags + Schema.org + Keywords.
    Tek endpoint ile tum blog altyapisini uretir.
    """
    return await orchestrator.generate_full_blog_package(
        procedure=body.procedure.value,
        region=body.region.value,
        lang=body.lang.value,
        tone=body.tone.value,
        base_url=body.base_url,
    )
