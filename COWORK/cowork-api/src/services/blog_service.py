"""Blog post CRUD service."""

from __future__ import annotations

import json
import re
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.blog_post import BlogPost, BlogStatus


def _slugify(text: str) -> str:
    """Generate a URL-friendly slug from text."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    return re.sub(r"-+", "-", slug).strip("-")[:250]


class BlogService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_published(
        self,
        language: Optional[str] = None,
        project: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[BlogPost]:
        query = select(BlogPost).where(BlogPost.status == BlogStatus.PUBLISHED)
        if language:
            query = query.where(BlogPost.language == language)
        if project:
            query = query.where(BlogPost.project == project)
        query = query.order_by(BlogPost.created_at.desc()).limit(limit).offset(offset)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def list_all(
        self,
        status: Optional[BlogStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[BlogPost]:
        """Admin: list all posts regardless of status."""
        query = select(BlogPost)
        if status:
            query = query.where(BlogPost.status == status)
        query = query.order_by(BlogPost.created_at.desc()).limit(limit).offset(offset)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, post_id: str) -> Optional[BlogPost]:
        result = await self.session.execute(select(BlogPost).where(BlogPost.id == post_id))
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[BlogPost]:
        result = await self.session.execute(select(BlogPost).where(BlogPost.slug == slug))
        return result.scalar_one_or_none()

    async def create(
        self,
        headline: str,
        body_markdown: str,
        slug: Optional[str] = None,
        excerpt: Optional[str] = None,
        meta_title: Optional[str] = None,
        meta_description: Optional[str] = None,
        primary_keyword: Optional[str] = None,
        tags: Optional[list[str]] = None,
        language: str = "en",
        project: str = "cowork",
        status: BlogStatus = BlogStatus.DRAFT,
        is_ai_generated: bool = False,
        author_id: Optional[str] = None,
        estimated_read_time_min: int = 5,
    ) -> BlogPost:
        final_slug = slug or _slugify(headline)
        # Ensure unique slug
        existing = await self.get_by_slug(final_slug)
        if existing:
            final_slug = f"{final_slug}-{existing.id[:6]}"

        post = BlogPost(
            slug=final_slug,
            headline=headline,
            body_markdown=body_markdown,
            excerpt=excerpt,
            meta_title=meta_title,
            meta_description=meta_description,
            primary_keyword=primary_keyword,
            tags=json.dumps(tags) if tags else None,
            language=language,
            project=project,
            status=status,
            is_ai_generated=is_ai_generated,
            author_id=author_id,
            estimated_read_time_min=estimated_read_time_min,
        )
        self.session.add(post)
        await self.session.commit()
        await self.session.refresh(post)
        return post

    async def update(self, post_id: str, **kwargs) -> Optional[BlogPost]:
        post = await self.get_by_id(post_id)
        if not post:
            return None
        if "tags" in kwargs and isinstance(kwargs["tags"], list):
            kwargs["tags"] = json.dumps(kwargs["tags"])
        for k, v in kwargs.items():
            if hasattr(post, k):
                setattr(post, k, v)
        await self.session.commit()
        await self.session.refresh(post)
        return post

    async def delete(self, post_id: str) -> bool:
        post = await self.get_by_id(post_id)
        if not post:
            return False
        await self.session.delete(post)
        await self.session.commit()
        return True
