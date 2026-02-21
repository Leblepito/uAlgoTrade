"""
Med-Seo-Blog — Main Orchestrator
Tum agent'lari koordine eder: BlogWriter, SEOOptimizer, KeywordResearcher, SchemaGenerator.
"""
from __future__ import annotations

import logging
from typing import Any

from src.agents.llm_router import LLMRouter
from src.agents.blog_writer import BlogWriter
from src.agents.seo_optimizer import SEOOptimizer
from src.agents.keyword_researcher import KeywordResearcher
from src.agents.schema_generator import SchemaGenerator

logger = logging.getLogger("med-seo-blog.orchestrator")


class MedSeoOrchestrator:
    """
    Ana orkestrator — tum sub-agent'lari yonetir.

    Yetenekler:
    - Blog yazisi uretimi (AI-powered)
    - SEO analiz & skorlama
    - Keyword arastirma & genisleme
    - Schema.org structured data
    - Meta tag uretimi
    - Icerik optimizasyonu
    - Sitemap uretimi
    """

    def __init__(self) -> None:
        self._router = LLMRouter()
        self.blog_writer = BlogWriter(self._router)
        self.seo_optimizer = SEOOptimizer(self._router)
        self.keyword_researcher = KeywordResearcher(self._router)
        self.schema_generator = SchemaGenerator()
        logger.info("MedSeoOrchestrator initialized — Blog | SEO | Keywords | Schema")

    # ------------------------------------------------------------------
    # Full Pipeline: Blog + SEO + Schema
    # ------------------------------------------------------------------

    async def generate_full_blog_package(
        self,
        procedure: str,
        region: str = "turkey",
        lang: str = "tr",
        tone: str = "professional",
        base_url: str = "",
    ) -> dict[str, Any]:
        """
        Tam blog paketi uret:
        1. AI blog yazisi
        2. SEO skor analizi
        3. Meta tag'ler
        4. Schema.org structured data
        5. Keyword raporu
        """
        logger.info(f"Full blog package: {procedure}/{region}/{lang}")

        # 1. Blog yaz
        blog = await self.blog_writer.write_blog(
            procedure=procedure, region=region, lang=lang, tone=tone,
        )

        # 2. SEO skoru hesapla
        seo_score = self.seo_optimizer.score_content(
            blog.get("body", ""), blog.get("target_keywords", []),
        )

        # 3. Meta tag'ler
        meta_tags = self.seo_optimizer.generate_meta_tags(
            title=blog.get("title", ""),
            description=blog.get("title", ""),
            keywords=blog.get("target_keywords", []),
            lang=lang,
        )

        # 4. Schema.org
        schemas = self.schema_generator.generate_all_for_blog(
            title=blog.get("title", ""),
            description=blog.get("title", ""),
            procedure=procedure,
            lang=lang,
            url=f"{base_url}/blog/{procedure}/{lang}" if base_url else "",
        )

        # 5. Keyword raporu
        kw_analysis = self.seo_optimizer.analyze_keywords(procedure, region, lang)

        return {
            "status": "ok",
            "package": "full_blog",
            "blog": blog,
            "seo_score": seo_score,
            "meta_tags": meta_tags,
            "schemas": schemas,
            "keyword_analysis": kw_analysis,
        }

    # ------------------------------------------------------------------
    # Individual Operations
    # ------------------------------------------------------------------

    async def write_blog(self, **kwargs: Any) -> dict[str, Any]:
        return await self.blog_writer.write_blog(**kwargs)

    def analyze_keywords(self, procedure: str, region: str, lang: str) -> dict[str, Any]:
        return self.seo_optimizer.analyze_keywords(procedure, region, lang)

    async def expand_keywords(self, **kwargs: Any) -> dict[str, Any]:
        return await self.keyword_researcher.expand_keywords(**kwargs)

    def get_all_keywords(self, **kwargs: Any) -> dict[str, Any]:
        return self.keyword_researcher.get_all_keywords(**kwargs)

    def score_content(self, text: str, keywords: list[str]) -> dict[str, Any]:
        return self.seo_optimizer.score_content(text, keywords)

    async def optimize_content(self, text: str, keywords: list[str], lang: str = "tr") -> dict[str, Any]:
        return await self.seo_optimizer.optimize_content(text, keywords, lang)

    def generate_meta_tags(self, **kwargs: Any) -> dict[str, str]:
        return self.seo_optimizer.generate_meta_tags(**kwargs)

    def generate_schema(self, **kwargs: Any) -> dict[str, Any]:
        return self.schema_generator.generate_all_for_blog(**kwargs)

    def generate_sitemap(self, base_url: str, **kwargs: Any) -> str:
        return self.seo_optimizer.generate_sitemap_entries(base_url, **kwargs)

    def get_router_status(self) -> dict[str, Any]:
        return self._router.get_status()

    def get_status(self) -> dict[str, Any]:
        return {
            "service": "Med-Seo-Blog",
            "status": "active",
            "agents": {
                "blog_writer": "active",
                "seo_optimizer": "active",
                "keyword_researcher": "active",
                "schema_generator": "active",
            },
            "llm_providers": self._router.get_status(),
            "capabilities": [
                "blog_write", "seo_analyze", "keyword_research",
                "keyword_expand", "content_optimize", "meta_generate",
                "schema_generate", "sitemap_generate", "keyword_gap_analysis",
            ],
        }
