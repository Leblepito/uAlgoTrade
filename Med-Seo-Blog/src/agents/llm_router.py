"""
Med-Seo-Blog — LLM Smart Router
Gorev turune gore en uygun LLM'i secer.

Routing stratejisi:
- blog_write (uzun icerik)     -> Claude (yaratici yazim) > Gemini Pro > OpenAI
- seo_analyze (anahtar kelime) -> Gemini Flash (hizli) > OpenAI > Claude
- schema_generate (yapisal)    -> Gemini Flash (hizli) > Claude > OpenAI
- keyword_research             -> Gemini Flash > OpenAI > Claude
- content_optimize             -> Claude > Gemini Pro > OpenAI
"""
from __future__ import annotations

import logging
from typing import Any

from src.agents import llm_provider

logger = logging.getLogger("med-seo-blog.router")

# Task -> provider priority
ROUTE_TABLE: dict[str, list[str]] = {
    "blog_write":       ["anthropic", "gemini_pro", "gemini", "openai"],
    "seo_analyze":      ["gemini", "openai", "anthropic"],
    "schema_generate":  ["gemini", "anthropic", "openai"],
    "keyword_research": ["gemini", "openai", "anthropic"],
    "content_optimize": ["anthropic", "gemini_pro", "openai"],
    "meta_generate":    ["gemini", "openai", "anthropic"],
    "translate":        ["gemini", "anthropic", "openai"],
}

PROVIDER_MAP = {
    "gemini":      (llm_provider.call_gemini, llm_provider.check_gemini),
    "gemini_pro":  (llm_provider.call_gemini, llm_provider.check_gemini),
    "anthropic":   (llm_provider.call_anthropic, llm_provider.check_anthropic),
    "openai":      (llm_provider.call_openai, llm_provider.check_openai),
}


class LLMRouter:
    """Gorev bazli akilli LLM yonlendirici."""

    async def route(self, task: str, prompt: str, system: str = "") -> str:
        """Task turune gore en uygun LLM'i sec ve cagir."""
        providers = ROUTE_TABLE.get(task, ["gemini", "anthropic", "openai"])

        for provider_name in providers:
            call_fn, check_fn = PROVIDER_MAP.get(provider_name, (None, None))
            if not call_fn or not check_fn or not check_fn():
                continue

            try:
                model = None
                if provider_name == "gemini_pro":
                    from src import config
                    model = config.GEMINI_PRO_MODEL

                result = await call_fn(prompt, system=system, model=model)
                logger.info(f"[{task}] routed to {provider_name} — OK ({len(result)} chars)")
                return result
            except Exception as e:
                logger.warning(f"[{task}] {provider_name} failed: {e}")
                continue

        logger.error(f"[{task}] all providers failed")
        raise RuntimeError(f"No LLM provider available for task: {task}")

    def get_status(self) -> dict[str, Any]:
        """Aktif provider durumlarini dondur."""
        return {
            "gemini": llm_provider.check_gemini(),
            "anthropic": llm_provider.check_anthropic(),
            "openai": llm_provider.check_openai(),
            "route_table": {k: v[0] for k, v in ROUTE_TABLE.items()},
        }
