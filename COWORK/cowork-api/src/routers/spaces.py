"""Space endpoints."""
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_session
from src.services.space_service import SpaceService
from src.models.space import SpaceType
from src.core.deps import require_admin

router = APIRouter(prefix="/spaces", tags=["spaces"])


class SpaceOut(BaseModel):
    id: str
    name: str
    type: str
    description: Optional[str]
    capacity: int
    floor: Optional[int]
    area_sqm: Optional[float]
    hourly_rate: Optional[float]
    daily_rate: Optional[float]
    monthly_rate: Optional[float]
    is_available: bool
    amenities: Optional[str]
    images: Optional[str]
    model_config = {"from_attributes": True}


class SpaceCreate(BaseModel):
    name: str
    type: SpaceType
    description: Optional[str] = None
    capacity: int = 1
    floor: Optional[int] = None
    area_sqm: Optional[float] = None
    hourly_rate: Optional[float] = None
    daily_rate: Optional[float] = None
    monthly_rate: Optional[float] = None
    amenities: Optional[str] = None
    images: Optional[str] = None


@router.get("/", response_model=list[SpaceOut])
async def list_spaces(
    type: Optional[SpaceType] = None,
    available_only: bool = False,
    session: AsyncSession = Depends(get_session),
):
    svc = SpaceService(session)
    return await svc.list_all(space_type=type, available_only=available_only)


@router.get("/{space_id}", response_model=SpaceOut)
async def get_space(space_id: str, session: AsyncSession = Depends(get_session)):
    svc = SpaceService(session)
    space = await svc.get_by_id(space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space


@router.post("/", response_model=SpaceOut, status_code=201)
async def create_space(
    body: SpaceCreate,
    session: AsyncSession = Depends(get_session),
    _: object = Depends(require_admin),
):
    svc = SpaceService(session)
    return await svc.create(**body.model_dump())


@router.patch("/{space_id}", response_model=SpaceOut)
async def update_space(
    space_id: str,
    body: SpaceCreate,
    session: AsyncSession = Depends(get_session),
    _: object = Depends(require_admin),
):
    svc = SpaceService(session)
    space = await svc.update(space_id, **body.model_dump(exclude_unset=True))
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space


@router.delete("/{space_id}", status_code=204)
async def delete_space(
    space_id: str,
    session: AsyncSession = Depends(get_session),
    _: object = Depends(require_admin),
):
    svc = SpaceService(session)
    if not await svc.delete(space_id):
        raise HTTPException(status_code=404, detail="Space not found")
