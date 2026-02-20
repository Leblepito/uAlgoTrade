"""Booking endpoints."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_session
from src.services.booking_service import BookingService
from src.core.deps import get_current_user
from src.models.user import User

router = APIRouter(prefix="/bookings", tags=["bookings"])


class BookingCreate(BaseModel):
    space_id: str
    start_at: datetime
    end_at: datetime
    notes: Optional[str] = None


class BookingOut(BaseModel):
    id: str
    space_id: str
    user_id: str
    start_at: datetime
    end_at: datetime
    status: str
    total_price: float
    notes: Optional[str]
    check_in_at: Optional[datetime]
    check_out_at: Optional[datetime]
    model_config = {"from_attributes": True}


@router.post("/", response_model=BookingOut, status_code=201)
async def create_booking(
    body: BookingCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    svc = BookingService(session)
    try:
        return await svc.create(user.id, body.space_id, body.start_at, body.end_at, body.notes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/my", response_model=list[BookingOut])
async def my_bookings(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    svc = BookingService(session)
    return await svc.get_user_bookings(user.id)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(
    booking_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    svc = BookingService(session)
    try:
        return await svc.cancel(booking_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{booking_id}/check-in", response_model=BookingOut)
async def check_in(booking_id: str, session: AsyncSession = Depends(get_session)):
    svc = BookingService(session)
    try:
        return await svc.check_in(booking_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{booking_id}/check-out", response_model=BookingOut)
async def check_out(booking_id: str, session: AsyncSession = Depends(get_session)):
    svc = BookingService(session)
    try:
        return await svc.check_out(booking_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
