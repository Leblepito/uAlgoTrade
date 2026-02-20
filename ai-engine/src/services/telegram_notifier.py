"""Telegram notification service for trade alerts."""

import logging

import httpx

from src.config import settings

logger = logging.getLogger(__name__)


async def send_alert(message: str):
    """Send a message to the configured Telegram chat."""
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        logger.debug("Telegram not configured, skipping alert")
        return

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    payload = {
        "chat_id": settings.telegram_chat_id,
        "text": message,
        "parse_mode": "HTML",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            logger.info("Telegram alert sent successfully")
    except Exception as e:
        logger.error(f"Failed to send Telegram alert: {e}")


async def send_signal_alert(signal: dict):
    """Format and send a trading signal alert."""
    direction_emoji = "🟢" if signal.get("direction") == "LONG" else "🔴"

    message = (
        f"{direction_emoji} <b>New Signal: {signal.get('symbol', 'N/A')}</b>\n"
        f"Direction: {signal.get('direction', 'N/A')}\n"
        f"Confidence: {signal.get('confidence', 0):.1%}\n"
        f"Entry: {signal.get('entry_price', 'N/A')}\n"
        f"Stop Loss: {signal.get('stop_loss', 'N/A')}\n"
        f"Take Profit: {signal.get('take_profit', 'N/A')}\n"
        f"R:R: {signal.get('risk_reward', 'N/A')}\n"
        f"Source: {signal.get('source_agent', 'orchestrator')}"
    )

    await send_alert(message)
