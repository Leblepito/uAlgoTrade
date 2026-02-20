"""Space CRUD service."""
from __future__ import annotations
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.space import Space, SpaceType


class SpaceService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_all(self, space_type: Optional[SpaceType] = None, available_only: bool = False) -> list[Space]:
        query = select(Space)
        if space_type:
            query = query.where(Space.type == space_type)
        if available_only:
            query = query.where(Space.is_available == True)
        result = await self.session.execute(query.order_by(Space.name))
        return list(result.scalars().all())

    async def get_by_id(self, space_id: str) -> Optional[Space]:
        result = await self.session.execute(select(Space).where(Space.id == space_id))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Space:
        space = Space(**kwargs)
        self.session.add(space)
        await self.session.commit()
        await self.session.refresh(space)
        return space

    async def update(self, space_id: str, **kwargs) -> Optional[Space]:
        space = await self.get_by_id(space_id)
        if not space:
            return None
        for k, v in kwargs.items():
            setattr(space, k, v)
        await self.session.commit()
        return space

    async def delete(self, space_id: str) -> bool:
        space = await self.get_by_id(space_id)
        if not space:
            return False
        await self.session.delete(space)
        await self.session.commit()
        return True
