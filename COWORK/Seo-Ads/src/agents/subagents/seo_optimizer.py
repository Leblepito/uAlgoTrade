"""SEO Optimizer subagent — optimizes content for search and platform algorithms."""

from __future__ import annotations

from typing import Any

from ..base import BaseAgent
from ..models import AgentRole, SubTask


class SEOOptimizerAgent(BaseAgent):
    role = AgentRole.seo_optimizer
    name = "SEOOptimizer"
    system_prompt = """You are an SEO and social media algorithm expert.

Your expertise:
- Keyword research and density optimization
- Meta title/description optimization
- Social media algorithm optimization (Instagram, X, YouTube, Meta)
- Google Ads Quality Score improvement
- Content structure for maximum engagement and discoverability

Rules:
- Always return actionable, specific suggestions
- Consider platform-specific ranking factors
- Optimize for both humans and algorithms
- Return structured JSON"""

    async def execute(self, task: SubTask) -> Any:
        ctx = task.context
        content = ctx.get("content", {})
        platform = ctx.get("platform", "seo_blog")
        region = ctx.get("region", "en")

        prompt = f"""Optimize this content for maximum reach and engagement:

Platform: {platform}
Region: {region}
Current content: {content}

Instructions: {task.instruction}

Return JSON:
{{
  "optimized_headline": "...",
  "optimized_body": "...",
  "keywords": ["primary keyword", "secondary", "..."],
  "meta_description": "...",
  "seo_score": 0-100,
  "suggestions": ["suggestion 1", "..."],
  "platform_tips": ["tip 1", "..."]
}}"""

        return await self.think_json(prompt)
