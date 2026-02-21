"""Blog API endpoints — AI-powered blog post generation for all projects."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ...agents.llm_router import LLMRouter
from ...agents.models import AgentRole, AgentTaskRequest, SubTask
from ...agents.subagents.blog_writer import BlogWriterAgent
from ...models.blog import (
    BlogPost,
    BlogProject,
    BlogRequest,
    BlogResponse,
    BlogTopicType,
    BulkBlogRequest,
    BulkBlogResponse,
)

router = APIRouter(prefix="/blog", tags=["Blog"])

# Project display names
_PROJECT_NAMES = {
    BlogProject.COWORK: "Cowork — Coworking Space Management",
    BlogProject.UALGO: "U2Algo — Algorithmic Crypto Trading",
    BlogProject.SEO_ADS: "Seo-Ads — AI Content Marketing",
    BlogProject.GENERAL: "General Tech",
}


async def _generate_one(req: BlogRequest) -> BlogResponse:
    """Generate a single blog post using the BlogWriter agent."""
    llm_router = LLMRouter()
    llm = llm_router.route(role=AgentRole.blog_writer, instruction=req.topic)

    agent = BlogWriterAgent(llm=llm)
    task = SubTask(
        role=AgentRole.blog_writer,
        instruction=req.topic,
        context={
            "project": req.project.value,
            "region": req.region.value,
            "topic_type": req.topic_type.value,
            "topic": req.topic,
            "keywords": req.keywords,
            "word_count": req.word_count,
        },
    )

    result_task = await agent.run(task)
    await llm.close()

    if result_task.error:
        raise HTTPException(status_code=500, detail=result_task.error)

    data = result_task.result or {}
    post = BlogPost(
        meta_title=data.get("meta_title", ""),
        meta_description=data.get("meta_description", ""),
        slug=data.get("slug", ""),
        headline=data.get("headline", ""),
        excerpt=data.get("excerpt", ""),
        body_markdown=data.get("body_markdown", ""),
        tags=data.get("tags", []),
        primary_keyword=data.get("primary_keyword", ""),
        secondary_keywords=data.get("secondary_keywords", []),
        estimated_read_time_min=data.get("estimated_read_time_min", 5),
        cta=data.get("cta"),
        internal_links=data.get("internal_links", []),
        language=data.get("language", req.region.value),
        project=req.project,
    )

    return BlogResponse(
        post=post,
        project_name=_PROJECT_NAMES.get(req.project, req.project.value),
        region_used=req.region.value,
        topic_type=req.topic_type.value,
    )


@router.post("/generate", response_model=BlogResponse)
async def generate_blog(request: BlogRequest):
    """Generate a single SEO-optimized blog post.

    Supports multiple projects (cowork, ualgo, seo_ads) and
    6 languages/regions (en, tr, th, ar, ru, zh).
    """
    try:
        return await _generate_one(request)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/bulk", response_model=BulkBlogResponse)
async def generate_bulk_blogs(request: BulkBlogRequest):
    """Generate blog posts for multiple regions at once.

    Creates one blog post per region, all on the same topic.
    """
    try:
        posts = []
        for region in request.regions:
            single = BlogRequest(
                project=request.project,
                region=region,
                topic_type=request.topic_type,
                topic=request.topic,
                keywords=request.keywords,
                word_count=request.word_count,
            )
            resp = await _generate_one(single)
            posts.append(resp)

        return BulkBlogResponse(total=len(posts), posts=posts)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/projects")
async def list_projects():
    """List available projects and their blog topic categories."""
    from ...agents.subagents.blog_writer import BlogWriterAgent

    projects = []
    for key, ctx in BlogWriterAgent.PROJECT_CONTEXTS.items():
        projects.append({
            "id": key,
            "name": ctx["name"],
            "industry": ctx["industry"],
            "topics": ctx["topics"],
            "sample_keywords": ctx["keywords"][:5],
        })
    return {"projects": projects}


@router.get("/topic-types")
async def list_topic_types():
    """List available blog topic types."""
    return {
        "topic_types": [
            {"id": t.value, "label": t.value.replace("_", " ").title()}
            for t in BlogTopicType
        ]
    }
