"""
Med-Seo-Blog — AI Blog Writer Agent
LLM destekli medikal turizm blog yazisi uretici.
Prosedur, bolge ve dile gore SEO-optimize icerik uretir.
"""
from __future__ import annotations

import logging
from typing import Any

from src.agents.llm_router import LLMRouter
from src.data.medical_keywords import (
    PROCEDURE_KEYWORDS, PROCEDURE_NAMES, REGION_INFO, PARTNER_HOSPITALS,
)

logger = logging.getLogger("med-seo-blog.blog-writer")


SYSTEM_PROMPT_TEMPLATE = """Sen AntiGravity Ventures icin medikal turizm blog yazari AI'sisin.
Gorevlerin:
- SEO-optimize, bilgilendirici ve guvenilir medikal turizm blog yazilari uretmek
- Hedef keyword'leri dogal sekilde icerige entegre etmek
- Hasta perspektifinden yazmak (empati + profesyonellik)
- Her zaman disclaimer eklemek: "Bu yazi bilgilendirme amaclidir, tibbi tavsiye degildir"
- Call-to-action eklemek (ucretsiz konsultasyon, WhatsApp iletisim)

Partner hastaneler: {hospitals}
Hedef keyword'ler: {keywords}

Kurallar:
- En az 800 kelime
- H2/H3 basliklar kullan
- Keyword yogunlugu %2-3 arasinda olsun
- Her paragraf 3-4 cumle
- Sonunda FAQ bolumu ekle (3-5 soru)
- Dil: {lang_name}
"""

LANG_NAMES = {"tr": "Turkce", "en": "English", "ru": "Русский", "ar": "العربية", "th": "ภาษาไทย"}


