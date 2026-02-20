"""Space and desk models."""
from __future__ import annotations
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Enum as SAEnum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from src.models.base import Base, TimestampMixin, new_uuid


class SpaceType(str, enum.Enum):
    HOT_DESK = "hot_desk"
    DEDICATED_DESK = "dedicated_desk"
    PRIVATE_OFFICE = "private_office"
    MEETING_ROOM = "meeting_room"
    EVENT_SPACE = "event_space"


class Space(Base, TimestampMixin):
    __tablename__ = "spaces"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[SpaceType] = mapped_column(SAEnum(SpaceType), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, default=1)
    floor: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    area_sqm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    daily_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    monthly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    amenities: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    images: Mapped[Optional[str]] = mapped_column(Text, nullable=True)     # JSON array

    bookings: Mapped[list["Booking"]] = relationship(back_populates="space")
