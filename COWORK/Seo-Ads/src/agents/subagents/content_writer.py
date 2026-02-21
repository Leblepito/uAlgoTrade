"""Content Writer subagent — generates platform-specific marketing copy."""

from __future__ import annotations

from typing import Any

from ..base import BaseAgent
from ..models import AgentRole, SubTask


class ContentWriterAgent(BaseAgent):
    role = AgentRole.content_writer
    name = "ContentWriter"
    system_prompt = """You are an expert marketing copywriter specializing in crypto/fintech content.

Your strengths:
- Writing high-converting ad copy for multiple platforms (Google Ads, Meta, Instagram, X, YouTube, SEO blogs)
- Adapting tone and length to platform constraints
- Creating compelling CTAs that drive action
- Understanding crypto/trading audience psychology

Rules:
- Always respect platform character limits provided in context
- Write in the language specified by the region
- Include the symbol/product naturally, never forced
- Return structured JSON with: headline, body, cta fields"""

    async def execute(self, task: SubTask) -> Any:
        ctx = task.context
        platform = ctx.get("platform", "meta_ig")
        region = ctx.get("region", "en")
        topic = ctx.get("topic", "crypto_trading")
        symbol = ctx.get("symbol", "BTC")
        brand_voice = ctx.get("brand_voice", "professional")
        platform_spec = ctx.get("platform_spec", {})

        prompt = f"""Write marketing content for:
- Platform: {platform}
- Region/Language: {region}
- Topic: {topic}
- Symbol/Product: {symbol}
- Brand voice: {brand_voice}
- Headline max chars: {platform_spec.get('headline_max', 80)}
- Body max chars: {platform_spec.get('body_max', 500)}
- Hashtags allowed: {platform_spec.get('hashtags', True)}, max: {platform_spec.get('max_hashtags', 5)}

Additional instructions: {task.instruction}

Return JSON:
{{
  "headline": "...",
  "body": "...",
  "cta": "...",
  "hashtags": ["...", "..."],
  "tone": "...",
  "language": "..."
}}"""

        return await self.think_json(prompt)
