"""Blog Writer subagent — generates full-length SEO blog posts for any project."""

from __future__ import annotations

from typing import Any

from ..base import BaseAgent
from ..models import AgentRole, SubTask


class BlogWriterAgent(BaseAgent):
    role = AgentRole.blog_writer
    name = "BlogWriter"
    system_prompt = """You are an expert SEO blog writer specializing in tech, SaaS, and fintech content.

Your strengths:
- Writing long-form, engaging blog posts (800-2000 words) optimized for search engines
- Structuring content with H2/H3 headings, bullet points, and clear sections
- Naturally integrating keywords without stuffing
- Writing in multiple languages with cultural awareness
- Creating content for diverse industries: coworking, crypto trading, AI/ML, SaaS

Rules:
- Always include a meta_title (max 60 chars) and meta_description (max 155 chars)
- Structure with: intro → 3-5 sections with H2 headings → conclusion with CTA
- Use the specified language/region for the entire post
- Include internal link placeholders where appropriate: [LINK: anchor text](page-slug)
- Return valid JSON with all required fields"""

    # Project-specific knowledge base for richer content
    PROJECT_CONTEXTS = {
        "cowork": {
            "name": "Cowork",
            "industry": "Coworking Space Management",
            "keywords": [
                "coworking space", "shared office", "hot desk", "meeting room booking",
                "coworking management software", "flexible workspace", "hybrid work",
                "office space rental", "coworking membership", "workspace analytics",
            ],
            "topics": {
                "product": "Cowork platform features — booking, billing, analytics, AI scheduling",
                "industry": "Coworking industry trends, hybrid work, flexible office market",
                "guide": "How-to guides for coworking space owners and members",
                "comparison": "Coworking vs traditional office, software comparisons",
            },
        },
        "ualgo": {
            "name": "U2Algo / uAlgoTrade",
            "industry": "Algorithmic Crypto Trading",
            "keywords": [
                "algorithmic trading", "crypto trading bot", "AI trading signals",
                "automated trading", "BTCUSDT", "trading strategy", "backtesting",
                "risk management", "crypto portfolio", "trading indicators",
            ],
            "topics": {
                "product": "U2Algo trading platform features, AI signals, multi-agent analysis",
                "educational": "Trading concepts, technical analysis, risk management",
                "market": "Market analysis, crypto trends, price predictions",
                "comparison": "Manual vs algorithmic trading, platform comparisons",
            },
        },
        "seo_ads": {
            "name": "Seo-Ads",
            "industry": "AI Content Marketing",
            "keywords": [
                "AI content generation", "social media automation", "SEO optimization",
                "marketing AI", "content marketing", "digital advertising",
                "multi-language content", "social media strategy", "ad copywriting",
            ],
            "topics": {
                "product": "Seo-Ads AI agents, multi-platform content, cultural adaptation",
                "industry": "AI marketing trends, content automation future",
                "guide": "How to scale content marketing with AI, SEO best practices",
                "comparison": "AI vs human copywriting, content tool comparisons",
            },
        },
        "general": {
            "name": "General Tech",
            "industry": "Technology",
            "keywords": [
                "SaaS", "startup", "technology", "software development", "AI",
                "machine learning", "API", "cloud computing", "digital transformation",
            ],
            "topics": {
                "thought_leadership": "Industry insights and trends",
                "technical": "Technical deep-dives and tutorials",
                "business": "Business strategy and growth",
            },
        },
    }

    async def execute(self, task: SubTask) -> Any:
        ctx = task.context
        project = ctx.get("project", "general")
        region = ctx.get("region", "en")
        topic_type = ctx.get("topic_type", "product")
        topic = ctx.get("topic", "")
        keywords = ctx.get("keywords", [])
        word_count = ctx.get("word_count", 1200)

        # Merge project keywords
        proj = self.PROJECT_CONTEXTS.get(project, self.PROJECT_CONTEXTS["general"])
        all_keywords = list(set(proj["keywords"] + keywords))

        prompt = f"""Write a full-length SEO blog post:

PROJECT: {proj['name']} ({proj['industry']})
REGION/LANGUAGE: {region}
TOPIC TYPE: {topic_type}
SPECIFIC TOPIC: {topic or task.instruction}
TARGET WORD COUNT: {word_count}
PRIMARY KEYWORDS: {', '.join(all_keywords[:10])}

Available topic context: {proj['topics'].get(topic_type, 'General content')}

Additional instructions: {task.instruction}

Return JSON:
{{
  "meta_title": "SEO title (max 60 chars)",
  "meta_description": "Meta description (max 155 chars)",
  "slug": "url-friendly-slug",
  "headline": "Blog post main title (H1)",
  "excerpt": "2-3 sentence preview for listing pages",
  "body_markdown": "Full blog post in Markdown with ## and ### headings",
  "tags": ["tag1", "tag2", "tag3"],
  "primary_keyword": "main target keyword",
  "secondary_keywords": ["kw1", "kw2", "kw3"],
  "estimated_read_time_min": 5,
  "cta": {{
    "text": "Call to action text",
    "button_label": "Button text",
    "link_placeholder": "/signup or /demo"
  }},
  "internal_links": [
    {{"anchor": "anchor text", "slug": "suggested-page-slug"}}
  ],
  "language": "{region}"
}}"""

        return await self.think_json(prompt)
