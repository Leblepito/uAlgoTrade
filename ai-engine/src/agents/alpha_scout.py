"""Alpha Scout Agent — Sentiment analysis via RSS feeds, NLP, and market regime detection.

Role: Sentiment Hunter
Mission: Parse the market's emotional temperature from news, social signals, and macro events.
         Feed directional sentiment signals into the consensus voting process.

Key capabilities:
- Multi-source RSS feed aggregation with fallback handling
- Dual-scoring: keyword-weighted + TextBlob NLP polarity hybrid
- Adaptive bias correction via reinforcement feedback loop
- Market regime classification (RISK_ON / RISK_OFF / NEUTRAL)
- Symbol-specific and market-wide sentiment separation
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import feedparser
from textblob import TextBlob

from src.agents.base_agent import BaseAgent
from src.config import settings

logger = logging.getLogger(__name__)

# Primary RSS feeds — crypto & macro news
PRIMARY_FEEDS = [
    "https://cointelegraph.com/rss",
    "https://coindesk.com/arc/outboundfeeds/rss/",
    "https://cryptonews.com/news/feed/",
]

# Fallback feeds if primary ones fail
FALLBACK_FEEDS = [
    "https://decrypt.co/feed",
    "https://thedefiant.io/api/feed",
]

# Negative sentiment keywords with severity weights [-1.0, 0.0]
PANIC_WORDS: dict[str, float] = {
    "crash": -0.85, "plunge": -0.75, "hack": -0.95, "exploit": -0.90,
    "ban": -0.65, "fraud": -0.85, "liquidation": -0.60, "bearish": -0.45,
    "sell-off": -0.65, "dump": -0.60, "fear": -0.45, "collapse": -0.80,
    "scam": -0.90, "rug pull": -0.95, "bankrupt": -0.85, "shutdown": -0.70,
    "regulation": -0.35, "sec": -0.40, "fine": -0.50, "lawsuit": -0.55,
    "congestion": -0.25, "delay": -0.20, "outage": -0.55, "vulnerability": -0.65,
}

# Positive sentiment keywords with intensity weights [0.0, 1.0]
EUPHORIA_WORDS: dict[str, float] = {
    "surge": 0.75, "rally": 0.65, "bullish": 0.55, "ath": 0.85, "all-time high": 0.90,
    "moon": 0.45, "breakout": 0.65, "adoption": 0.55, "approval": 0.75,
    "institutional": 0.60, "record": 0.45, "boom": 0.65, "soar": 0.75,
    "etf": 0.70, "partnership": 0.50, "launch": 0.45, "upgrade": 0.50,
    "halving": 0.60, "accumulation": 0.55, "whale": 0.40, "staking": 0.35,
    "integration": 0.45, "mainnet": 0.55, "listing": 0.50,
}

# Macro risk-off indicators (affect all crypto markets)
RISK_OFF_MACRO = [
    "inflation", "rate hike", "fed", "recession", "geopolitical", "war", "crisis",
    "bank run", "contagion", "systemic",
]


class AlphaScoutAgent(BaseAgent):
    """Sentiment Hunter — aggregates market mood from news feeds and NLP analysis.

    Produces directional signals (LONG/SHORT/NEUTRAL) with confidence scores
    based on multi-source sentiment aggregation and adaptive learning.
    """

    def __init__(self):
        super().__init__(
            name="alpha_scout",
            role="Sentiment Hunter — RSS aggregation, NLP, market regime detection",
            version="1.2.0",
        )
        self.feeds = PRIMARY_FEEDS.copy()
        self.bias_correction: float = 0.0   # Adaptive correction via reinforcement
        self.feedback_history: list[float] = []  # Track outcomes for bias calibration
        self._consecutive_failures: int = 0  # Feed health tracking

    async def analyze(self, symbol: str, **kwargs) -> dict:
        """Scan RSS feeds and compute multi-dimensional sentiment for a symbol.

        Args:
            symbol: Trading pair e.g. 'BTCUSDT'
            **kwargs: Optional 'include_macro' (bool) to include macro sentiment overlay

        Returns:
            Sentiment result dict with direction, confidence, scores, and metadata.
        """
        include_macro: bool = kwargs.get("include_macro", True)

        # Fetch articles — with fallback to backup feeds on repeated failure
        articles = await self._fetch_articles(symbol)
        if not articles and self._consecutive_failures >= 2:
            articles = await self._fetch_articles_fallback(symbol)

        if not articles:
            self._consecutive_failures += 1
            return {
                "agent": self.name,
                "symbol": symbol,
                "sentiment_score": 0.0,
                "confidence": 0.2,
                "direction": "NEUTRAL",
                "article_count": 0,
                "macro_overlay": None,
                "market_regime": "UNKNOWN",
                "summary": f"No articles found for {symbol} (consecutive failures: {self._consecutive_failures})",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        self._consecutive_failures = 0

        # Score each article
        scores = [self._score_article(article, symbol) for article in articles]
        avg_score = sum(scores) / len(scores)
        corrected_score = max(-1.0, min(1.0, avg_score + self.bias_correction))

        # Macro overlay: dampen signal if macro is risk-off
        macro_overlay = None
        if include_macro:
            macro_score = await self._compute_macro_overlay()
            macro_overlay = macro_score
            if macro_score < -0.3:
                # Risk-off macro: drag signal toward negative
                corrected_score = corrected_score * 0.6 + macro_score * 0.4

        # Confidence: article volume + signal strength
        volume_boost = min(len(articles) / 10, 0.3)  # More articles → more confidence
        signal_strength = abs(corrected_score)
        confidence = min(signal_strength * 0.6 + volume_boost + 0.15, 0.95)

        # Direction thresholds (asymmetric: bearish news travels faster)
        if corrected_score > 0.25:
            direction = "LONG"
        elif corrected_score < -0.20:
            direction = "SHORT"
        else:
            direction = "NEUTRAL"

        # Market regime classification
        if corrected_score > 0.4:
            market_regime = "RISK_ON"
        elif corrected_score < -0.35:
            market_regime = "RISK_OFF"
        else:
            market_regime = "NEUTRAL"

        result = {
            "agent": self.name,
            "symbol": symbol,
            "sentiment_score": round(corrected_score, 4),
            "raw_score": round(avg_score, 4),
            "confidence": round(confidence, 4),
            "direction": direction,
            "article_count": len(articles),
            "bias_correction": round(self.bias_correction, 4),
            "macro_overlay": round(macro_overlay, 4) if macro_overlay is not None else None,
            "market_regime": market_regime,
            "summary": (
                f"Analyzed {len(articles)} articles for {symbol}: "
                f"sentiment={corrected_score:+.2f}, regime={market_regime}"
            ),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Persist decision to memory
        await self.memory.store_decision(symbol, result)

        return result

    async def _fetch_articles(self, symbol: str) -> list[dict]:
        """Fetch and filter articles from primary RSS feeds."""
        return await self._fetch_from_feeds(symbol, self.feeds)

    async def _fetch_articles_fallback(self, symbol: str) -> list[dict]:
        """Fetch from fallback feeds when primary feeds repeatedly fail."""
        logger.warning(f"[{self.name}] falling back to secondary feeds for {symbol}")
        return await self._fetch_from_feeds(symbol, FALLBACK_FEEDS)

    async def _fetch_from_feeds(self, symbol: str, feed_urls: list[str]) -> list[dict]:
        """Fetch articles from a list of feed URLs, filter by symbol relevance."""
        articles = []
        symbol_clean = symbol.lower().replace("usdt", "").replace("busd", "").replace("usdc", "")

        async def fetch_feed(url: str) -> list[dict]:
            try:
                # feedparser is sync — run in thread pool to avoid blocking
                feed = await asyncio.get_event_loop().run_in_executor(
                    None, feedparser.parse, url
                )
                results = []
                for entry in feed.entries[:15]:
                    title = entry.get("title", "").lower()
                    summary = entry.get("summary", "").lower()
                    if symbol_clean in title or symbol_clean in summary or "crypto" in title:
                        results.append({
                            "title": entry.get("title", ""),
                            "summary": entry.get("summary", "")[:500],
                            "source": url,
                            "published": entry.get("published", ""),
                        })
                return results
            except Exception as e:
                logger.warning(f"[{self.name}] feed error ({url}): {e}")
                return []

        results = await asyncio.gather(*[fetch_feed(url) for url in feed_urls])
        for batch in results:
            articles.extend(batch)

        return articles[:25]  # Cap at 25 articles

    def _score_article(self, article: dict, symbol: str) -> float:
        """Score article sentiment using keyword weights + TextBlob NLP hybrid.

        Returns a score in [-1.0, 1.0] where:
        - Negative → bearish/panic
        - Positive → bullish/euphoria
        - Zero → neutral
        """
        text = f"{article['title']} {article['summary']}".lower()

        # Keyword scoring
        keyword_score = 0.0
        keyword_matches = 0
        for word, weight in {**PANIC_WORDS, **EUPHORIA_WORDS}.items():
            if word in text:
                keyword_score += weight
                keyword_matches += 1

        keyword_avg = keyword_score / max(keyword_matches, 1)

        # TextBlob NLP polarity
        try:
            blob = TextBlob(article["title"] + " " + article.get("summary", ""))
            nlp_score = blob.sentiment.polarity
        except Exception:
            nlp_score = 0.0

        # Title-weighted: headlines carry 1.5x signal of body text
        title_blob = TextBlob(article["title"])
        title_nlp = title_blob.sentiment.polarity

        # Final blend: 50% keywords, 30% title NLP, 20% body NLP
        combined = 0.50 * keyword_avg + 0.30 * title_nlp + 0.20 * nlp_score
        return max(-1.0, min(1.0, combined))

    async def _compute_macro_overlay(self) -> float:
        """Assess macro risk-off/risk-on environment from recent headlines."""
        articles = []
        try:
            feed = await asyncio.get_event_loop().run_in_executor(
                None, feedparser.parse, "https://feeds.reuters.com/reuters/businessNews"
            )
            for entry in feed.entries[:10]:
                articles.append(entry.get("title", "").lower())
        except Exception:
            return 0.0

        if not articles:
            return 0.0

        risk_off_count = sum(
            1 for a in articles
            if any(term in a for term in RISK_OFF_MACRO)
        )
        # Score from -1 (heavy risk-off) to 0 (neutral macro)
        overlay = -min(risk_off_count / 5, 1.0)
        return overlay

    def apply_feedback(self, actual_outcome: float, symbol: Optional[str] = None):
        """Update bias correction based on actual market outcome (online learning).

        Args:
            actual_outcome: Realized direction in [-1.0, 1.0] (negative=SHORT, positive=LONG)
            symbol: Optional symbol for logging context
        """
        learning_rate = 0.03  # Conservative update rate
        error = actual_outcome - self.bias_correction
        self.bias_correction += learning_rate * error

        # Clamp bias to reasonable range
        self.bias_correction = max(-0.3, min(0.3, self.bias_correction))

        self.feedback_history.append(actual_outcome)
        if len(self.feedback_history) > 100:
            self.feedback_history = self.feedback_history[-100:]

        logger.info(
            f"[{self.name}] feedback applied"
            + (f" for {symbol}" if symbol else "")
            + f": outcome={actual_outcome:+.2f}, new_bias={self.bias_correction:+.4f}"
        )

    @property
    def bias_calibration_quality(self) -> str:
        """Assess how well calibrated the bias correction is."""
        if len(self.feedback_history) < 10:
            return "insufficient_data"
        recent = self.feedback_history[-20:]
        avg_error = abs(sum(recent) / len(recent) - self.bias_correction)
        if avg_error < 0.05:
            return "well_calibrated"
        elif avg_error < 0.15:
            return "moderate"
        return "needs_recalibration"


# Global singleton
alpha_scout = AlphaScoutAgent()
