"""
Med-Seo-Blog — Schema.org Structured Data Generator
Medikal turizm sayfalari icin JSON-LD structured data uretir.
Google Rich Results / Featured Snippets icin optimize.
"""
from __future__ import annotations

import json
from typing import Any

from src.data.medical_keywords import PROCEDURE_NAMES, PARTNER_HOSPITALS, REGION_INFO


class SchemaGenerator:
    """Schema.org JSON-LD structured data uretici."""

    def generate_medical_article(
        self,
        title: str,
        description: str,
        procedure: str,
        lang: str,
        author: str = "AntiGravity Ventures Medical Team",
        url: str = "",
        date_published: str = "2026-01-01",
    ) -> dict[str, Any]:
        """MedicalWebPage + Article schema uret."""
        proc_key = procedure.lower().replace(" ", "_").replace("-", "_")
        proc_name = PROCEDURE_NAMES.get(proc_key, {}).get("en", procedure)

        return {
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": title,
            "description": description,
            "url": url,
            "inLanguage": lang,
            "datePublished": date_published,
            "author": {
                "@type": "Organization",
                "name": author,
                "url": "https://antigravityventures.com",
            },
            "publisher": {
                "@type": "Organization",
                "name": "AntiGravity Ventures",
            },
            "about": {
                "@type": "MedicalProcedure",
                "name": proc_name,
                "procedureType": "https://schema.org/SurgicalProcedure",
            },
            "specialty": {
                "@type": "MedicalSpecialty",
                "name": self._procedure_to_specialty(proc_key),
            },
        }

    def generate_faq_schema(self, faqs: list[dict[str, str]]) -> dict[str, Any]:
        """FAQPage schema uret — Google FAQ rich results."""
        items = []
        for faq in faqs:
            items.append({
                "@type": "Question",
                "name": faq.get("question", ""),
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.get("answer", ""),
                },
            })

        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": items,
        }

    def generate_hospital_schema(self, hospital_name: str | None = None) -> list[dict[str, Any]]:
        """Partner hastane LocalBusiness schema uret."""
        hospitals = PARTNER_HOSPITALS
        if hospital_name:
            hospitals = [h for h in hospitals if h["name"].lower() == hospital_name.lower()]

        schemas = []
        for h in hospitals:
            specialties = [
                PROCEDURE_NAMES.get(s, {}).get("en", s) for s in h.get("specialties", [])
            ]
            schemas.append({
                "@context": "https://schema.org",
                "@type": "Hospital",
                "name": h["name"],
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": h.get("city", "Istanbul"),
                    "addressCountry": "TR",
                },
                "medicalSpecialty": specialties,
            })

        return schemas

    def generate_breadcrumb(self, items: list[dict[str, str]]) -> dict[str, Any]:
        """BreadcrumbList schema uret."""
        elements = []
        for i, item in enumerate(items, 1):
            elements.append({
                "@type": "ListItem",
                "position": i,
                "name": item.get("name", ""),
                "item": item.get("url", ""),
            })

        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": elements,
        }

    def generate_all_for_blog(
        self,
        title: str,
        description: str,
        procedure: str,
        lang: str,
        url: str = "",
        faqs: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        """Blog sayfasi icin tum schema'lari tek seferde uret."""
        result: dict[str, Any] = {
            "article": self.generate_medical_article(
                title=title,
                description=description,
                procedure=procedure,
                lang=lang,
                url=url,
            ),
        }

        if faqs:
            result["faq"] = self.generate_faq_schema(faqs)

        proc_key = procedure.lower().replace(" ", "_").replace("-", "_")
        proc_name = PROCEDURE_NAMES.get(proc_key, {}).get(lang, procedure)
        result["breadcrumb"] = self.generate_breadcrumb([
            {"name": "Home", "url": f"{url}/"},
            {"name": "Blog", "url": f"{url}/blog"},
            {"name": proc_name, "url": f"{url}/blog/{proc_key}"},
        ])

        return result

    def to_json_ld(self, schema: dict[str, Any] | list[dict[str, Any]]) -> str:
        """Schema'yi HTML script tag icine gomulecek JSON-LD formatina cevir."""
        data = json.dumps(schema, ensure_ascii=False, indent=2)
        return f'<script type="application/ld+json">\n{data}\n</script>'

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _procedure_to_specialty(self, proc_key: str) -> str:
        mapping = {
            "hair_transplant": "Dermatology",
            "dental": "Dentistry",
            "aesthetic": "PlasticSurgery",
            "bariatric": "Bariatrics",
            "ivf": "ReproductiveMedicine",
            "ophthalmology": "Ophthalmology",
            "checkup": "PreventiveMedicine",
            "dermatology": "Dermatology",
            "oncology": "Oncology",
        }
        return mapping.get(proc_key, "GeneralPractice")
