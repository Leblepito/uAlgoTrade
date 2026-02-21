"""Agent API endpoints — with smart Gemini/Claude routing."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ...agents.llm_router import LLMRouter
from ...agents.models import AgentTaskRequest, AgentTaskResponse, CampaignRequest
from ...agents.orchestrator import Orchestrator

router = APIRouter(prefix="/agent", tags=["AI Agent"])


@router.post("/run", response_model=AgentTaskResponse)
async def run_agent(request: AgentTaskRequest):
    """Run the AI agent with a free-form goal.

    The orchestrator will analyze the goal, plan subtasks,
    spawn specialized subagents, and return merged results.

    LLM routing is automatic:
    - Gemini: content writing, SEO, hashtags, campaign planning
    - Claude: orchestration, cultural adaptation, complex synthesis
    """
    try:
        router_instance = LLMRouter()
        orchestrator = Orchestrator(router=router_instance)
        return await orchestrator.run(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/campaign", response_model=AgentTaskResponse)
async def run_campaign(request: CampaignRequest):
    """Shortcut to generate a full marketing campaign.

    Automatically spawns content writers, SEO optimizers,
    cultural adapters, and hashtag researchers as needed.
    Each subagent uses the optimal LLM for its task.
    """
    try:
        router_instance = LLMRouter()
        orchestrator = Orchestrator(router=router_instance)
        return await orchestrator.run_campaign(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/roles")
async def list_roles():
    """List available subagent roles, their descriptions, and LLM assignment."""
    return {
        "roles": [
            {
                "role": "content_writer",
                "description": "Writes platform-specific marketing copy",
                "best_for": "Generating headlines, body text, and CTAs",
                "default_llm": "Gemini Flash",
            },
            {
                "role": "seo_optimizer",
                "description": "Optimizes content for search and algorithms",
                "best_for": "Keyword optimization, meta descriptions, platform tips",
                "default_llm": "Gemini Flash",
            },
            {
                "role": "cultural_adapter",
                "description": "Adapts content for regional/cultural fit",
                "best_for": "Localizing content across EN, TR, TH, AR, RU, ZH markets",
                "default_llm": "Claude (nuanced reasoning)",
            },
            {
                "role": "hashtag_researcher",
                "description": "Finds optimal hashtags for engagement",
                "best_for": "Hashtag strategy for Instagram, X, YouTube",
                "default_llm": "Gemini Flash",
            },
            {
                "role": "campaign_planner",
                "description": "Designs multi-platform campaign strategies",
                "best_for": "Full campaign planning with phases, KPIs, content calendar",
                "default_llm": "Gemini Pro",
            },
        ]
    }


@router.get("/router-status")
async def router_status():
    """Show current LLM router configuration and routing rules."""
    r = LLMRouter()
    return r.status()
