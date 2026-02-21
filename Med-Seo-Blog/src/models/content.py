"""Med-Seo-Blog — Pydantic request/response models."""
from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Procedure(str, Enum):
    HAIR_TRANSPLANT = "hair_transplant"
    DENTAL = "dental"
    AESTHETIC = "aesthetic"
    BARIATRIC = "bariatric"
    IVF = "ivf"
    OPHTHALMOLOGY = "ophthalmology"
    CHECKUP = "checkup"
    DERMATOLOGY = "dermatology"
    ONCOLOGY = "oncology"


class Region(str, Enum):
    TURKEY = "turkey"
    RUSSIA = "russia"
    UAE = "uae"
    EUROPE = "europe"
    ASIA = "asia"


class Lang(str, Enum):
    TR = "tr"
    EN = "en"
    RU = "ru"
    AR = "ar"
    TH = "th"


class Tone(str, Enum):
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    LUXURY = "luxury"
    URGENT = "urgent"


# ---------------------------------------------------------------------------
# Blog
# ---------------------------------------------------------------------------

class BlogRequest(BaseModel):
    procedure: Procedure = Procedure.HAIR_TRANSPLANT
    region: Region = Region.TURKEY
    lang: Lang = Lang.TR
    tone: Tone = Tone.PROFESSIONAL
    target_keywords: Optional[list[str]] = None


class FullBlogPackageRequest(BaseModel):
    procedure: Procedure = Procedure.HAIR_TRANSPLANT
    region: Region = Region.TURKEY
    lang: Lang = Lang.TR
    tone: Tone = Tone.PROFESSIONAL
    base_url: str = ""


# ---------------------------------------------------------------------------
# SEO
# ---------------------------------------------------------------------------

class KeywordAnalysisRequest(BaseModel):
    procedure: Procedure = Procedure.HAIR_TRANSPLANT
    region: Region = Region.TURKEY
    lang: Lang = Lang.TR


class KeywordExpandRequest(BaseModel):
    procedure: Procedure = Procedure.HAIR_TRANSPLANT
    region: Region = Region.TURKEY
    lang: Lang = Lang.TR
    count: int = Field(default=20, ge=5, le=50)


class ContentScoreRequest(BaseModel):
    text: str
    target_keywords: list[str]


class ContentOptimizeRequest(BaseModel):
    text: str
    target_keywords: list[str]
    lang: Lang = Lang.TR


class MetaTagRequest(BaseModel):
    title: str
    description: str
    keywords: list[str] = []
    lang: Lang = Lang.TR


class SitemapRequest(BaseModel):
    base_url: str
    procedures: Optional[list[Procedure]] = None
    langs: Optional[list[Lang]] = None


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

class SchemaRequest(BaseModel):
    title: str
    description: str
    procedure: Procedure = Procedure.HAIR_TRANSPLANT
    lang: Lang = Lang.TR
    url: str = ""
    faqs: Optional[list[dict[str, str]]] = None


class KeywordGapRequest(BaseModel):
    our_keywords: list[str]
    competitor_keywords: list[str]
