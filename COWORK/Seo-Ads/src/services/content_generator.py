"""Culture-aware social media content generator.

Generates region-specific, platform-optimized marketing content
for crypto trading platforms across 6 target markets.
Designed to be integrated into any website or app via REST API.
"""

from __future__ import annotations

import random
from datetime import datetime, timezone

from src.models.content import (
    ContentPiece,
    ContentRequest,
    ContentResponse,
    Platform,
    Region,
)

# ---------------------------------------------------------------------------
# Region Culture Profiles
# ---------------------------------------------------------------------------

REGION_PROFILES: dict[Region, dict] = {
    Region.EN: {
        "name": "English (Global)",
        "tone": "professional",
        "style": "data-driven, concise, trust-focused",
        "currency_symbol": "$",
        "preferred_hours": "09:00-17:00 UTC",
        "cultural_notes": "Direct communication, ROI focus, compliance-aware",
        "greetings": ["Level up your trading", "Trade smarter", "Your edge in crypto"],
        "cta_styles": ["Start Free Trial", "Get Started Now", "Try It Free"],
        "emoji_density": "low",
        "hashtag_style": "camelCase",
        "trust_signals": ["SEC-aware", "bank-grade encryption", "trusted by traders worldwide"],
        "taboo_topics": ["guaranteed returns", "get rich quick"],
        "seasonal_events": ["New Year", "Black Friday", "Tax Season"],
    },
    Region.TR: {
        "name": "Türkçe (Türkiye)",
        "tone": "warm_professional",
        "style": "güven odaklı, samimi ama profesyonel, topluluk vurgusu",
        "currency_symbol": "₺",
        "preferred_hours": "10:00-22:00 UTC+3",
        "cultural_notes": "Güven çok önemli, topluluk hissi, yerel başarı hikayeleri",
        "greetings": ["Kripto dünyasında fark yarat", "Akıllı trade zamanı", "Profesyonel trade deneyimi"],
        "cta_styles": ["Hemen Başla", "Ücretsiz Dene", "Keşfet"],
        "emoji_density": "medium",
        "hashtag_style": "Turkish",
        "trust_signals": ["Türk trader topluluğu", "7/24 destek", "güvenli altyapı"],
        "taboo_topics": ["kesin kazanç garantisi", "kumar benzeri ifadeler"],
        "seasonal_events": ["Ramazan", "Cumhuriyet Bayramı", "23 Nisan"],
    },
    Region.TH: {
        "name": "ภาษาไทย (ประเทศไทย)",
        "tone": "friendly_respectful",
        "style": "สุภาพ เป็นกันเอง เน้นชุมชน",
        "currency_symbol": "฿",
        "preferred_hours": "09:00-21:00 UTC+7",
        "cultural_notes": "Respect hierarchy, community-driven, visual content preferred",
        "greetings": ["เทรดอย่างมืออาชีพ", "สร้างโอกาสในคริปโต", "เริ่มต้นเทรดวันนี้"],
        "cta_styles": ["เริ่มต้นฟรี", "ทดลองใช้งาน", "สมัครเลย"],
        "emoji_density": "high",
        "hashtag_style": "Thai",
        "trust_signals": ["ชุมชนเทรดเดอร์ไทย", "ระบบปลอดภัย", "ทีมซัพพอร์ตไทย"],
        "taboo_topics": ["disrespect to monarchy", "gambling references"],
        "seasonal_events": ["Songkran", "Loy Krathong", "King's Birthday"],
    },
    Region.AR: {
        "name": "العربية (الإمارات)",
        "tone": "formal_prestigious",
        "style": "رسمي، فاخر، يركز على النجاح والتميز",
        "currency_symbol": "د.إ",
        "preferred_hours": "10:00-23:00 UTC+4",
        "cultural_notes": "Prestige-focused, luxury positioning, respect for tradition",
        "greetings": ["تداول بذكاء", "منصة التداول المتقدمة", "ابدأ رحلتك في عالم الكريبتو"],
        "cta_styles": ["ابدأ الآن", "جرب مجاناً", "اكتشف المزيد"],
        "emoji_density": "low",
        "hashtag_style": "Arabic",
        "trust_signals": ["تقنية متقدمة", "حماية عالمية", "دعم عربي متخصص"],
        "taboo_topics": ["alcohol references", "religious insensitivity", "haram finance"],
        "seasonal_events": ["Ramadan", "Eid al-Fitr", "UAE National Day"],
    },
    Region.RU: {
        "name": "Русский (Россия)",
        "tone": "direct_technical",
        "style": "прямой, технический, ориентированный на результат",
        "currency_symbol": "₽",
        "preferred_hours": "09:00-21:00 UTC+3",
        "cultural_notes": "Technical depth valued, skepticism towards hype, prefer proof",
        "greetings": ["Торгуйте умнее с ИИ", "Профессиональный трейдинг", "Ваше преимущество на рынке"],
        "cta_styles": ["Начать бесплатно", "Попробовать", "Зарегистрироваться"],
        "emoji_density": "low",
        "hashtag_style": "Russian",
        "trust_signals": ["проверенные алгоритмы", "прозрачная статистика", "техническая поддержка 24/7"],
        "taboo_topics": ["political content", "overpromising"],
        "seasonal_events": ["Новый год", "8 Марта", "День России"],
    },
    Region.ZH: {
        "name": "中文 (简体)",
        "tone": "authoritative_modern",
        "style": "权威、现代、注重数据和技术",
        "currency_symbol": "¥",
        "preferred_hours": "09:00-22:00 UTC+8",
        "cultural_notes": "Tech-savvy audience, data-driven, WeChat culture, KOL influence",
        "greetings": ["智能交易新时代", "AI驱动加密货币交易", "专业交易平台"],
        "cta_styles": ["立即体验", "免费试用", "马上注册"],
        "emoji_density": "medium",
        "hashtag_style": "Chinese",
        "trust_signals": ["AI技术驱动", "专业团队", "安全可靠"],
        "taboo_topics": ["political sensitivity", "regulatory criticism"],
        "seasonal_events": ["春节", "中秋节", "双十一"],
    },
}

