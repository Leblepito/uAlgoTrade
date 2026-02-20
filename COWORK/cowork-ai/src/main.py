"""COWORK AI Service — Smart scheduling & space recommendations."""
from __future__ import annotations
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.endpoints.ai import router as ai_router

app = FastAPI(
    title="COWORK AI",
    version="1.0.0",
    description="Smart scheduling, occupancy prediction, and space recommendations for COWORK.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "healthy", "service": "cowork-ai", "version": "1.0.0"}


@app.get("/", tags=["system"])
async def root():
    return {
        "service": "COWORK AI",
        "endpoints": {
            "recommend_slots": "POST /ai/slots/recommend",
            "occupancy_forecast": "POST /ai/occupancy/forecast",
            "occupancy_now": "GET /ai/occupancy/now",
            "recommend_space": "POST /ai/spaces/recommend",
            "peak_hours": "GET /ai/insights/peak-hours",
        },
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8081"))
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=True)
