"""Med-Seo-Blog — Content & Integration API Endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from src.agents.orchestrator import MedSeoOrchestrator
from src.models.content import SchemaRequest
from src.data.medical_keywords import (
    PROCEDURE_NAMES, REGION_INFO, PARTNER_HOSPITALS,
)

router = APIRouter(prefix="/api/content", tags=["Content"])
orchestrator = MedSeoOrchestrator()


# ---------------------------------------------------------------------------
# Schema.org Structured Data
# ---------------------------------------------------------------------------

@router.post("/schema/blog")
def schema_for_blog(body: SchemaRequest) -> dict:
    """Blog sayfasi icin tam Schema.org paketi uret."""
    return orchestrator.schema_generator.generate_all_for_blog(
        title=body.title,
        description=body.description,
        procedure=body.procedure.value,
        lang=body.lang.value,
        url=body.url,
        faqs=body.faqs,
    )


@router.post("/schema/json-ld")
def schema_json_ld(body: SchemaRequest) -> dict:
    """HTML'e gomulecek JSON-LD script tag uret."""
    schemas = orchestrator.schema_generator.generate_all_for_blog(
        title=body.title,
        description=body.description,
        procedure=body.procedure.value,
        lang=body.lang.value,
        url=body.url,
        faqs=body.faqs,
    )
    json_ld = orchestrator.schema_generator.to_json_ld(schemas)
    return {"json_ld": json_ld}


@router.get("/schema/hospitals")
def hospital_schemas(hospital_name: str | None = None) -> dict:
    """Partner hastane Schema.org verileri."""
    schemas = orchestrator.schema_generator.generate_hospital_schema(hospital_name)
    return {"hospitals": schemas, "total": len(schemas)}


# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

@router.get("/procedures")
def list_procedures(lang: str = "en") -> dict:
    """Desteklenen medikal prosedurler."""
    procs = []
    for key, names in PROCEDURE_NAMES.items():
        procs.append({
            "key": key,
            "name": names.get(lang, names.get("en", key)),
        })
    return {"procedures": procs, "total": len(procs)}


@router.get("/regions")
def list_regions(lang: str = "en") -> dict:
    """Desteklenen bolgeler."""
    regions = []
    for key, info in REGION_INFO.items():
        regions.append({
            "key": key,
            "label": info.get("label", {}).get(lang, key),
            "default_lang": info.get("lang", "en"),
            "currency": info.get("currency", "USD"),
        })
    return {"regions": regions, "total": len(regions)}


@router.get("/hospitals")
def list_hospitals() -> dict:
    """Partner hastaneler."""
    return {"hospitals": PARTNER_HOSPITALS, "total": len(PARTNER_HOSPITALS)}
