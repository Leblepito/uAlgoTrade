"""Social media content generation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from src.models.content import (
    BulkContentRequest,
    BulkContentResponse,
    ContentRequest,
    ContentResponse,
    Platform,
    Region,
)
from src.services.content_generator import content_generator

router = APIRouter()


@router.post("/generate", response_model=ContentResponse)
async def generate_content(req: ContentRequest) -> ContentResponse:
    """Generate a single content piece for a specific region + platform."""
    return content_generator.generate(req)


@router.post("/bulk", response_model=BulkContentResponse)
async def generate_bulk(req: BulkContentRequest) -> BulkContentResponse:
    """Generate content for multiple regions and platforms at once."""
    pieces = content_generator.generate_bulk(
        regions=req.regions or list(Region),
        platforms=req.platforms or list(Platform),
        topic=req.topic,
        symbol=req.symbol,
    )
    return BulkContentResponse(total=len(pieces), content=pieces)


@router.get("/regions")
async def list_regions() -> list[dict]:
    """List available regions with culture profile summaries."""
    from src.services.content_generator import REGION_PROFILES

    return [
        {
            "code": region.value,
            "name": profile["name"],
            "tone": profile["tone"],
            "style": profile["style"],
            "emoji_density": profile["emoji_density"],
        }
        for region, profile in REGION_PROFILES.items()
    ]


@router.get("/platforms")
async def list_platforms() -> list[dict]:
    """List available platforms with spec summaries."""
    from src.services.content_generator import PLATFORM_SPECS

    return [
        {
            "code": platform.value,
            "name": spec["name"],
            "headline_max": spec["headline_max"],
            "body_max": spec["body_max"],
            "hashtags": spec.get("hashtags", False),
            "tips": spec["tips"],
        }
        for platform, spec in PLATFORM_SPECS.items()
    ]
