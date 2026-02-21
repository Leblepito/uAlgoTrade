"""
Med-Seo-Blog — Keyword Researcher Agent
LLM destekli keyword genisleme, long-tail kesfetme ve trend analizi.
"""
from __future__ import annotations

import logging
from typing import Any

from src.agents.llm_router import LLMRouter
from src.data.medical_keywords import (
    PROCEDURE_KEYWORDS, KEYWORD_METRICS, PROCEDURE_NAMES, REGION_INFO,
)

logger = logging.getLogger("med-seo-blog.keyword")


class KeywordResearcher:
    """LLM destekli medikal turizm keyword arastirmaci agent."""

    def __init__(self, router: LLMRouter) -> None:
        self._router = router

    async def expand_keywords(
        self, procedure: str, region: str = "turkey", lang: str = "tr", count: int = 20
    ) -> dict[str, Any]:
        """Mevcut keyword listesini LLM ile genislet."""
        proc_key = procedure.lower().replace(" ", "_").replace("-", "_")
        existing = PROCEDURE_KEYWORDS.get(proc_key, {}).get(lang, [])
        proc_name = PROCEDURE_NAMES.get(proc_key, {}).get(lang, procedure)
        region_label = REGION_INFO.get(region, {}).get("label", {}).get(lang, region)

        system = (
            "Sen medikal turizm SEO uzmanisin. "
            "Verilen prosedur ve bolge icin yeni long-tail keyword'ler uret. "
            "Sadece keyword listesi dondur, her satira bir keyword yaz. "
            "Mevcut keyword'leri tekrarlama."
        )
        prompt = (
            f"Prosedur: {proc_name}\n"
            f"Bolge: {region_label}\n"
            f"Dil: {lang}\n"
            f"Mevcut keyword'ler:\n{chr(10).join(existing)}\n\n"
            f"Bu listeye {count} yeni long-tail keyword ekle. "
            f"Hasta arama niyetini (search intent) dikkate al: "
            f"informational, navigational, transactional ve commercial."
        )

        try:
            result = await self._router.route("keyword_research", prompt, system=system)
            new_keywords = [
                line.strip().lstrip("- ").lstrip("0123456789.").strip()
                for line in result.strip().split("\n")
                if line.strip() and not line.strip().startswith("#")
            ]
            new_keywords = [kw for kw in new_keywords if kw and kw.lower() not in {e.lower() for e in existing}]

            return {
                "status": "ok",
                "procedure": proc_key,
                "region": region,
                "lang": lang,
                "existing_count": len(existing),
                "new_keywords": new_keywords[:count],
                "total": len(existing) + len(new_keywords[:count]),
                "ai_generated": True,
            }
        except RuntimeError:
            return {
                "status": "ok",
                "procedure": proc_key,
                "region": region,
                "lang": lang,
                "existing_count": len(existing),
                "new_keywords": [],
                "total": len(existing),
                "ai_generated": False,
                "note": "LLM unavailable — returning existing keywords only.",
            }

    def get_keyword_metrics(self, procedure: str) -> dict[str, Any]:
        """Prosedur keyword metriklerini dondur."""
        proc_key = procedure.lower().replace(" ", "_").replace("-", "_")
        metrics = KEYWORD_METRICS.get(proc_key)
        if not metrics:
            return {"status": "error", "message": f"Unknown procedure: {proc_key}"}

        return {
            "status": "ok",
            "procedure": proc_key,
            **metrics,
        }

    def get_all_keywords(self, procedure: str | None = None, lang: str | None = None) -> dict[str, Any]:
        """Keyword veritabanini sorgula."""
        result: dict[str, Any] = {}

        if procedure:
            proc_key = procedure.lower().replace(" ", "_").replace("-", "_")
            proc_data = PROCEDURE_KEYWORDS.get(proc_key, {})
            if lang:
                result[proc_key] = {lang: proc_data.get(lang, [])}
            else:
                result[proc_key] = proc_data
        else:
            for proc, langs in PROCEDURE_KEYWORDS.items():
                if lang:
                    result[proc] = {lang: langs.get(lang, [])}
                else:
                    result[proc] = langs

        total = sum(
            len(kws) for proc_langs in result.values() for kws in proc_langs.values()
        )

        return {
            "status": "ok",
            "keywords": result,
            "total_keywords": total,
            "procedures": list(result.keys()),
        }
