"""WebSocket endpoint — streams real-time agent events to the .NET backend."""

import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from src.core.message_bus import message_bus, AgentMessage

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])

# Connected WebSocket clients (backend instances)
_ws_clients: set[WebSocket] = set()


async def _on_agent_event(msg: AgentMessage):
    """Forward every MessageBus event to connected WebSocket clients."""
    if not _ws_clients:
        return
    payload = json.dumps({
        "type": f"agent:{msg.topic}",
        "data": {
            "sender": msg.sender,
            "topic": msg.topic,
            "payload": msg.payload,
            "timestamp": msg.timestamp.isoformat(),
            "priority": msg.priority,
        },
    })
    dead: list[WebSocket] = []
    for ws in list(_ws_clients):
        try:
            await ws.send_text(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _ws_clients.discard(ws)


# Subscribe to all interesting topics
_subscribed = False


def _ensure_subscribed():
    global _subscribed
    if _subscribed:
        return
    for topic in (
        "signal",
        "heartbeat",
        "scan_result",
        "consensus",
        "risk_alert",
        "kill_switch",
        "optimization",
        "agent_status",
    ):
        message_bus.subscribe(topic, _on_agent_event)
    _subscribed = True


@router.websocket("/ws/events")
async def ws_events(ws: WebSocket):
    """
    WebSocket endpoint that streams AI agent events.

    The .NET backend connects here to receive real-time updates,
    then re-broadcasts to frontend clients via its own WebSocket hub.
    """
    await ws.accept()
    _ensure_subscribed()
    _ws_clients.add(ws)
    logger.info("WebSocket client connected (total: %d)", len(_ws_clients))

    try:
        # Send initial hello
        await ws.send_json({
            "type": "connected",
            "service": "ai-engine",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Keep alive loop — also handles client pings
        while True:
            try:
                data = await asyncio.wait_for(ws.receive_text(), timeout=30.0)
                # Client can send ping or subscribe commands
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await ws.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
            except asyncio.TimeoutError:
                # No message in 30s — send a keep-alive ping
                try:
                    await ws.send_json({"type": "ping", "timestamp": datetime.now(timezone.utc).isoformat()})
                except Exception:
                    break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning("WebSocket error: %s", e)
    finally:
        _ws_clients.discard(ws)
        logger.info("WebSocket client disconnected (total: %d)", len(_ws_clients))
