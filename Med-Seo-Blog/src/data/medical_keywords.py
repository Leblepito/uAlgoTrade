"""
Med-Seo-Blog — Medical Tourism Keyword Database
9 prosedur x 5 dil (TR/EN/RU/AR/TH) + SEO metrikleri.
ThaiTurk / AntiGravity Ventures icin optimize edilmis.
"""
from __future__ import annotations

from typing import Any


# ---------------------------------------------------------------------------
# Prosedur keyword havuzu — 9 prosedur x 5 dil
# ---------------------------------------------------------------------------
PROCEDURE_KEYWORDS: dict[str, dict[str, list[str]]] = {
    "hair_transplant": {
        "tr": [
            "sac ekimi istanbul fiyat", "sac ekimi turkiye", "fue sac ekimi",
            "dhi sac ekimi", "sac ekimi sonuclari", "sac ekimi klinikleri",
            "sac ekimi oncesi sonrasi", "en iyi sac ekimi merkezi",
        ],
        "en": [
            "hair transplant turkey cost", "hair transplant istanbul",
            "fue hair transplant turkey", "dhi hair transplant",
            "best hair transplant clinic turkey", "hair transplant before after",
            "hair transplant recovery", "hair transplant package turkey",
        ],
        "ru": [
            "пересадка волос турция цена", "трансплантация волос стамбул",
            "fue пересадка волос", "dhi пересадка волос",
            "лучшая клиника пересадки волос", "пересадка волос отзывы",
        ],
        "ar": [
            "زراعة الشعر تركيا", "تكلفة زراعة الشعر اسطنبول",
            "زراعة الشعر بتقنية fue", "أفضل مركز زراعة شعر تركيا",
            "زراعة الشعر قبل وبعد",
        ],
        "th": [
            "ปลูกผมตุรกี ราคา", "ปลูกผมอิสตันบูล",
            "fue ปลูกผม ตุรกี", "ปลูกผมต่างประเทศ",
        ],
    },
    "dental": {
        "tr": [
            "dis implant turkiye fiyat", "dis tedavisi istanbul",
            "zirkonyum dis kaplama", "hollywood smile turkiye",
            "dis beyazlatma istanbul", "en iyi dis klinigi",
        ],
        "en": [
            "dental implants turkey cost", "dental treatment istanbul",
            "hollywood smile turkey", "veneers turkey price",
            "best dental clinic turkey", "dental tourism turkey",
        ],
        "ru": [
            "стоматология турция цена", "имплантация зубов стамбул",
            "виниры турция", "голливудская улыбка турция",
        ],
        "ar": [
            "زراعة الأسنان تركيا", "ابتسامة هوليوود تركيا",
            "فينير تركيا سعر", "أفضل عيادة أسنان تركيا",
        ],
        "th": [
            "ทำฟันตุรกี ราคา", "รากฟันเทียมตุรกี",
            "วีเนียร์ตุรกี", "ฮอลลีวูดสไมล์ ตุรกี",
        ],
    },
    "aesthetic": {
        "tr": [
            "rinoplasti istanbul fiyat", "estetik cerrahi turkiye",
            "yuz germe ameliyati", "liposuction istanbul",
            "gogus estetigi turkiye", "burun estetigi fiyat",
        ],
        "en": [
            "rhinoplasty istanbul price", "plastic surgery turkey cost",
            "facelift turkey", "liposuction istanbul",
            "breast augmentation turkey", "nose job turkey",
        ],
        "ru": [
            "ринопластика стамбул цена", "пластическая хирургия турция",
            "подтяжка лица турция", "липосакция стамбул",
        ],
        "ar": [
            "عملية الأنف تركيا", "جراحة تجميل تركيا",
            "شد الوجه تركيا", "شفط الدهون اسطنبول",
        ],
        "th": [
            "เสริมจมูกตุรกี ราคา", "ศัลยกรรมตุรกี",
            "ดูดไขมันตุรกี", "เสริมหน้าอกตุรกี",
        ],
    },
    "bariatric": {
        "tr": [
            "tup mide ameliyati turkiye", "gastrik sleeve istanbul",
            "obezite cerrahisi fiyat", "mide kucultme ameliyati",
        ],
        "en": [
            "gastric sleeve turkey cost", "bariatric surgery istanbul",
            "weight loss surgery turkey", "gastric bypass turkey price",
        ],
        "ru": [
            "бариатрическая хирургия турция", "рукавная гастрэктомия стамбул",
            "шунтирование желудка турция",
        ],
        "ar": [
            "تكميم المعدة تركيا", "جراحة السمنة تركيا",
            "عملية تحويل المسار تركيا",
        ],
        "th": [
            "ผ่าตัดกระเพาะตุรกี", "สลีฟตุรกี ราคา",
        ],
    },
    "ivf": {
        "tr": [
            "tup bebek turkiye fiyat", "ivf tedavisi istanbul",
            "yumurta dondurma turkiye", "tup bebek basari orani",
        ],
        "en": [
            "ivf turkey cost", "ivf treatment istanbul",
            "fertility clinic turkey", "egg freezing turkey",
        ],
        "ru": [
            "эко турция цена", "эко стамбул клиника",
            "заморозка яйцеклеток турция",
        ],
        "ar": [
            "أطفال الأنابيب تركيا", "تكلفة التلقيح الصناعي تركيا",
        ],
        "th": [
            "ทำเด็กหลอดแก้วตุรกี ราคา", "ivf ตุรกี",
        ],
    },
    "ophthalmology": {
        "tr": [
            "lasik istanbul fiyat", "goz ameliyati turkiye",
            "katarakt ameliyati", "goz lazer tedavisi",
        ],
        "en": [
            "lasik istanbul price", "eye surgery turkey cost",
            "cataract surgery turkey", "lens implant turkey",
        ],
        "ru": [
            "лазерная коррекция стамбул", "операция на глаза турция",
        ],
        "ar": [
            "عملية الليزك تركيا", "جراحة العيون تركيا",
        ],
        "th": [
            "เลสิคตุรกี ราคา", "ผ่าตัดตาตุรกี",
        ],
    },
    "checkup": {
        "tr": [
            "check-up turkiye fiyat", "genel saglik kontrolu istanbul",
            "kanser taramasi turkiye", "executive check-up",
        ],
        "en": [
            "health checkup turkey cost", "medical screening istanbul",
            "full body checkup turkey", "cancer screening turkey",
        ],
        "ru": [
            "чекап турция цена", "медицинский осмотр стамбул",
        ],
        "ar": [
            "فحص شامل تركيا", "فحص طبي اسطنبول",
        ],
        "th": [
            "ตรวจสุขภาพตุรกี", "แพ็คเกจตรวจสุขภาพ",
        ],
    },
    "dermatology": {
        "tr": [
            "dermatoloji istanbul", "cilt tedavisi turkiye",
            "akne tedavisi", "lazer epilasyon istanbul",
        ],
        "en": [
            "dermatology turkey", "skin treatment istanbul",
            "acne treatment turkey", "laser hair removal turkey",
        ],
        "ru": [
            "дерматология турция", "лечение кожи стамбул",
        ],
        "ar": [
            "علاج البشرة تركيا", "إزالة الشعر بالليزر تركيا",
        ],
        "th": [
            "รักษาผิวตุรกี", "เลเซอร์กำจัดขนตุรกี",
        ],
    },
    "oncology": {
        "tr": [
            "kanser tedavisi turkiye", "onkoloji istanbul",
            "kemoterapi turkiye fiyat", "ikinci gorus onkoloji",
        ],
        "en": [
            "cancer treatment turkey", "oncology istanbul",
            "chemotherapy turkey cost", "second opinion oncology turkey",
        ],
        "ru": [
            "лечение рака турция", "онкология стамбул",
        ],
        "ar": [
            "علاج السرطان تركيا", "أورام اسطنبول",
        ],
        "th": [
            "รักษามะเร็งตุรกี", "เคมีบำบัดตุรกี",
        ],
    },
}


