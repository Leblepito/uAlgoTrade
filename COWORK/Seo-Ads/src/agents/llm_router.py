"""Smart LLM Router — picks Gemini or Claude based on task characteristics.

Strategy:
  Gemini (default) → Content generation, bulk operations, hashtag research,
                      campaign planning, most content writing tasks.
                      Fast, cost-effective, Google ecosystem alignment.

  Claude           → Complex cultural adaptation, nuanced reasoning,
                      multi-step analysis, synthesis of conflicting data,
                      sensitive content review, edge-case handling.

The router examines the agent role and task context to decide.
"""

from __future__ import annotations

import logging
import os

from .llm_provider import LLMConfig, LLMProvider
from .models import AgentRole

logger = logging.getLogger(__name__)

# ── Which roles prefer which provider ─────────────────────

# Claude excels at: nuanced reasoning, cultural sensitivity, complex synthesis
_CLAUDE_PREFERRED_ROLES: set[AgentRole] = {
    AgentRole.cultural_adapter,     # Nuanced cultural understanding
    AgentRole.orchestrator,         # Complex task decomposition & synthesis
}

# Everything else defaults to Gemini (fast, cost-effective, Google ecosystem)
_GEMINI_PREFERRED_ROLES: set[AgentRole] = {
    AgentRole.content_writer,       # Bulk content generation
    AgentRole.seo_optimizer,        # SEO analysis
    AgentRole.hashtag_researcher,   # Hashtag research
    AgentRole.campaign_planner,     # Campaign strategy
    AgentRole.blog_writer,          # Long-form blog posts
}

# Context signals that push toward Claude regardless of role
_CLAUDE_CONTEXT_SIGNALS = [
    "complex",
    "sensitive",
    "controversial",
    "legal",
    "compliance",
    "nuanced",
    "multi-step",
    "conflicting",
    "ambiguous",
]

# Context signals that push toward Gemini
_GEMINI_CONTEXT_SIGNALS = [
    "bulk",
    "batch",
    "simple",
    "template",
    "quick",
    "standard",
    "trending",
]


def _has_signal(text: str, signals: list[str]) -> bool:
    """Check if any signal keyword appears in the text."""
    lower = text.lower()
    return any(s in lower for s in signals)


class LLMRouter:
    """Routes tasks to the best LLM provider based on role and context.

    Usage:
        router = LLMRouter()
        llm = router.route(role=AgentRole.content_writer, instruction="Write BTC ad for Instagram")
        response = await llm.chat(...)
    """

    def __init__(self):
        self._gemini_key = os.getenv("GEMINI_API_KEY", "")
        self._claude_key = os.getenv("ANTHROPIC_API_KEY", "")

        # Models (configurable via env)
        self._gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self._gemini_pro_model = os.getenv("GEMINI_PRO_MODEL", "gemini-2.5-pro-preview-06-05")
        self._claude_model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")

        if not self._gemini_key and not self._claude_key:
            logger.warning("No LLM API keys configured! Set GEMINI_API_KEY or ANTHROPIC_API_KEY")

    def route(
        self,
        role: AgentRole,
        instruction: str = "",
        force_provider: str | None = None,
    ) -> LLMProvider:
        """Pick the best LLM for this task.

        Args:
            role: The agent role performing the task.
            instruction: The task instruction text (used for signal detection).
            force_provider: Override automatic routing ("gemini" | "anthropic").

        Returns:
            Configured LLMProvider instance.
        """
        # Explicit override
        if force_provider:
            return self._make_provider(force_provider)

        # Determine best provider
        provider, model, reason = self._decide(role, instruction)
        logger.info("LLM Router: %s → %s (%s) — %s", role.value, provider, model, reason)
        return self._make_provider(provider, model)

    def _decide(self, role: AgentRole, instruction: str) -> tuple[str, str, str]:
        """Core routing logic. Returns (provider, model, reason)."""

        # 1. If only one key is available, use that
        if self._gemini_key and not self._claude_key:
            return "gemini", self._gemini_model, "only Gemini key available"
        if self._claude_key and not self._gemini_key:
            return "anthropic", self._claude_model, "only Claude key available"

        # 2. Check context signals — override role-based defaults
        if _has_signal(instruction, _CLAUDE_CONTEXT_SIGNALS):
            return "anthropic", self._claude_model, f"context signal detected for Claude"
        if _has_signal(instruction, _GEMINI_CONTEXT_SIGNALS):
            return "gemini", self._gemini_model, f"context signal detected for Gemini"

        # 3. Role-based routing
        if role in _CLAUDE_PREFERRED_ROLES:
            return "anthropic", self._claude_model, f"role {role.value} prefers Claude"

        # 4. Default: Gemini (primary, cost-effective, Google ecosystem)
        # Use Gemini Pro for complex tasks (campaign planning, blog writing), Flash for rest
        if role == AgentRole.campaign_planner:
            return "gemini", self._gemini_pro_model, "campaign planning → Gemini Pro"
        if role == AgentRole.blog_writer:
            return "gemini", self._gemini_pro_model, "blog writing → Gemini Pro"

        return "gemini", self._gemini_model, "default → Gemini Flash"

    def _make_provider(self, provider: str, model: str | None = None) -> LLMProvider:
        """Create a configured LLMProvider for the given provider."""
        if provider == "gemini":
            return LLMProvider(LLMConfig(
                provider="gemini",
                api_key=self._gemini_key,
                model=model or self._gemini_model,
            ))
        elif provider == "anthropic":
            return LLMProvider(LLMConfig(
                provider="anthropic",
                api_key=self._claude_key,
                model=model or self._claude_model,
            ))
        else:
            # Fallback to whatever is available
            if self._gemini_key:
                return self._make_provider("gemini", model)
            return self._make_provider("anthropic", model)

    def status(self) -> dict:
        """Return router configuration status."""
        return {
            "gemini_configured": bool(self._gemini_key),
            "gemini_model": self._gemini_model,
            "gemini_pro_model": self._gemini_pro_model,
            "claude_configured": bool(self._claude_key),
            "claude_model": self._claude_model,
            "default_provider": "gemini" if self._gemini_key else "anthropic",
            "routing_rules": {
                "gemini_roles": [r.value for r in _GEMINI_PREFERRED_ROLES],
                "claude_roles": [r.value for r in _CLAUDE_PREFERRED_ROLES],
            },
        }