# ---------------------------------------------------------------------------
# Platform Specifications
# ---------------------------------------------------------------------------

PLATFORM_SPECS: dict[Platform, dict] = {
    Platform.GOOGLE_ADS: {
        "name": "Google Ads",
        "headline_max": 30,
        "body_max": 90,
        "cta_max": 25,
        "format": "headline + description",
        "hashtags": False,
        "tips": "Focus on search intent keywords, clear value proposition",
    },
    Platform.META_FB: {
        "name": "Meta (Facebook)",
        "headline_max": 80,
        "body_max": 500,
        "cta_max": 40,
        "format": "post with image caption",
        "hashtags": True,
        "max_hashtags": 5,
        "tips": "Storytelling, community engagement, visual-first",
    },
    Platform.META_IG: {
        "name": "Meta (Instagram)",
        "headline_max": 60,
        "body_max": 2200,
        "cta_max": 40,
        "format": "caption with hashtags",
        "hashtags": True,
        "max_hashtags": 15,
        "tips": "Visual storytelling, lifestyle integration, carousel friendly",
    },
    Platform.X_TWITTER: {
        "name": "X (Twitter)",
        "headline_max": 50,
        "body_max": 280,
        "cta_max": 30,
        "format": "tweet thread",
        "hashtags": True,
        "max_hashtags": 3,
        "tips": "Concise, engaging, conversation-starting, thread-friendly",
    },
    Platform.YOUTUBE: {
        "name": "YouTube",
        "headline_max": 100,
        "body_max": 5000,
        "cta_max": 50,
        "format": "video title + description",
        "hashtags": True,
        "max_hashtags": 5,
        "tips": "SEO title, detailed description, timestamps, keywords",
    },
    Platform.SEO_BLOG: {
        "name": "SEO Blog Post",
        "headline_max": 70,
        "body_max": 3000,
        "cta_max": 60,
        "format": "blog post with meta description",
        "hashtags": False,
        "tips": "Long-tail keywords, structured headings, internal links",
    },
}

# ---------------------------------------------------------------------------
# Content Templates (per topic x region patterns)
# ---------------------------------------------------------------------------