# ---------------------------------------------------------------------------
# Keyword difficulty & volume estimates
# ---------------------------------------------------------------------------
KEYWORD_METRICS: dict[str, dict[str, Any]] = {
    "hair_transplant":  {"volume": "high",   "difficulty": "medium", "cpc_usd": 1.20, "commission_pct": 22},
    "dental":           {"volume": "high",   "difficulty": "medium", "cpc_usd": 0.95, "commission_pct": 20},
    "aesthetic":        {"volume": "high",   "difficulty": "high",   "cpc_usd": 1.80, "commission_pct": 25},
    "bariatric":        {"volume": "medium", "difficulty": "medium", "cpc_usd": 1.50, "commission_pct": 23},
    "ivf":              {"volume": "medium", "difficulty": "high",   "cpc_usd": 2.10, "commission_pct": 20},
    "ophthalmology":    {"volume": "medium", "difficulty": "low",    "cpc_usd": 0.80, "commission_pct": 18},
    "checkup":          {"volume": "low",    "difficulty": "low",    "cpc_usd": 0.45, "commission_pct": 15},
    "dermatology":      {"volume": "medium", "difficulty": "low",    "cpc_usd": 0.65, "commission_pct": 18},
    "oncology":         {"volume": "low",    "difficulty": "high",   "cpc_usd": 2.50, "commission_pct": 15},
}

