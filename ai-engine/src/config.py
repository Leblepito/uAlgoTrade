"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/ukeytr"

    # Service
    app_name: str = "uKeyTr AI Engine"
    debug: bool = False
    log_level: str = "INFO"

    # Binance
    binance_api_key: str = ""
    binance_api_secret: str = ""
    binance_ws_url: str = "wss://stream.binance.com:9443/ws"

    # Telegram
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    # Agent defaults
    default_symbols: list[str] = ["BTCUSDT", "ETHUSDT"]
    default_timeframes: list[str] = ["1h", "4h"]
    scan_interval_seconds: int = 60
    risk_check_interval_seconds: int = 5

    # Thresholds
    min_consensus_confidence: float = 0.7
    max_risk_per_trade: float = 0.02
    kill_switch_drawdown: float = 0.05

    # Extended risk controls (sourced from AAnti Trading Agent spec)
    max_daily_trades: int = 10
    cool_down_after_loss_seconds: int = 3600
    max_single_asset_ratio: float = 0.25
    max_position_correlation: float = 0.7

    model_config = {"env_prefix": "U2ALGO_", "env_file": ".env"}


settings = Settings()
