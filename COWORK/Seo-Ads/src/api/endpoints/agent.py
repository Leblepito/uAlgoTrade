"""Agent API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ...agents.llm_provider import LLMConfig, LLMProvider
from ...agents.models import AgentTaskRequest, AgentTaskResponse, CampaignRequest
from ...agents.orchestrator import Orchestrator

router = APIRouter(prefix="/agent", tags=["AI Agent"])


def _get_llm() -> LLMProvider:
    """Create LLM provider from env config."""
    return LLMProvider(LLMConfig())


@router.post("/run", response_model=AgentTaskResponse)
async def run_agent(request: AgentTaskRequest):
    """Run the AI agent with a free-form goal.

    The orchestrator will analyze the goal, plan subtasks,
    spawn specialized subagents, and return merged results.
    """
    llm = _get_llm()
    try:
        orchestrator = Orchestrator(llm=llm)
        return await orchestrator.run(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        await llm.close()


@router.post("/campaign", response_model=AgentTaskResponse)
async def run_campaign(request: CampaignRequest):
    """Shortcut to generate a full marketing campaign.

    Automatically spawns content writers, SEO optimizers,
    cultural adapters, and hashtag researchers as needed.
    """
    llm = _get_llm()
    try:
        orchestrator = Orchestrator(llm=llm)
        return await orchestrator.run_campaign(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        await llm.close()


@router.get("/roles")
async def list_roles():
    """List available subagent roles and their descriptions."""
    return {
        "roles": [
            {
                "role": "content_writer",
                "description": "Writes platform-specific marketing copy",
                "best_for": "Generating headlines, body text, and CTAs",
            },
            {
                "role": "seo_optimizer",
                "description": "Optimizes content for search and algorithms",
                "best_for": "Keyword optimization, meta descriptions, platform tips",
            },
            {
                "role": "cultural_adapter",
                "description": "Adapts content for regional/cultural fit",
                "best_for": "Localizing content across EN, TR, TH, AR, RU, ZH markets",
            },
            {
                "role": "hashtag_researcher",
                "description": "Finds optimal hashtags for engagement",
                "best_for": "Hashtag strategy for Instagram, X, YouTube",
            },
            {
                "role": "campaign_planner",
                "description": "Designs multi-platform campaign strategies",
                "best_for": "Full campaign planning with phases, KPIs, content calendar",
            },
        ]
    }
