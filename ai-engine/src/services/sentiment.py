"""Sentiment analysis service — RSS/NLP processing engine."""

import logging

import feedparser
from textblob import TextBlob

logger = logging.getLogger(__name__)


async def fetch_feed_articles(feed_url: str, max_entries: int = 10) -> list[dict]:
    """Parse an RSS feed and return article summaries."""
    try:
        feed = feedparser.parse(feed_url)
        articles = []
        for entry in feed.entries[:max_entries]:
            articles.append({
                "title": entry.get("title", ""),
                "summary": entry.get("summary", ""),
                "link": entry.get("link", ""),
                "published": entry.get("published", ""),
            })
        return articles
    except Exception as e:
        logger.error(f"Failed to parse feed {feed_url}: {e}")
        return []


def analyze_sentiment(text: str) -> dict:
    """Analyze text sentiment using TextBlob.

    Returns:
        dict with 'polarity' (-1 to 1), 'subjectivity' (0 to 1), 'label'
    """
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    if polarity > 0.1:
        label = "positive"
    elif polarity < -0.1:
        label = "negative"
    else:
        label = "neutral"

    return {
        "polarity": round(polarity, 4),
        "subjectivity": round(subjectivity, 4),
        "label": label,
    }