class BlogWriter:
    """LLM-powered medikal turizm blog yazari."""

    def __init__(self, router: LLMRouter) -> None:
        self._router = router

    async def write_blog(
        self,
        procedure: str,
        region: str = "turkey",
        lang: str = "tr",
        tone: str = "professional",
        target_keywords: list[str] | None = None,
    ) -> dict[str, Any]:
        """Tam blog yazisi uret — baslik + govde + meta + FAQ."""
        proc_key = procedure.lower().replace(" ", "_").replace("-", "_")
        proc_name = PROCEDURE_NAMES.get(proc_key, {}).get(lang, procedure.title())
        region_label = REGION_INFO.get(region, {}).get("label", {}).get(lang, region.title())

        # Keyword'leri belirle
        keywords = target_keywords or PROCEDURE_KEYWORDS.get(proc_key, {}).get(lang, [])

        # Partner hastaneleri filtrele
        hospitals = [
            h["name"] for h in PARTNER_HOSPITALS
            if proc_key in h.get("specialties", [])
        ]

        system = SYSTEM_PROMPT_TEMPLATE.format(
            hospitals=", ".join(hospitals) if hospitals else "AntiGravity partner hastaneleri",
            keywords=", ".join(keywords[:8]),
            lang_name=LANG_NAMES.get(lang, "English"),
        )

        prompt = self._build_prompt(proc_name, region_label, lang, tone, keywords)

        try:
            content = await self._router.route("blog_write", prompt, system=system)
            return {
                "status": "ok",
                "content_type": "blog",
                "procedure": proc_key,
                "region": region,
                "lang": lang,
                "tone": tone,
                "title": self._extract_title(content, proc_name, region_label),
                "body": content,
                "target_keywords": keywords[:8],
                "partner_hospitals": hospitals,
                "word_count": len(content.split()),
                "ai_generated": True,
            }
        except RuntimeError:
            return self._fallback_blog(proc_name, region_label, lang, tone, keywords, hospitals)

    def _build_prompt(
        self, proc_name: str, region_label: str, lang: str, tone: str, keywords: list[str]
    ) -> str:
        """Blog yazimi icin LLM prompt'u olustur."""
        tone_desc = {
            "professional": "profesyonel ve guvenilir",
            "casual": "samimi ve yakin",
            "luxury": "premium ve sofistike",
            "urgent": "aksiyon odakli ve acil",
        }.get(tone, "profesyonel")

        if lang == "tr":
            return (
                f"{region_label}'de {proc_name} hakkinda kapsamli bir blog yazisi yaz.\n\n"
                f"Ton: {tone_desc}\n"
                f"Hedef keyword'ler: {', '.join(keywords[:6])}\n\n"
                f"Yazi su bolumleri icersin:\n"
                f"1. Giris — neden {region_label} tercih edilmeli\n"
                f"2. Prosedur hakkinda detaylar\n"
                f"3. Fiyat karsilastirmasi (Bati Avrupa vs {region_label})\n"
                f"4. Hasta deneyimi — neler beklenmeli\n"
                f"5. Sonuc ve CTA\n"
                f"6. SSS (3-5 soru-cevap)\n\n"
                f"Yazi en az 800 kelime olsun. Markdown H2/H3 basliklar kullan."
            )
        else:
            return (
                f"Write a comprehensive blog post about {proc_name} in {region_label}.\n\n"
                f"Tone: {tone_desc}\n"
                f"Target keywords: {', '.join(keywords[:6])}\n\n"
                f"Include these sections:\n"
                f"1. Introduction — why choose {region_label}\n"
                f"2. Procedure details\n"
                f"3. Cost comparison (Western Europe vs {region_label})\n"
                f"4. Patient experience — what to expect\n"
                f"5. Conclusion and CTA\n"
                f"6. FAQ (3-5 questions)\n\n"
                f"Minimum 800 words. Use Markdown H2/H3 headings. Write in {LANG_NAMES.get(lang, 'English')}."
            )

    def _extract_title(self, content: str, proc_name: str, region_label: str) -> str:
        """Icerikten basligi cikar veya uret."""
        for line in content.split("\n"):
            line = line.strip()
            if line.startswith("# ") and not line.startswith("## "):
                return line[2:].strip()
        return f"{proc_name} — {region_label} | AntiGravity Ventures"

    def _fallback_blog(
        self,
        proc_name: str,
        region_label: str,
        lang: str,
        tone: str,
        keywords: list[str],
        hospitals: list[str],
    ) -> dict[str, Any]:
        """LLM kullanilamamasi durumunda template-based fallback."""
        if lang == "tr":
            title = f"{region_label}'de {proc_name}: 2026 Rehberi ve Fiyatlari"
            body = (
                f"## Neden {region_label}'de {proc_name}?\n\n"
                f"{region_label}, {proc_name.lower()} icin dunyanin en populer destinasyonlarindan biridir. "
                f"Her yil binlerce uluslararasi hasta kaliteli tedavi icin buraya gelmektedir.\n\n"
                f"## Prosedur Detaylari\n\n"
                f"{proc_name} sureci ilk konsultasyon, ameliyat oncesi tetkikler, islem ve takip bakimi "
                f"asamalarindan olusmaktadir.\n\n"
                f"## Fiyat Karsilastirmasi\n\n"
                f"Bati Avrupa fiyatlarina kiyasla %50-70 tasarruf mumkundur. "
                f"Tum partner hastanelerimiz JCI akreditasyonuna sahiptir.\n\n"
                f"## Partner Hastanelerimiz\n\n"
                + "\n".join(f"- {h}" for h in hospitals) + "\n\n"
                f"## SSS\n\n"
                f"**{proc_name} ne kadar surer?**\n"
                f"Prosedure gore degisir, detaylar icin ucretsiz konsultasyon alin.\n\n"
                f"**Fiyatlar neleri kapsar?**\n"
                f"Konaklama, transfer ve islem dahil paketler sunuyoruz.\n\n"
                f"---\n*Bu yazi bilgilendirme amaclidir, tibbi tavsiye degildir.*\n\n"
                f"Ucretsiz konsultasyon icin hemen iletisime gecin."
            )
        else:
            title = f"{proc_name} in {region_label}: Complete Guide & Costs 2026"
            body = (
                f"## Why Choose {region_label} for {proc_name}?\n\n"
                f"{region_label} is one of the top destinations for {proc_name.lower()}. "
                f"Thousands of international patients travel here each year.\n\n"
                f"## Procedure Details\n\n"
                f"The {proc_name.lower()} process includes consultation, pre-op assessments, "
                f"the procedure, and follow-up care.\n\n"
                f"## Cost Comparison\n\n"
                f"Save 50-70% compared to Western Europe. All partner hospitals are JCI-accredited.\n\n"
                f"## Our Partner Hospitals\n\n"
                + "\n".join(f"- {h}" for h in hospitals) + "\n\n"
                f"## FAQ\n\n"
                f"**How long does {proc_name.lower()} take?**\n"
                f"It varies by procedure. Contact us for a free consultation.\n\n"
                f"**What's included in the price?**\n"
                f"We offer all-inclusive packages with accommodation and transfers.\n\n"
                f"---\n*This article is for informational purposes only, not medical advice.*\n\n"
                f"Contact us today for a free consultation."
            )

        return {
            "status": "ok",
            "content_type": "blog",
            "procedure": proc_name.lower().replace(" ", "_"),
            "lang": lang,
            "tone": tone,
            "title": title,
            "body": body,
            "target_keywords": keywords[:8],
            "partner_hospitals": hospitals,
            "word_count": len(body.split()),
            "ai_generated": False,
        }
