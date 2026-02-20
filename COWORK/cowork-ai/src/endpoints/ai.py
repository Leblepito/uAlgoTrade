"""AI endpoints — scheduling, occupancy, recommendations."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from src.services.scheduler import smart_scheduler
from src.services.recommender import recommender

router = APIRouter(prefix="/ai", tags=["ai"])


class SlotQuery(BaseModel):
    date: str  # ISO date YYYY-MM-DD
    duration_hours: int = 2
    top_n: int = 5


class ForecastQuery(BaseModel):
    from_date: str  # ISO date YYYY-MM-DD


class RecommendQuery(BaseModel):
    user_id: str
    booking_history: list[dict] = []


@router.post("/slots/recommend")
async def recommend_slots(query: SlotQuery) -> dict:
    """Get top low-occupancy time slots for a given date."""
    dt = datetime.fromisoformat(query.date)
    slots = smart_scheduler.recommend_slots(dt, query.duration_hours, query.top_n)
    return {"date": query.date, "slots": slots}


@router.post("/occupancy/forecast")
async def occupancy_forecast(query: ForecastQuery) -> dict:
    """7-day occupancy forecast from a given start date."""
    dt = datetime.fromisoformat(query.from_date)
    forecast = smart_scheduler.weekly_forecast(dt)
    return {"from_date": query.from_date, "forecast": forecast}


@router.get("/occupancy/now")
async def occupancy_now() -> dict:
    """Current predicted occupancy rate."""
    now = datetime.now()
    rate = smart_scheduler.predict_occupancy(now)
    return {
        "timestamp": now.isoformat(),
        "occupancy_rate": round(rate, 2),
        "status": smart_scheduler._label(rate),
    }


@router.post("/spaces/recommend")
async def recommend_space(query: RecommendQuery) -> dict:
    """Recommend a space type for a member based on their booking history."""
    rec = recommender.recommend(query.user_id, query.booking_history)
    rec["amenities"] = recommender.suggest_amenities(rec["recommended_type"])
    return rec


@router.get("/insights/peak-hours")
async def peak_hours() -> dict:
    """Return typical peak and quiet hours for planning."""
    today = datetime.now()
    hours = []
    for h in range(7, 22):
        dt = today.replace(hour=h)
        rate = smart_scheduler.predict_occupancy(dt)
        hours.append({"hour": h, "label": f"{h:02d}:00", "occupancy": round(rate, 2), "status": smart_scheduler._label(rate)})
    peak = [h for h in hours if h["occupancy"] > 0.75]
    quiet = [h for h in hours if h["occupancy"] < 0.35]
    return {"weekday": today.strftime("%A"), "peak_hours": peak, "quiet_hours": quiet, "all_hours": hours}
