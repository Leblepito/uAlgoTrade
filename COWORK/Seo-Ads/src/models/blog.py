"""Pydantic models for AI blog post generation."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from .content import Region


class BlogProject(str, Enum):
    """Available projects for blog content."""
    COWORK = "cowork"
    UALGO = "ualgo"
    SEO_ADS = "seo_ads"
    GENERAL = "general"


class BlogTopicType(str, Enum):
    """Blog post topic categories."""
    PRODUCT = "product"
    INDUSTRY = "industry"
    GUIDE = "guide"
    COMPARISON = "comparison"
    EDUCATIONAL = "educational"
    MARKET = "market"
    TECHNICAL = "technical"
    THOUGHT_LEADERSHIP = "thought_leadership"


class BlogRequest(BaseModel):
    """Request to generate a single blog post."""
    project: BlogProject = Field(default=BlogProject.GENERAL, description="Target project/product")
    region: Region = Field(default=Region.EN, description="Language/region for the post")
    topic_type: BlogTopicType = Field(default=BlogTopicType.PRODUCT, description="Content category")
    topic: str = Field(description="Specific topic or title idea for the blog post")
    keywords: list[str] = Field(default_factory=list, description="Extra keywords to target")
    word_count: int = Field(default=1200, ge=400, le=3000, description="Target word count")


class BlogCTA(BaseModel):
    text: str
    button_label: str
    link_placeholder: str


class BlogInternalLink(BaseModel):
    anchor: str
    slug: str


class BlogPost(BaseModel):
    """Generated blog post."""
    meta_title: str = Field(description="SEO meta title (max 60 chars)")
    meta_description: str = Field(description="SEO meta description (max 155 chars)")
    slug: str = Field(description="URL-friendly slug")
    headline: str = Field(description="Blog post H1 title")
    excerpt: str = Field(description="Short preview for listing pages")
    body_markdown: str = Field(description="Full blog content in Markdown")
    tags: list[str] = Field(default_factory=list)
    primary_keyword: str = Field(default="")
    secondary_keywords: list[str] = Field(default_factory=list)
    estimated_read_time_min: int = Field(default=5)
    cta: Optional[BlogCTA] = None
    internal_links: list[BlogInternalLink] = Field(default_factory=list)
    language: str = Field(default="en")
    project: BlogProject = Field(default=BlogProject.GENERAL)


class BlogResponse(BaseModel):
    """Response wrapping a generated blog post."""
    post: BlogPost
    project_name: str
    region_used: str
    topic_type: str


class BulkBlogRequest(BaseModel):
    """Generate blog posts for multiple projects/regions at once."""
    project: BlogProject = Field(default=BlogProject.GENERAL)
    regions: list[Region] = Field(
        default_factory=lambda: [Region.EN, Region.TR],
        description="Generate for these regions",
    )
    topic_type: BlogTopicType = Field(default=BlogTopicType.PRODUCT)
    topic: str = Field(description="Blog topic")
    keywords: list[str] = Field(default_factory=list)
    word_count: int = Field(default=1200, ge=400, le=3000)


class BulkBlogResponse(BaseModel):
    total: int
    posts: list[BlogResponse]
