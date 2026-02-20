"""Async PostgreSQL connection pool using asyncpg."""

import asyncpg


class DatabasePool:
    """Manages an asyncpg connection pool."""

    def __init__(self):
        self.pool: asyncpg.Pool | None = None

    async def connect(self, dsn: str, min_size: int = 2, max_size: int = 10):
        self.pool = await asyncpg.create_pool(dsn, min_size=min_size, max_size=max_size)

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def fetch(self, query: str, *args) -> list[asyncpg.Record]:
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def fetchrow(self, query: str, *args) -> asyncpg.Record | None:
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def fetchval(self, query: str, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, *args)

    async def execute(self, query: str, *args) -> str:
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)


db_pool = DatabasePool()
