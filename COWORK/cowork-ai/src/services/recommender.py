"""Member space recommender based on usage patterns."""
from __future__ import annotations
import random


SPACE_TYPES = ["hot_desk", "dedicated_desk", "private_office", "meeting_room"]

USAGE_PROFILES = {
    "solo_freelancer": {"hot_desk": 0.6, "dedicated_desk": 0.3, "private_office": 0.05, "meeting_room": 0.05},
    "remote_employee": {"hot_desk": 0.3, "dedicated_desk": 0.5, "private_office": 0.15, "meeting_room": 0.05},
    "startup_team": {"hot_desk": 0.1, "dedicated_desk": 0.2, "private_office": 0.5, "meeting_room": 0.2},
    "consultant": {"hot_desk": 0.2, "dedicated_desk": 0.3, "private_office": 0.1, "meeting_room": 0.4},
}


class SpaceRecommender:
    def recommend(self, user_id: str, booking_history: list[dict]) -> dict:
        """Recommend best space type based on booking history."""
        if not booking_history:
            return {"recommended_type": "hot_desk", "confidence": 0.5, "reason": "No history — start with a hot desk"}

        type_counts: dict[str, int] = {}
        for b in booking_history:
            t = b.get("space_type", "hot_desk")
            type_counts[t] = type_counts.get(t, 0) + 1

        total = sum(type_counts.values())
        top_type = max(type_counts, key=type_counts.get)  # type: ignore[arg-type]
        confidence = round(type_counts[top_type] / total, 2)

        upgrades = {"hot_desk": "dedicated_desk", "dedicated_desk": "private_office"}
        if confidence > 0.6 and top_type in upgrades:
            recommended = upgrades[top_type]
            reason = f"You use {top_type} {int(confidence*100)}% of the time — consider upgrading to {recommended}"
        else:
            recommended = top_type
            reason = f"Based on your booking history ({int(confidence*100)}% {top_type})"

        return {"recommended_type": recommended, "confidence": confidence, "reason": reason, "history_count": total}

    def suggest_amenities(self, space_type: str) -> list[str]:
        amenities_map = {
            "hot_desk": ["High-speed Wi-Fi", "Ergonomic chair", "Locker", "Coffee"],
            "dedicated_desk": ["Standing desk", "Monitor", "Private storage", "Priority printing"],
            "private_office": ["Conference phone", "Whiteboard", "24/7 access", "Mail handling"],
            "meeting_room": ["Video conferencing", "HDMI display", "Whiteboard", "Catering available"],
        }
        return amenities_map.get(space_type, ["Wi-Fi", "Desk", "Coffee"])


recommender = SpaceRecommender()
