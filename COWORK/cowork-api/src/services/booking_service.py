"""Booking CRUD and availability service."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.booking import Booking, BookingStatus
from src.models.space import Space


class BookingService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def check_availability(self, space_id: str, start_at: datetime, end_at: datetime, exclude_id: Optional[str] = None) -> bool:
        """Return True if space is available for the given time range."""
        query = select(Booking).where(
            and_(
                Booking.space_id == space_id,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
                or_(
                    and_(Booking.start_at <= start_at, Booking.end_at > start_at),
                    and_(Booking.start_at < end_at, Booking.end_at >= end_at),
                    and_(Booking.start_at >= start_at, Booking.end_at <= end_at),
                ),
            )
        )
        if exclude_id:
            query = query.where(Booking.id != exclude_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none() is None

    async def create(self, user_id: str, space_id: str, start_at: datetime, end_at: datetime, notes: Optional[str] = None) -> Booking:
        space_result = await self.session.execute(select(Space).where(Space.id == space_id))
        space = space_result.scalar_one_or_none()
        if not space:
            raise ValueError("Space not found")

        available = await self.check_availability(space_id, start_at, end_at)
        if not available:
            raise ValueError("Space not available for the selected time")

        hours = (end_at - start_at).total_seconds() / 3600
        total_price = (space.hourly_rate or 0) * hours

        booking = Booking(
            user_id=user_id,
            space_id=space_id,
            start_at=start_at,
            end_at=end_at,
            total_price=total_price,
            notes=notes,
            status=BookingStatus.CONFIRMED,
        )
        self.session.add(booking)
        await self.session.commit()
        await self.session.refresh(booking)
        return booking

    async def get_user_bookings(self, user_id: str) -> list[Booking]:
        result = await self.session.execute(
            select(Booking).where(Booking.user_id == user_id).order_by(Booking.start_at.desc())
        )
        return list(result.scalars().all())

    async def cancel(self, booking_id: str, user_id: str) -> Booking:
        result = await self.session.execute(
            select(Booking).where(and_(Booking.id == booking_id, Booking.user_id == user_id))
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise ValueError("Booking not found")
        booking.status = BookingStatus.CANCELLED
        await self.session.commit()
        return booking

    async def check_in(self, booking_id: str) -> Booking:
        result = await self.session.execute(select(Booking).where(Booking.id == booking_id))
        booking = result.scalar_one_or_none()
        if not booking:
            raise ValueError("Booking not found")
        booking.status = BookingStatus.CHECKED_IN
        booking.check_in_at = datetime.utcnow()
        await self.session.commit()
        return booking

    async def check_out(self, booking_id: str) -> Booking:
        result = await self.session.execute(select(Booking).where(Booking.id == booking_id))
        booking = result.scalar_one_or_none()
        if not booking:
            raise ValueError("Booking not found")
        booking.status = BookingStatus.CHECKED_OUT
        booking.check_out_at = datetime.utcnow()
        await self.session.commit()
        return booking