_TEMPLATES: dict[str, dict[Region, list[str]]] = {
    "crypto_trading": {
        Region.EN: [
            "Stop guessing. Start trading with AI-powered signals that analyze {symbol} across 6 indicators in real-time. {cta}",
            "Our multi-agent AI swarm just identified a high-confidence setup on {symbol}. Smart Money, Elliott Wave, and RSI all aligned. {cta}",
            "Professional traders don't rely on gut feeling. They use data. U2Algo gives you institutional-grade analysis on {symbol}. {cta}",
        ],
        Region.TR: [
            "{symbol} için yapay zeka destekli sinyaller hazır. 6 farklı indikatör, gerçek zamanlı analiz. {cta}",
            "Profesyonel traderlar U2Algo ile fark yaratıyor. Akıllı Para, Elliott Wave ve RSI bir arada. {cta}",
            "Kripto piyasalarında avantajınızı artırın. {symbol} analizi yapay zeka ile saniyeler içinde. {cta}",
        ],
        Region.TH: [
            "สัญญาณ AI สำหรับ {symbol} พร้อมแล้ว วิเคราะห์ 6 ตัวชี้วัดแบบเรียลไทม์ {cta}",
            "เทรดเดอร์มืออาชีพใช้ U2Algo — Smart Money, Elliott Wave และ RSI ทั้งหมดในที่เดียว {cta}",
            "ยกระดับการเทรดคริปโตของคุณด้วย AI ฝูงอัจฉริยะ วิเคราะห์ {symbol} ได้ทันที {cta}",
        ],
        Region.AR: [
            "إشارات ذكاء اصطناعي لـ {symbol} جاهزة الآن. تحليل 6 مؤشرات في الوقت الفعلي. {cta}",
            "المتداولون المحترفون يستخدمون U2Algo — Smart Money وElliott Wave وRSI في منصة واحدة. {cta}",
            "ارتقِ بتداول العملات الرقمية مع ذكاء سرب الوكلاء المتعدد. تحليل فوري لـ {symbol}. {cta}",
        ],
        Region.RU: [
            "ИИ-сигналы для {symbol} готовы. 6 индикаторов, анализ в реальном времени. {cta}",
            "Профессиональные трейдеры используют U2Algo — Smart Money, Elliott Wave и RSI в одной платформе. {cta}",
            "Повысьте эффективность крипто-трейдинга с мультиагентным ИИ. Мгновенный анализ {symbol}. {cta}",
        ],
        Region.ZH: [
            "{symbol} AI信号已就绪。6大指标实时分析。{cta}",
            "专业交易者选择U2Algo — Smart Money、Elliott Wave和RSI一站式平台。{cta}",
            "用多代理AI群体智能提升你的加密货币交易。{symbol}即时分析。{cta}",
        ],
    },
    "market_update": {
        Region.EN: [
            "{symbol} is showing interesting patterns. Our AI swarm detected confluence across multiple timeframes. Here's what the data says. {cta}",
            "Market update: {symbol} key levels identified by our 5-agent AI system. Support, resistance, and Smart Money zones mapped. {cta}",
        ],
        Region.TR: [
            "{symbol} ilginç formasyonlar gösteriyor. AI sürümüz çoklu zaman dilimlerinde uyum tespit etti. {cta}",
            "Piyasa güncellemesi: {symbol} için 5 ajanlı AI sistemimiz kritik seviyeleri belirledi. {cta}",
        ],
        Region.TH: [
            "{symbol} แสดงรูปแบบที่น่าสนใจ ระบบ AI ตรวจพบการบรรจบกันในหลายกรอบเวลา {cta}",
            "อัพเดทตลาด: ระบบ AI 5 ตัวแทนระบุระดับสำคัญของ {symbol} แล้ว {cta}",
        ],
        Region.AR: [
            "{symbol} يظهر أنماطاً مثيرة. اكتشف سرب الذكاء الاصطناعي تقاطعاً عبر أطر زمنية متعددة. {cta}",
            "تحديث السوق: نظام الوكلاء الخمسة حدد مستويات حرجة لـ {symbol}. {cta}",
        ],
        Region.RU: [
            "{symbol} показывает интересные паттерны. ИИ-рой обнаружил конфлюенцию на нескольких таймфреймах. {cta}",
            "Обзор рынка: 5-агентная система определила ключевые уровни для {symbol}. {cta}",
        ],
        Region.ZH: [
            "{symbol}出现有趣的形态。AI群体在多个时间框架中检测到汇合信号。{cta}",
            "市场更新：5代理AI系统已识别{symbol}的关键水平。{cta}",
        ],
    },
    "product_promo": {
        Region.EN: [
            "U2Algo Pro: 6 AI agents working 24/7 to find your next trade. Elliott Wave, Order Blocks, and more — all automated. {cta}",
            "Upgrade to Premium and unlock 50 backtests/day. Test strategies on historical data before risking real capital. {cta}",
        ],
        Region.TR: [
            "U2Algo Pro: 6 yapay zeka ajanı 7/24 çalışarak trade fırsatlarını buluyor. Elliott Wave, Order Block ve daha fazlası. {cta}",
            "Premium'a geçin — günde 50 backtest ile stratejilerinizi geçmiş verilerde test edin. {cta}",
        ],
        Region.TH: [
            "U2Algo Pro: 6 ตัวแทน AI ทำงาน 24/7 เพื่อค้นหาโอกาสเทรด Elliott Wave, Order Block และอื่นๆ {cta}",
            "อัพเกรดเป็น Premium — ทดสอบย้อนหลัง 50 ครั้ง/วัน ทดสอบกลยุทธ์ก่อนเสี่ยงเงินจริง {cta}",
        ],
        Region.AR: [
            "U2Algo Pro: 6 وكلاء ذكاء اصطناعي يعملون على مدار الساعة لإيجاد فرص التداول. {cta}",
            "ارتقِ إلى Premium — 50 اختبار رجعي يومياً. اختبر استراتيجياتك قبل المخاطرة برأس مال حقيقي. {cta}",
        ],
        Region.RU: [
            "U2Algo Pro: 6 ИИ-агентов работают 24/7, находя торговые возможности. Elliott Wave, Order Block и многое другое. {cta}",
            "Переходите на Premium — 50 бэктестов в день. Тестируйте стратегии на исторических данных. {cta}",
        ],
        Region.ZH: [
            "U2Algo Pro：6个AI代理全天候工作，寻找交易机会。Elliott Wave、Order Block等全自动化。{cta}",
            "升级Premium — 每天50次回测。在投入真实资金前测试您的策略。{cta}",
        ],
    },
    "educational": {
        Region.EN: [
            "What are Smart Money Concepts? Learn how institutional traders move markets — and how U2Algo tracks their footprints. {cta}",
            "Elliott Wave Theory explained: Our AI identifies wave patterns that most traders miss. Here's how it works. {cta}",
        ],
        Region.TR: [
            "Smart Money Concepts nedir? Kurumsal traderların piyasayı nasıl hareket ettirdiğini öğrenin. {cta}",
            "Elliott Wave Teorisi: AI'mız çoğu trader'ın kaçırdığı dalga formasyonlarını tespit eder. {cta}",
        ],
        Region.TH: [
            "Smart Money Concepts คืออะไร? เรียนรู้วิธีที่สถาบันขับเคลื่อนตลาด {cta}",
            "ทฤษฎี Elliott Wave: AI ของเราระบุรูปแบบคลื่นที่เทรดเดอร์ส่วนใหญ่พลาด {cta}",
        ],
        Region.AR: [
            "ما هي مفاهيم Smart Money؟ تعلم كيف يحرك المتداولون المؤسسيون الأسواق. {cta}",
            "نظرية Elliott Wave: ذكاؤنا الاصطناعي يحدد أنماط الموجات التي يفوتها معظم المتداولين. {cta}",
        ],
        Region.RU: [
            "Что такое Smart Money Concepts? Узнайте, как институциональные трейдеры двигают рынки. {cta}",
            "Теория волн Эллиотта: наш ИИ находит волновые паттерны, которые пропускают большинство трейдеров. {cta}",
        ],
        Region.ZH: [
            "什么是Smart Money概念？了解机构交易者如何影响市场。{cta}",
            "Elliott Wave理论详解：我们的AI能识别大多数交易者忽略的波浪形态。{cta}",
        ],
    },
}

