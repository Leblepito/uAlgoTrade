"""Blog endpoints — public reading + admin management."""

from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user, require_admin
from src.db.session import get_session
from src.models.blog_post import BlogStatus
from src.models.user import User
from src.services.blog_service import BlogService

router = APIRouter(prefix="/blog", tags=["blog"])


# ── Schemas ────────────────────────────────────────────────

class BlogPostOut(BaseModel):
    id: str
    slug: str
    headline: str
    excerpt: Optional[str]
    body_markdown: str
    meta_title: Optional[str]
    meta_description: Optional[str]
    primary_keyword: Optional[str]
    tags: Optional[list[str]] = None
    language: str
    project: str
    status: str
    is_ai_generated: bool
    author_id: Optional[str]
    estimated_read_time_min: int
    created_at: str
    updated_at: str
    model_config = {"from_attributes": True}


class BlogPostCreate(BaseModel):
    headline: str
    body_markdown: str
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    primary_keyword: Optional[str] = None
    tags: Optional[list[str]] = None
    language: str = "en"
    project: str = "cowork"
    status: str = Field(default="draft")
    is_ai_generated: bool = False
    estimated_read_time_min: int = 5


class BlogPostUpdate(BaseModel):
    headline: Optional[str] = None
    body_markdown: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    primary_keyword: Optional[str] = None
    tags: Optional[list[str]] = None
    language: Optional[str] = None
    project: Optional[str] = None
    status: Optional[str] = None
    estimated_read_time_min: Optional[int] = None


def _to_out(post) -> dict:
    """Convert BlogPost ORM to dict with parsed tags."""
    d = {
        "id": post.id,
        "slug": post.slug,
        "headline": post.headline,
        "excerpt": post.excerpt,
        "body_markdown": post.body_markdown,
        "meta_title": post.meta_title,
        "meta_description": post.meta_description,
        "primary_keyword": post.primary_keyword,
        "tags": json.loads(post.tags) if post.tags else [],
        "language": post.language,
        "project": post.project,
        "status": post.status.value if hasattr(post.status, "value") else post.status,
        "is_ai_generated": post.is_ai_generated,
        "author_id": post.author_id,
        "estimated_read_time_min": post.estimated_read_time_min,
        "created_at": post.created_at.isoformat() if post.created_at else "",
        "updated_at": post.updated_at.isoformat() if post.updated_at else "",
    }
    return d


# ── Public endpoints ───────────────────────────────────────

@router.get("/posts", response_model=list[BlogPostOut])
async def list_posts(
    language: Optional[str] = None,
    project: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
):
    """List published blog posts (public)."""
    svc = BlogService(session)
    posts = await svc.list_published(language=language, project=project, limit=limit, offset=offset)
    return [_to_out(p) for p in posts]


@router.get("/posts/{slug_or_id}")
async def get_post(slug_or_id: str, session: AsyncSession = Depends(get_session)):
    """Get a single published blog post by slug or ID (public)."""
    svc = BlogService(session)
    post = await svc.get_by_slug(slug_or_id) or await svc.get_by_id(slug_or_id)
    if not post or post.status != BlogStatus.PUBLISHED:
        raise HTTPException(status_code=404, detail="Post not found")
    return _to_out(post)


# ── Admin endpoints ────────────────────────────────────────

@router.get("/admin/posts", response_model=list[BlogPostOut])
async def admin_list_posts(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
):
    """List all blog posts (admin only)."""
    svc = BlogService(session)
    blog_status = BlogStatus(status) if status else None
    posts = await svc.list_all(status=blog_status, limit=limit, offset=offset)
    return [_to_out(p) for p in posts]


@router.post("/admin/posts", status_code=201)
async def admin_create_post(
    body: BlogPostCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_admin),
):
    """Create a new blog post (admin only)."""
    svc = BlogService(session)
    post = await svc.create(
        headline=body.headline,
        body_markdown=body.body_markdown,
        slug=body.slug,
        excerpt=body.excerpt,
        meta_title=body.meta_title,
        meta_description=body.meta_description,
        primary_keyword=body.primary_keyword,
        tags=body.tags,
        language=body.language,
        project=body.project,
        status=BlogStatus(body.status),
        is_ai_generated=body.is_ai_generated,
        author_id=user.id,
        estimated_read_time_min=body.estimated_read_time_min,
    )
    return _to_out(post)


@router.patch("/admin/posts/{post_id}")
async def admin_update_post(
    post_id: str,
    body: BlogPostUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
):
    """Update a blog post (admin only)."""
    svc = BlogService(session)
    updates = body.model_dump(exclude_unset=True)
    if "status" in updates:
        updates["status"] = BlogStatus(updates["status"])
    post = await svc.update(post_id, **updates)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return _to_out(post)


@router.delete("/admin/posts/{post_id}", status_code=204)
async def admin_delete_post(
    post_id: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
):
    """Delete a blog post (admin only)."""
    svc = BlogService(session)
    if not await svc.delete(post_id):
        raise HTTPException(status_code=404, detail="Post not found")
