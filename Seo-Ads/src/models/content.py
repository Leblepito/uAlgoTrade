"""Pydantic models for social media content generation."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Platform(str, Enum):
    GOOGLE_ADS = "google_ads"
    META_FB = "meta_fb"
    META_IG = "meta_ig"
    X_TWITTER = "x_twitter"
    YOUTUBE = "youtube"
    SEO_BLOG = "seo_blog"


class Region(str, Enum):
    EN = "en"
    TR = "tr"
    TH = "th"
    AR = "ar"
    RU = "ru"
    ZH = "zh"


class ContentRequest(BaseModel):
    region: Region = Field(description="Target region/language code")
    platform: Platform = Field(description="Target social media platform")
    topic: str = Field(
        default="crypto_trading",
        description="Content topic: crypto_trading, market_update, product_promo, educational",
    )
    symbol: Optional[str] = Field(default=None, description="Crypto symbol context (e.g. BTCUSDT)")
    custom_prompt: Optional[str] = Field(default=None, description="Optional custom prompt for content")


class ContentPiece(BaseModel):
    headline: str = Field(description="Primary headline / title")
    body: str = Field(description="Main content body")
    cta: str = Field(description="Call to action text")
    hashtags: list[str] = Field(default_factory=list, description="Relevant hashtags")
    character_count: int = Field(description="Total character count")
    platform: Platform
    region: Region
    tone: str = Field(description="Tone used: professional, casual, urgent, etc.")


class ContentResponse(BaseModel):
    pieces: list[ContentPiece] = Field(description="Generated content pieces")
    region_profile: str = Field(description="Region profile name used")
    platform_spec: str = Field(description="Platform spec applied")


class BulkContentRequest(BaseModel):
    regions: list[Region] = Field(
        default_factory=lambda: list(Region),
        description="Target regions (defaults to all)",
    )
    platforms: list[Platform] = Field(
        default_factory=lambda: list(Platform),
        description="Target platforms (defaults to all)",
    )
    topic: str = Field(default="crypto_trading")
    symbol: Optional[str] = Field(default=None)


class BulkContentResponse(BaseModel):
    total: int
    content: list[ContentPiece]
