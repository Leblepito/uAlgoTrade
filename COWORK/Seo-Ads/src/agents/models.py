"""Agent task and result models."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class AgentRole(str, Enum):
    orchestrator = "orchestrator"
    content_writer = "content_writer"
    seo_optimizer = "seo_optimizer"
    cultural_adapter = "cultural_adapter"
    hashtag_researcher = "hashtag_researcher"
    campaign_planner = "campaign_planner"


# ── Requests ──────────────────────────────────────────────

class AgentTaskRequest(BaseModel):
    """User-facing request to run the agent."""
    goal: str = Field(..., description="High-level goal in natural language")
    context: dict[str, Any] = Field(default_factory=dict, description="Extra context (region, platform, symbol, etc.)")
    max_subagents: int = Field(default=5, ge=1, le=20, description="Max subagents the orchestrator may spawn")


class CampaignRequest(BaseModel):
    """Shortcut for full campaign generation."""
    topic: str = Field(default="crypto_trading")
    symbol: str = Field(default="BTC")
    regions: list[str] = Field(default_factory=lambda: ["en", "tr"])
    platforms: list[str] = Field(default_factory=lambda: ["meta_ig", "x_twitter", "seo_blog"])
    brand_voice: str = Field(default="professional yet approachable")
    extra_instructions: str = Field(default="")


# ── Internal task model ───────────────────────────────────

class SubTask(BaseModel):
    """A task assigned to a subagent by the orchestrator."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    role: AgentRole
    instruction: str
    context: dict[str, Any] = Field(default_factory=dict)
    status: TaskStatus = TaskStatus.pending
    result: Any = None
    error: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None


# ── Responses ─────────────────────────────────────────────

class AgentStepLog(BaseModel):
    """Single reasoning / action step."""
    agent: str
    role: AgentRole
    action: str
    detail: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AgentTaskResponse(BaseModel):
    """Full response returned to the user."""
    task_id: str = Field(default_factory=lambda: uuid.uuid4().hex[:16])
    goal: str
    status: TaskStatus
    result: Any = None
    subtasks: list[SubTask] = Field(default_factory=list)
    logs: list[AgentStepLog] = Field(default_factory=list)
    total_tokens_used: int = 0
    duration_ms: int = 0
    error: str | None = None
