"""Blog post model — stores AI-generated and manually written blog content."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, Enum as SAEnum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

import enum

from src.models.base import Base, TimestampMixin, new_uuid


class BlogStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class BlogPost(Base, TimestampMixin):
    __tablename__ = "blog_posts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    slug: Mapped[str] = mapped_column(String(300), unique=True, nullable=False, index=True)
    headline: Mapped[str] = mapped_column(String(300), nullable=False)
    excerpt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    meta_title: Mapped[Optional[str]] = mapped_column(String(70), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    primary_keyword: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    language: Mapped[str] = mapped_column(String(10), default="en")
    project: Mapped[str] = mapped_column(String(50), default="cowork")
    status: Mapped[BlogStatus] = mapped_column(SAEnum(BlogStatus), default=BlogStatus.DRAFT)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    author_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    estimated_read_time_min: Mapped[int] = mapped_column(Integer, default=5)
