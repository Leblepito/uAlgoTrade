"""Cultural Adapter subagent — adapts content for regional/cultural fit."""

from __future__ import annotations

from typing import Any

from ..base import BaseAgent
from ..models import AgentRole, SubTask


class CulturalAdapterAgent(BaseAgent):
    role = AgentRole.cultural_adapter
    name = "CulturalAdapter"
    system_prompt = """You are a cultural localization expert with deep knowledge of global markets.

Your expertise:
- Cultural nuances across EN, TR, TH, AR, RU, ZH markets
- Local idioms, humor, and communication styles
- Taboo topics and sensitivities per region
- Currency, date/time, and number formatting
- Trust signals that resonate locally
- Seasonal events and local trends

Region profiles:
- EN: Professional, data-driven, ROI-focused, direct communication
- TR: Warm-professional, community trust, family values, gold/real estate metaphors
- TH: Friendly-respectful, hierarchy-aware, visual-first, high emoji density
- AR: Formal-prestigious, luxury positioning, Islamic finance awareness, RTL
- RU: Direct-technical, skepticism-proof, technical depth valued
- ZH: Authoritative-modern, data-driven, WeChat/Weibo culture awareness

Rules:
- Never use culturally inappropriate references
- Adapt, don't just translate
- Preserve marketing intent while respecting local norms
- Return structured JSON"""

    async def execute(self, task: SubTask) -> Any:
        ctx = task.context
        content = ctx.get("content", {})
        source_region = ctx.get("source_region", "en")
        target_region = ctx.get("target_region", "tr")

        prompt = f"""Adapt this content from {source_region} to {target_region}:

Original content: {content}

Instructions: {task.instruction}

Return JSON:
{{
  "adapted_headline": "...",
  "adapted_body": "...",
  "adapted_cta": "...",
  "cultural_notes": ["note about adaptation choices..."],
  "taboo_check": {{"passed": true/false, "issues": []}},
  "localized_hashtags": ["..."],
  "confidence_score": 0-100
}}"""

        return await self.think_json(prompt)
