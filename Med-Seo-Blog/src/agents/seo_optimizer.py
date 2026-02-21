"""
Med-Seo-Blog — SEO Optimizer Agent
Icerik analizi, meta tag uretimi, skor hesaplama ve iyilestirme onerileri.
"""
from __future__ import annotations

import re
import logging
from typing import Any

from src.agents.llm_router import LLMRouter
from src.data.medical_keywords import (
    PROCEDURE_KEYWORDS, KEYWORD_METRICS,
    VOLUME_LABELS, DIFFICULTY_LABELS, PROCEDURE_NAMES,
)

logger = logging.getLogger("med-seo-blog.seo")

LOCALE_MAP = {"tr": "tr_TR", "en": "en_US", "ru": "ru_RU", "ar": "ar_AE", "th": "th_TH"}


class SEOOptimizer:
    """SEO analiz, skorlama ve optimizasyon agent'i."""

    def __init__(self, router: LLMRouter) -> None:
        self._router = router

    # ------------------------------------------------------------------
    # Keyword Analysis
    # ------------------------------------------------------------------

    def analyze_keywords(self, procedure: str, region: str, lang: str) -> dict[str, Any]:
        """Prosedure ozel keyword analizi."""
        proc_key = procedure.lower().replace(" ", "_").replace("-", "_")
        kw_list = PROCEDURE_KEYWORDS.get(proc_key, {}).get(lang, [])
        metrics = KEYWORD_METRICS.get(proc_key, {"volume": "low", "difficulty": "medium", "cpc_usd": 1.0})

        keywords = []
        for kw in kw_list:
            keywords.append({
                "keyword": kw,
                "search_volume": VOLUME_LABELS.get(metrics["volume"], "unknown"),
                "difficulty": DIFFICULTY_LABELS.get(metrics["difficulty"], "moderate"),
                "cpc_usd": metrics["cpc_usd"],
            })

        return {
            "procedure": proc_key,
            "region": region,
            "lang": lang,
            "keywords": keywords,
            "total_keywords": len(keywords),
            "avg_cpc": metrics["cpc_usd"],
            "commission_pct": metrics.get("commission_pct", 20),
        }

    # ------------------------------------------------------------------
    # Meta Tag Generation
    # ------------------------------------------------------------------

    def generate_meta_tags(
        self, title: str, description: str, keywords: list[str], lang: str
    ) -> dict[str, str]:
        """SEO meta tag seti uretir."""
        title_tag = title[:60]
        meta_desc = description[:160]
        kw_str = ", ".join(keywords[:10])
        locale = LOCALE_MAP.get(lang, "en_US")

        return {
            "title_tag": title_tag,
            "meta_description": meta_desc,
            "meta_keywords": kw_str,
            "og_title": title_tag,
            "og_description": meta_desc,
            "og_type": "article",
            "og_locale": locale,
            "twitter_card": "summary_large_image",
            "twitter_title": title_tag,
            "twitter_description": meta_desc,
            "canonical_lang": lang,
        }

    # ------------------------------------------------------------------
    # Content SEO Score
    # ------------------------------------------------------------------

    def score_content(self, text: str, target_keywords: list[str]) -> dict[str, Any]:
        """Icerik SEO skoru hesapla (0-100)."""
        if not text or not target_keywords:
            return {"seo_score": 0, "suggestions": ["Metin ve keyword listesi gerekli."]}

        text_lower = text.lower()
        word_count = len(text.split())
        suggestions: list[str] = []
        score = 50

        # Keyword density
        found = sum(1 for kw in target_keywords if kw.lower() in text_lower)
        kw_ratio = found / max(len(target_keywords), 1)
        score += int(kw_ratio * 20)

        if kw_ratio < 0.3:
            suggestions.append("Hedef keyword'lerin cogu kullanilmamis — daha fazla entegre edin.")

        # Word count
        if word_count < 300:
            score -= 10
            suggestions.append("Icerik 300 kelimeden kisa — en az 800+ kelime onerilir.")
        elif word_count >= 1500:
            score += 15
        elif word_count >= 800:
            score += 10

        # Headings
        has_h2 = bool(re.search(r"^##\s", text, re.MULTILINE))
        has_h3 = bool(re.search(r"^###\s", text, re.MULTILINE))
        if has_h2:
            score += 5
        else:
            suggestions.append("H2 alt basliklar ekleyin.")
        if has_h3:
            score += 3

        # CTA check
        cta_words = ["contact", "book", "iletisim", "randevu", "konsultasyon",
                      "whatsapp", "связаться", "записаться", "احجز", "จอง"]
        if any(w in text_lower for w in cta_words):
            score += 5
        else:
            suggestions.append("Call-to-action ekleyin (randevu, iletisim, WhatsApp).")

        # FAQ check
        if "faq" in text_lower or "sss" in text_lower or "soru" in text_lower:
            score += 5
        else:
            suggestions.append("SSS/FAQ bolumu ekleyin — SEO ve kullanici deneyimini arttirir.")

        # Medical disclaimer
        if "tibbi tavsiye" in text_lower or "medical advice" in text_lower or "disclaimer" in text_lower:
            score += 2

        score = max(0, min(100, score))

        return {
            "seo_score": score,
            "word_count": word_count,
            "keywords_found": found,
            "keywords_total": len(target_keywords),
            "keyword_density_pct": round(kw_ratio * 100, 1),
            "has_headings": has_h2,
            "has_faq": "faq" in text_lower or "sss" in text_lower,
            "has_cta": any(w in text_lower for w in cta_words),
            "suggestions": suggestions if suggestions else ["Icerik iyi optimize edilmis."],
        }

    # ------------------------------------------------------------------
    # AI-powered Content Optimization
    # ------------------------------------------------------------------

    async def optimize_content(
        self, text: str, target_keywords: list[str], lang: str = "tr"
    ) -> dict[str, Any]:
        """LLM ile icerik optimizasyonu onerileri uret."""
        score_data = self.score_content(text, target_keywords)

        if score_data["seo_score"] >= 85:
            return {
                "status": "ok",
                "action": "no_optimization_needed",
                "current_score": score_data["seo_score"],
                "message": "Icerik zaten iyi optimize edilmis.",
            }

        system = (
            "Sen bir medikal turizm SEO uzmanisin. "
            "Verilen icerigi analiz et ve SEO iyilestirme onerileri sun. "
            "Keyword entegrasyonu, baslik yapisi, meta tag ve CTA onerileri ver."
        )
        prompt = (
            f"Bu icerigi analiz et ve SEO iyilestirmeleri oner:\n\n"
            f"Hedef keyword'ler: {', '.join(target_keywords[:6])}\n"
            f"Mevcut SEO skoru: {score_data['seo_score']}/100\n"
            f"Mevcut sorunlar: {'; '.join(score_data['suggestions'])}\n\n"
            f"Icerik (ilk 500 kelime):\n{' '.join(text.split()[:500])}\n\n"
            f"Lutfen somut iyilestirme onerileri ver."
        )

        try:
            ai_suggestions = await self._router.route("content_optimize", prompt, system=system)
            return {
                "status": "ok",
                "action": "content_optimize",
                "current_score": score_data["seo_score"],
                "score_details": score_data,
                "ai_suggestions": ai_suggestions,
            }
        except RuntimeError:
            return {
                "status": "ok",
                "action": "content_optimize",
                "current_score": score_data["seo_score"],
                "score_details": score_data,
                "ai_suggestions": None,
                "rule_suggestions": score_data["suggestions"],
            }

    # ------------------------------------------------------------------
    # Sitemap
    # ------------------------------------------------------------------

    def generate_sitemap_entries(
        self, base_url: str, procedures: list[str] | None = None, langs: list[str] | None = None
    ) -> str:
        """XML sitemap icerigi uretir."""
        procs = procedures or list(PROCEDURE_NAMES.keys())
        languages = langs or ["tr", "en", "ru"]

        entries = []
        for proc in procs:
            for lg in languages:
                url = f"{base_url}/blog/{proc}/{lg}"
                entries.append(
                    f"  <url>\n"
                    f"    <loc>{url}</loc>\n"
                    f"    <changefreq>weekly</changefreq>\n"
                    f"    <priority>0.8</priority>\n"
                    f"  </url>"
                )

        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "\n".join(entries) + "\n"
            '</urlset>'
        )

    # ------------------------------------------------------------------
    # Competitor Gap Analysis
    # ------------------------------------------------------------------

    def keyword_gap_analysis(
        self, our_keywords: list[str], competitor_keywords: list[str]
    ) -> dict[str, Any]:
        """Rakip keyword gap analizi."""
        our_set = {kw.lower() for kw in our_keywords}
        comp_set = {kw.lower() for kw in competitor_keywords}

        return {
            "missing_opportunities": sorted(comp_set - our_set),
            "shared_keywords": sorted(our_set & comp_set),
            "our_unique": sorted(our_set - comp_set),
            "gap_count": len(comp_set - our_set),
            "overlap_count": len(our_set & comp_set),
        }
