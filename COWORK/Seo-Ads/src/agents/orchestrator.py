"""Orchestrator agent — the brain that analyzes tasks, spawns subagents, and merges results.

LLM Routing:
  - Orchestrator itself uses Claude (complex reasoning, task decomposition)
  - Each subagent gets the best LLM via LLMRouter (Gemini for most, Claude for cultural/sensitive)
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from .base import BaseAgent
from .llm_provider import LLMProvider
from .llm_router import LLMRouter
from .models import (
    AgentRole,
    AgentStepLog,
    AgentTaskRequest,
    AgentTaskResponse,
    CampaignRequest,
    SubTask,
    TaskStatus,
)
from .subagents import (
    CampaignPlannerAgent,
    ContentWriterAgent,
    CulturalAdapterAgent,
    HashtagResearcherAgent,
    SEOOptimizerAgent,
)

logger = logging.getLogger(__name__)

# Map role → agent class
AGENT_REGISTRY: dict[AgentRole, type[BaseAgent]] = {
    AgentRole.content_writer: ContentWriterAgent,
    AgentRole.seo_optimizer: SEOOptimizerAgent,
    AgentRole.cultural_adapter: CulturalAdapterAgent,
    AgentRole.hashtag_researcher: HashtagResearcherAgent,
    AgentRole.campaign_planner: CampaignPlannerAgent,
}

# Platform specs for subagent context
PLATFORM_SPECS = {
    "google_ads": {"headline_max": 30, "body_max": 90, "hashtags": False, "max_hashtags": 0},
    "meta_fb": {"headline_max": 80, "body_max": 500, "hashtags": True, "max_hashtags": 5},
    "meta_ig": {"headline_max": 60, "body_max": 2200, "hashtags": True, "max_hashtags": 15},
    "x_twitter": {"headline_max": 50, "body_max": 280, "hashtags": True, "max_hashtags": 3},
    "youtube": {"headline_max": 100, "body_max": 5000, "hashtags": True, "max_hashtags": 5},
    "seo_blog": {"headline_max": 70, "body_max": 3000, "hashtags": False, "max_hashtags": 0},
}


class Orchestrator:
    """Main orchestrator — receives goals, plans subtasks, spawns subagents, merges results.

    Uses LLMRouter to automatically pick the best LLM for each task:
    - Gemini: content writing, SEO, hashtags, campaign planning (fast, cost-effective)
    - Claude: orchestration, cultural adaptation, synthesis (nuanced reasoning)
    """

    SYSTEM_PROMPT = """You are the Orchestrator of an AI marketing agency for crypto/fintech brands.

Your job: analyze a user's goal and decide which specialist subagents to deploy.

Available subagents:
- content_writer: Writes marketing copy (headlines, body, CTA) for a specific platform+region
- seo_optimizer: Optimizes content for search engines and platform algorithms
- cultural_adapter: Adapts content for cultural fit in target regions
- hashtag_researcher: Finds optimal hashtags for engagement
- campaign_planner: Designs multi-platform campaign strategies

Rules:
1. Break the goal into the minimum necessary subtasks
2. Assign each subtask to the best-fit subagent role
3. Include all needed context in each subtask
4. Subtasks that don't depend on each other can run in parallel (same priority)
5. Subtasks that need previous results must have higher priority numbers
6. Never exceed max_subagents limit
7. Return valid JSON"""

    def __init__(self, router: LLMRouter | None = None):
        self.router = router or LLMRouter()
        # Orchestrator uses Claude for planning (complex reasoning)
        self.llm = self.router.route(role=AgentRole.orchestrator, instruction="task planning")
        self.logs: list[AgentStepLog] = []
        self.total_tokens: int = 0
        self._providers_to_close: list[LLMProvider] = [self.llm]

    # ── Public API ────────────────────────────────────────

    async def run(self, request: AgentTaskRequest) -> AgentTaskResponse:
        """Execute a free-form goal."""
        start = time.monotonic()
        response = AgentTaskResponse(goal=request.goal, status=TaskStatus.running)
        subtasks: list[SubTask] = []

        try:
            # Step 1: Plan subtasks (Claude — complex reasoning)
            self._log("plan", f"Analyzing goal: {request.goal[:100]}")
            self._log("llm", f"Orchestrator using: {self.llm.provider_name}/{self.llm.config.model}")
            subtasks = await self._plan(request)
            response.subtasks = subtasks
            self._log("plan", f"Planned {len(subtasks)} subtasks")

            # Step 2: Execute subtasks (each gets optimal LLM via router)
            await self._execute_subtasks(subtasks)

            # Step 3: Synthesize final result (Claude — merging complex data)
            self._log("synthesize", "Merging subagent results")
            final = await self._synthesize(request.goal, subtasks)
            response.result = final
            response.status = TaskStatus.completed

        except Exception as exc:
            response.status = TaskStatus.failed
            response.error = str(exc)
            self._log("error", str(exc))
            logger.exception("Orchestrator failed")

        response.logs = self.logs
        response.subtasks = subtasks
        response.total_tokens_used = self.total_tokens
        response.duration_ms = int((time.monotonic() - start) * 1000)

        # Cleanup all LLM providers
        await self._cleanup()
        return response

    async def run_campaign(self, request: CampaignRequest) -> AgentTaskResponse:
        """Shortcut: run a full campaign generation."""
        goal = (
            f"Create a {request.topic} marketing campaign for {request.symbol}. "
            f"Regions: {', '.join(request.regions)}. "
            f"Platforms: {', '.join(request.platforms)}. "
            f"Brand voice: {request.brand_voice}. "
            f"{request.extra_instructions}"
        )
        return await self.run(AgentTaskRequest(
            goal=goal,
            context={
                "topic": request.topic,
                "symbol": request.symbol,
                "regions": request.regions,
                "platforms": request.platforms,
                "brand_voice": request.brand_voice,
            },
            max_subagents=len(request.regions) * len(request.platforms) + 3,
        ))

    # ── Planning ──────────────────────────────────────────

    async def _plan(self, request: AgentTaskRequest) -> list[SubTask]:
        """Ask the LLM to decompose the goal into subtasks."""
        prompt = f"""Goal: {request.goal}

