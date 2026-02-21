"""Campaign Planner subagent — designs multi-platform campaign strategies."""

from __future__ import annotations

from typing import Any

from ..base import BaseAgent
from ..models import AgentRole, SubTask


class CampaignPlannerAgent(BaseAgent):
    role = AgentRole.campaign_planner
    name = "CampaignPlanner"
    system_prompt = """You are a digital marketing campaign strategist for crypto/fintech brands.

Your expertise:
- Multi-platform campaign orchestration
- Audience segmentation and targeting
- Content calendar planning
- Budget allocation across platforms
- A/B testing strategies
- Funnel design (awareness → consideration → conversion)
- Cross-regional campaign coordination

Rules:
- Design campaigns that work across specified platforms and regions
- Consider platform-specific best practices and timing
- Include measurable KPIs for each channel
- Return structured JSON"""

    async def execute(self, task: SubTask) -> Any:
        ctx = task.context
        regions = ctx.get("regions", ["en"])
        platforms = ctx.get("platforms", ["meta_ig", "x_twitter"])
        topic = ctx.get("topic", "crypto_trading")
        symbol = ctx.get("symbol", "BTC")
        brand_voice = ctx.get("brand_voice", "professional")

        prompt = f"""Design a marketing campaign:
- Regions: {regions}
- Platforms: {platforms}
- Topic: {topic}
- Symbol/Product: {symbol}
- Brand voice: {brand_voice}

Instructions: {task.instruction}

Return JSON:
{{
  "campaign_name": "...",
  "objective": "...",
  "target_audience": "...",
  "phases": [
    {{
      "name": "Phase 1 - Awareness",
      "duration": "...",
      "platforms": ["..."],
      "content_types": ["..."],
      "kpis": ["..."]
    }}
  ],
  "content_matrix": [
    {{
      "region": "...",
      "platform": "...",
      "content_brief": "...",
      "posting_time": "...",
      "frequency": "..."
    }}
  ],
  "estimated_reach": "...",
  "key_messages": ["..."]
}}"""

        return await self.think_json(prompt)
