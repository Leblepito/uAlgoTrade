"""AI-powered smart scheduling and occupancy prediction."""
from __future__ import annotations
import random
from datetime import datetime, timedelta


class SmartScheduler:
    """Recommends optimal booking times based on historical patterns."""

    # Simulated occupancy profiles per hour (0-23) for each day type
    _WEEKDAY_PROFILE = [0.05, 0.02, 0.01, 0.01, 0.02, 0.08, 0.35, 0.70,
                         0.90, 0.95, 0.92, 0.85, 0.75, 0.80, 0.88, 0.82,
                         0.70, 0.55, 0.35, 0.20, 0.12, 0.08, 0.05, 0.03]
    _WEEKEND_PROFILE = [0.02, 0.01, 0.01, 0.01, 0.01, 0.02, 0.05, 0.15,
                         0.30, 0.45, 0.55, 0.60, 0.58, 0.55, 0.50, 0.42,
                         0.30, 0.20, 0.12, 0.08, 0.05, 0.03, 0.02, 0.01]

    def predict_occupancy(self, dt: datetime) -> float:
        """Predict occupancy rate (0.0–1.0) at a given datetime."""
        profile = self._WEEKDAY_PROFILE if dt.weekday() < 5 else self._WEEKEND_PROFILE
        base = profile[dt.hour]
        noise = random.gauss(0, 0.03)
        return max(0.0, min(1.0, base + noise))

    def recommend_slots(self, date: datetime, duration_hours: int = 2, top_n: int = 5) -> list[dict]:
        """Return top N low-occupancy slots on a given date."""
        slots = []
        start = date.replace(hour=7, minute=0, second=0, microsecond=0)
        end = date.replace(hour=21, minute=0, second=0, microsecond=0)
        current = start
        while current + timedelta(hours=duration_hours) <= end:
            occupancy = self.predict_occupancy(current)
            slots.append({
                "start": current.isoformat(),
                "end": (current + timedelta(hours=duration_hours)).isoformat(),
                "occupancy_rate": round(occupancy, 2),
                "recommendation_score": round(1 - occupancy, 2),
                "label": self._label(occupancy),
            })
            current += timedelta(minutes=30)
        slots.sort(key=lambda s: s["recommendation_score"], reverse=True)
        return slots[:top_n]

    def weekly_forecast(self, from_date: datetime) -> list[dict]:
        """7-day occupancy forecast."""
        result = []
        for i in range(7):
            day = from_date + timedelta(days=i)
            avg = sum(self.predict_occupancy(day.replace(hour=h)) for h in range(8, 20)) / 12
            result.append({
                "date": day.strftime("%Y-%m-%d"),
                "weekday": day.strftime("%A"),
                "predicted_occupancy": round(avg, 2),
                "busy": avg > 0.70,
            })
        return result

    @staticmethod
    def _label(occupancy: float) -> str:
        if occupancy < 0.3: return "quiet"
        if occupancy < 0.6: return "moderate"
        if occupancy < 0.85: return "busy"
        return "very_busy"


smart_scheduler = SmartScheduler()