Context: {request.context}
Max subagents allowed: {request.max_subagents}

Available platforms: {list(PLATFORM_SPECS.keys())}
Available regions: en, tr, th, ar, ru, zh

Decompose this goal into subtasks. Return JSON:
{{
  "subtasks": [
    {{
      "role": "content_writer|seo_optimizer|cultural_adapter|hashtag_researcher|campaign_planner",
      "instruction": "Specific instruction for this subagent",
      "context": {{"platform": "...", "region": "...", "topic": "...", "symbol": "...", ...}},
      "priority": 1
    }}
  ]
}}

Priority 1 = runs first, priority 2 = runs after priority 1 completes, etc.
Subtasks with the same priority run in parallel."""

        resp = await self.llm.chat_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_message=prompt,
        )

        raw_tasks = resp.get("subtasks", [])
        subtasks = []
        for rt in raw_tasks[:request.max_subagents]:
            role_str = rt.get("role", "content_writer")
            try:
                role = AgentRole(role_str)
            except ValueError:
                role = AgentRole.content_writer

            ctx = rt.get("context", {})
            # Inject platform specs if platform is specified
            if "platform" in ctx and ctx["platform"] in PLATFORM_SPECS:
                ctx["platform_spec"] = PLATFORM_SPECS[ctx["platform"]]

            # Carry over request context
            for k, v in request.context.items():
                ctx.setdefault(k, v)

            subtasks.append(SubTask(
                role=role,
                instruction=rt.get("instruction", ""),
                context=ctx,
            ))

        return subtasks

    # ── Execution ─────────────────────────────────────────

    async def _execute_subtasks(self, subtasks: list[SubTask]) -> None:
        """Execute subtasks, running same-priority tasks in parallel."""
        groups: dict[int, list[SubTask]] = {}
        for st in subtasks:
            p = st.context.pop("priority", 1) if "priority" in st.context else 1
            groups.setdefault(p, []).append(st)

        for priority in sorted(groups.keys()):
            group = groups[priority]
            self._log("execute", f"Running priority-{priority} batch: {len(group)} subagents")

            tasks = [self._run_subagent(st) for st in group]
            await asyncio.gather(*tasks, return_exceptions=True)

            # Feed results into next priority group's context
            completed_results = {
                st.id: st.result for st in group if st.status == TaskStatus.completed
            }
            for next_priority in sorted(groups.keys()):
                if next_priority > priority:
                    for st in groups[next_priority]:
                        st.context["previous_results"] = completed_results

    async def _run_subagent(self, subtask: SubTask) -> SubTask:
        """Spawn the appropriate subagent with the best LLM for its role."""
        agent_cls = AGENT_REGISTRY.get(subtask.role)
        if not agent_cls:
            subtask.status = TaskStatus.failed
            subtask.error = f"Unknown role: {subtask.role}"
            return subtask

        # Route to best LLM for this subagent's role
        llm = self.router.route(role=subtask.role, instruction=subtask.instruction)
        self._providers_to_close.append(llm)

        agent = agent_cls(llm=llm)
        self._log(
            "spawn",
            f"Spawning {agent.name} [{llm.provider_name}/{llm.config.model}]: {subtask.instruction[:60]}"
        )

        result = await agent.run(subtask)

        # Collect agent logs and tokens
        self.logs.extend(agent.logs)
        self.total_tokens += agent.total_tokens
        return result

    # ── Synthesis ─────────────────────────────────────────

    async def _synthesize(self, goal: str, subtasks: list[SubTask]) -> dict:
        """Merge all subagent results into a coherent final output."""
        results_summary = []
        for st in subtasks:
            results_summary.append({
                "role": st.role.value,
                "instruction": st.instruction[:100],
                "status": st.status.value,
                "result": st.result,
                "error": st.error,
            })

        prompt = f"""Original goal: {goal}

Subagent results:
{results_summary}

Synthesize all results into a final, coherent deliverable. Return JSON:
{{
  "summary": "Brief summary of what was accomplished",
  "deliverables": [
    {{
      "type": "content|campaign|optimization|research",
      "platform": "...",
      "region": "...",
      "data": {{...}}
    }}
  ],
  "recommendations": ["Next steps or improvements..."],
  "quality_score": 0-100
}}"""

        resp = await self.llm.chat_json(
            system_prompt="You are a marketing project manager. Synthesize subagent outputs into a clean deliverable.",
            user_message=prompt,
        )
        return resp

    # ── Cleanup ───────────────────────────────────────────

    async def _cleanup(self):
        """Close all LLM provider HTTP clients."""
        for provider in self._providers_to_close:
            try:
                await provider.close()
            except Exception:
                pass

    # ── Logging ───────────────────────────────────────────

    def _log(self, action: str, detail: str):
        entry = AgentStepLog(
            agent="Orchestrator",
            role=AgentRole.orchestrator,
            action=action,
            detail=detail,
        )
        self.logs.append(entry)
        logger.info("[Orchestrator] %s: %s", action, detail)
