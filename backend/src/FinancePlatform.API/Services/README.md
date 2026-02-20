# Services

Backend service implementations for external integrations and business logic.

## Key Files

| File | Purpose |
|------|---------|
| `AiSidecarClient.cs` | HTTP proxy to Python AI Engine — swarm status, signals, orchestration |
| `AnthropicService.cs` | Claude AI integration — chat with Grandmaster Owl character |
| `TelegramSignalService.cs` | Telegram bot notifications for trading signals |
| `FundingRateService.cs` | Cryptocurrency funding rate data aggregation |
| `CoinalyzeFundingScraper.cs` | Funding rate data scraping |
| `AlertBackgroundService.cs` | Background service for price alert monitoring |