VOLUME_LABELS = {"high": "10K-50K/mo", "medium": "1K-10K/mo", "low": "100-1K/mo"}
DIFFICULTY_LABELS = {"high": "hard", "medium": "moderate", "low": "easy"}


# ---------------------------------------------------------------------------
# Prosedur gorsel adlari (5 dil)
# ---------------------------------------------------------------------------
PROCEDURE_NAMES: dict[str, dict[str, str]] = {
    "hair_transplant": {"tr": "Sac Ekimi", "en": "Hair Transplant", "ru": "Пересадка волос", "ar": "زراعة الشعر", "th": "ปลูกผม"},
    "dental":          {"tr": "Dis Tedavisi", "en": "Dental Treatment", "ru": "Стоматология", "ar": "علاج الأسنان", "th": "ทันตกรรม"},
    "aesthetic":       {"tr": "Estetik Cerrahi", "en": "Plastic Surgery", "ru": "Пластическая хирургия", "ar": "جراحة تجميل", "th": "ศัลยกรรม"},
    "bariatric":       {"tr": "Obezite Cerrahisi", "en": "Bariatric Surgery", "ru": "Бариатрическая хирургия", "ar": "جراحة السمنة", "th": "ผ่าตัดลดน้ำหนัก"},
    "ivf":             {"tr": "Tup Bebek", "en": "IVF Treatment", "ru": "ЭКО", "ar": "أطفال الأنابيب", "th": "เด็กหลอดแก้ว"},
    "ophthalmology":   {"tr": "Goz Ameliyati", "en": "Eye Surgery", "ru": "Офтальмология", "ar": "جراحة العيون", "th": "ผ่าตัดตา"},
    "checkup":         {"tr": "Check-up", "en": "Health Checkup", "ru": "Чекап", "ar": "فحص شامل", "th": "ตรวจสุขภาพ"},
    "dermatology":     {"tr": "Dermatoloji", "en": "Dermatology", "ru": "Дерматология", "ar": "أمراض جلدية", "th": "ผิวหนัง"},
    "oncology":        {"tr": "Onkoloji", "en": "Oncology", "ru": "Онкология", "ar": "علاج الأورام", "th": "มะเร็งวิทยา"},
}


# ---------------------------------------------------------------------------
# Bolge bilgileri
# ---------------------------------------------------------------------------
REGION_INFO: dict[str, dict[str, Any]] = {
    "turkey": {"lang": "tr", "currency": "USD", "label": {"tr": "Turkiye", "en": "Turkey", "ru": "Турция", "ar": "تركيا", "th": "ตุรกี"}},
    "russia": {"lang": "ru", "currency": "USD", "label": {"tr": "Rusya", "en": "Russia", "ru": "Россия", "ar": "روسيا", "th": "รัสเซีย"}},
    "uae":    {"lang": "ar", "currency": "AED", "label": {"tr": "BAE", "en": "UAE", "ru": "ОАЭ", "ar": "الإمارات", "th": "สหรัฐอาหรับเอมิเรตส์"}},
    "europe": {"lang": "en", "currency": "EUR", "label": {"tr": "Avrupa", "en": "Europe", "ru": "Европа", "ar": "أوروبا", "th": "ยุโรป"}},
    "asia":   {"lang": "th", "currency": "THB", "label": {"tr": "Asya", "en": "Asia", "ru": "Азия", "ar": "آسيا", "th": "เอเชีย"}},
}


# ---------------------------------------------------------------------------
# ThaiTurk partner hastaneler (referans)
# ---------------------------------------------------------------------------
PARTNER_HOSPITALS = [
    {"name": "Memorial Sisli", "city": "Istanbul", "specialties": ["aesthetic", "hair_transplant", "dental", "bariatric"]},
    {"name": "Acibadem Maslak", "city": "Istanbul", "specialties": ["oncology", "ivf", "checkup", "ophthalmology"]},
    {"name": "Medipol Mega", "city": "Istanbul", "specialties": ["hair_transplant", "dental", "bariatric", "aesthetic"]},
    {"name": "Florence Nightingale", "city": "Istanbul", "specialties": ["oncology", "checkup", "dermatology"]},
    {"name": "Liv Hospital Ulus", "city": "Istanbul", "specialties": ["aesthetic", "ivf", "ophthalmology"]},
]