# ---------------------------------------------------------------------------
# Hashtag banks per region
# ---------------------------------------------------------------------------

_HASHTAGS: dict[Region, list[str]] = {
    Region.EN: ["#CryptoTrading", "#Bitcoin", "#AITrading", "#U2Algo", "#CryptoSignals", "#TradingBot", "#DeFi", "#Ethereum", "#SmartMoney", "#ElliottWave"],
    Region.TR: ["#KriptoTicaret", "#Bitcoin", "#YapayZeka", "#U2Algo", "#KriptoSinyal", "#Trade", "#Borsa", "#Ethereum", "#AkıllıPara", "#Yatırım"],
    Region.TH: ["#เทรดคริปโต", "#บิทคอยน์", "#AITrading", "#U2Algo", "#สัญญาณคริปโต", "#เทรด", "#คริปโต", "#อีเธอเรียม", "#ลงทุน", "#เทรดเดอร์ไทย"],
    Region.AR: ["#تداول_العملات_الرقمية", "#بيتكوين", "#ذكاء_اصطناعي", "#U2Algo", "#كريبتو", "#تداول", "#إيثيريوم", "#استثمار", "#بلوكتشين", "#تحليل_فني"],
    Region.RU: ["#КриптоТрейдинг", "#Биткоин", "#ИИТрейдинг", "#U2Algo", "#КриптоСигналы", "#Трейдинг", "#Эфириум", "#Инвестиции", "#СмартМани", "#Криптовалюта"],
    Region.ZH: ["#加密货币交易", "#比特币", "#AI交易", "#U2Algo", "#加密信号", "#交易", "#以太坊", "#投资", "#智能交易", "#区块链"],
}


