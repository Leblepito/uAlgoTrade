"""uKeyTr AI Engine — FastAPI entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.router import api_router
from src.config import settings
from src.services.db import db_pool
from src.tasks.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown hooks."""
    await db_pool.connect(settings.database_url)
    start_scheduler()
    yield
    stop_scheduler()
    await db_pool.disconnect()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(api_router)


@app.get("/health")
async def health():
    pool_ok = db_pool.pool is not None
    return {
        "status": "healthy" if pool_ok else "degraded",
        "service": "ai-engine",
        "database": "connected" if pool_ok else "disconnected",
    }
