"""API router — aggregates all endpoint modules."""

from fastapi import APIRouter

from src.api.endpoints import agents, health, optimization, orchestrator, signals, ws

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(signals.router, prefix="/signals", tags=["signals"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(orchestrator.router, prefix="/orchestrate", tags=["orchestrator"])
api_router.include_router(optimization.router, prefix="/optimize", tags=["optimization"])
api_router.include_router(ws.router, tags=["websocket"])