# ---------------------------------------------------------------------------
# Content Generator
# ---------------------------------------------------------------------------


class ContentGenerator:
    """Generates culture-aware, platform-optimized content."""

    def generate(self, req: ContentRequest) -> ContentResponse:
        profile = REGION_PROFILES[req.region]
        spec = PLATFORM_SPECS[req.platform]
        symbol = req.symbol or "BTC/USDT"

        templates = _TEMPLATES.get(req.topic, _TEMPLATES["crypto_trading"])
        region_templates = templates.get(req.region, templates[Region.EN])

        cta = random.choice(profile["cta_styles"])
        template = random.choice(region_templates)

        raw_body = template.format(symbol=symbol, cta=cta)

        headline = self._make_headline(req, profile, spec, symbol)
        body = self._trim(raw_body, spec["body_max"])
        cta_text = self._trim(cta, spec["cta_max"])
        hashtags = self._pick_hashtags(req.region, req.platform, spec)

        piece = ContentPiece(
            headline=headline,
            body=body,
            cta=cta_text,
            hashtags=hashtags,
            character_count=len(headline) + len(body) + len(cta_text),
            platform=req.platform,
            region=req.region,
            tone=profile["tone"],
        )

        return ContentResponse(
            pieces=[piece],
            region_profile=profile["name"],
            platform_spec=spec["name"],
        )

    def generate_bulk(
        self,
        regions: list[Region],
        platforms: list[Platform],
        topic: str = "crypto_trading",
        symbol: str | None = None,
    ) -> list[ContentPiece]:
        pieces: list[ContentPiece] = []
        for region in regions:
            for platform in platforms:
                req = ContentRequest(
                    region=region,
                    platform=platform,
                    topic=topic,
                    symbol=symbol,
                )
                resp = self.generate(req)
                pieces.extend(resp.pieces)
        return pieces

    # -- helpers --

    def _make_headline(
        self,
        req: ContentRequest,
        profile: dict,
        spec: dict,
        symbol: str,
    ) -> str:
        greeting = random.choice(profile["greetings"])
        raw = f"{greeting} — {symbol}"
        return self._trim(raw, spec["headline_max"])

    @staticmethod
    def _trim(text: str, max_len: int) -> str:
        if len(text) <= max_len:
            return text
        return text[: max_len - 1] + "\u2026"

    @staticmethod
    def _pick_hashtags(region: Region, platform: Platform, spec: dict) -> list[str]:
        if not spec.get("hashtags", False):
            return []
        bank = _HASHTAGS.get(region, _HASHTAGS[Region.EN])
        max_tags = spec.get("max_hashtags", 5)
        return random.sample(bank, min(max_tags, len(bank)))


# Singleton
content_generator = ContentGenerator()
