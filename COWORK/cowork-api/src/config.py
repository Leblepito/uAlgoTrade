"""Application configuration."""
from __future__ import annotations
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    environment: str = "development"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    frontend_url: str = "http://localhost:3000"
    admin_url: str = "http://localhost:3001"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cowork"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_hot_desk_price_id: str = ""
    stripe_dedicated_price_id: str = ""
    stripe_private_office_price_id: str = ""

    # Email
    smtp_host: str = "smtp.sendgrid.net"
    smtp_port: int = 587
    smtp_user: str = "apikey"
    smtp_password: str = ""
    email_from: str = "noreply@cowork.com"

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
