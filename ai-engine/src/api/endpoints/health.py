"""Health check endpoint."""

from fastapi import APIRouter

from src.services.db import db_pool

router = APIRouter()


@router.get("/ping")
async def ping():
    return {"pong": True}


@router.get("/readiness")
async def readiness():
    try:
        if db_pool.pool:
            await db_pool.fetchval("SELECT 1")
            return {"ready": True, "database": "ok"}
    except Exception:
        pass
    return {"ready": False, "database": "unavailable"}
