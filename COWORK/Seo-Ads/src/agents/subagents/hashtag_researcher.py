"""Hashtag Researcher subagent — finds optimal hashtags for reach and engagement."""

from __future__ import annotations

from typing import Any

from ..base import BaseAgent
from ..models import AgentRole, SubTask


class HashtagResearcherAgent(BaseAgent):
    role = AgentRole.hashtag_researcher
    name = "HashtagResearcher"
    system_prompt = """You are a social media hashtag strategist.

Your expertise:
- Hashtag research for Instagram, X/Twitter, YouTube, Facebook
- Understanding hashtag volume vs competition trade-offs
- Region-specific trending hashtags
- Crypto/fintech niche hashtag communities
- Hashtag grouping strategies (branded, community, trending, niche)

Rules:
- Mix high-volume and niche hashtags for optimal reach
- Consider region-specific hashtag conventions
- Avoid banned or shadowbanned hashtags
- Return structured JSON with categorized hashtags"""

    async def execute(self, task: SubTask) -> Any:
        ctx = task.context
        platform = ctx.get("platform", "meta_ig")
        region = ctx.get("region", "en")
        topic = ctx.get("topic", "crypto_trading")
        symbol = ctx.get("symbol", "BTC")
        max_hashtags = ctx.get("max_hashtags", 10)

        prompt = f"""Research and suggest the best hashtags for:
- Platform: {platform}
- Region: {region}
- Topic: {topic}
- Symbol: {symbol}
- Max hashtags: {max_hashtags}

Instructions: {task.instruction}

Return JSON:
{{
  "branded": ["#hashtag1", "..."],
  "community": ["#hashtag2", "..."],
  "trending": ["#hashtag3", "..."],
  "niche": ["#hashtag4", "..."],
  "recommended_set": ["top picks combined..."],
  "avoid": ["banned or risky hashtags..."]
}}"""

        return await self.think_json(prompt)
