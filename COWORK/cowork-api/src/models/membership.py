"""Membership / subscription model."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Enum as SAEnum, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from src.models.base import Base, TimestampMixin, new_uuid


class MembershipPlan(str, enum.Enum):
    FREE = "free"
    HOT_DESK = "hot_desk"           # Pay-per-use hot desk access
    DEDICATED = "dedicated"          # Fixed desk, monthly
    PRIVATE_OFFICE = "private_office"  # Private office, monthly


class MembershipStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Membership(Base, TimestampMixin):
    __tablename__ = "memberships"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    plan: Mapped[MembershipPlan] = mapped_column(SAEnum(MembershipPlan), default=MembershipPlan.FREE)
    status: Mapped[MembershipStatus] = mapped_column(SAEnum(MembershipStatus), default=MembershipStatus.ACTIVE)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    stripe_price_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship(back_populates="memberships")
