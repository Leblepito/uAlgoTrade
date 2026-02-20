# Frontend — Next.js 16 Trading Dashboard

The main trading interface built with Next.js 16, TypeScript, and Tailwind CSS.

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Home/landing page |
| `app/swarm/page.tsx` | AI Swarm dashboard — agent status, topology, signals |
| `app/signals/page.tsx` | Signal history with status filters |
| `app/portfolio/page.tsx` | Portfolio performance tracker |
| `app/performance/page.tsx` | 90-day performance analysis |
| `app/backtest/page.tsx` | Strategy backtesting interface |
| `app/indicators/page.tsx` | Technical indicators view |
| `app/auth/page.tsx` | Login/registration |
| `lib/swarm.ts` | API client for swarm endpoints |
| `types/swarm.ts` | TypeScript type definitions for swarm data |
| `Dockerfile` | Next.js production container |
| `railway.toml` | Railway deployment config |

## Components

### AI Swarm Components (New)
| Component | Purpose |
|-----------|---------|
| `AgentStatusCard.tsx` | Agent status display with icon and heartbeat |
| `SignalFeed.tsx` | Signal list with direction badges and confidence |
| `RiskGauge.tsx` | Risk level gauge with kill switch alert |
| `PortfolioSummary.tsx` | Portfolio value, PnL, win rate stats |
| `SwarmTopology.tsx` | Visual agent hierarchy diagram |
| `EquityCurveLarge.tsx` | SVG equity curve chart |

### Existing Components
| Component | Purpose |
|-----------|---------|
| `Navbar.tsx` | Navigation bar with all page links |
| `TradingChart.tsx` | TradingView-style candlestick chart |
| `IndicatorPanel.tsx` | Indicator selection and display |
| And 16+ more... | See `components/` folder |

## Local Development

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:8080`) |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth` | Login / Register |
| `/swarm` | AI Agent Swarm Dashboard |
| `/signals` | Signal History |
| `/portfolio` | Portfolio Performance |
| `/performance` | 90-Day Analysis |
| `/backtest` | Strategy Backtesting |
| `/indicators` | Technical Indicators |
| `/data` | Market Data |
| `/education` | Trading Education |
| `/pricing` | Subscription Plans |
