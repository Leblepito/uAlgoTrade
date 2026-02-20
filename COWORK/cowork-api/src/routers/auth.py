"""Auth endpoints — register, login, refresh, me."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_session
from src.services.user_service import UserService
from src.core.security import create_access_token, create_refresh_token
from src.core.deps import get_current_user
from src.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterBody(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    language: str = "en"


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterBody, session: AsyncSession = Depends(get_session)):
    svc = UserService(session)
    if await svc.get_by_email(body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await svc.create(body.email, body.full_name, body.password, body.language)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginBody, session: AsyncSession = Depends(get_session)):
    svc = UserService(session)
    user = await svc.authenticate(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_verified": user.is_verified,
        "preferred_language": user.preferred_language,
        "avatar_url": user.avatar_url,
    }
