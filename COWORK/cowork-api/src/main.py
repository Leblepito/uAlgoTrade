"""COWORK API — FastAPI entry point."""
from __future__ import annotations
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.db.session import engine
from src.models.base import Base
import src.models.blog_post  # noqa: F401 — register BlogPost table
from src.routers import auth, spaces, bookings, stripe_billing, blog


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="COWORK API",
    version="1.0.0",
    description="Coworking space management platform API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, settings.admin_url, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(spaces.router)
app.include_router(bookings.router)
app.include_router(stripe_billing.router)
app.include_router(blog.router)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "healthy", "service": "cowork-api", "version": "1.0.0"}


@app.get("/", tags=["system"])
async def root():
    return {
        "service": "COWORK API",
        "docs": "/docs",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=True)
