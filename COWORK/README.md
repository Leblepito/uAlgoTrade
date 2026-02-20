# COWORK — Modern Coworking Space Management Platform

Production-ready, multi-service coworking management system built for Railway deployment.

## Architecture

```
COWORK/
├── cowork-api/        FastAPI backend (auth, bookings, billing, Stripe)
├── cowork-web/        Next.js 14 member portal (booking, dashboard)
├── cowork-admin/      Next.js 14 admin dashboard (analytics, management)
├── cowork-ai/         AI scheduling & occupancy prediction service
└── docker-compose.yml Full local stack
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| cowork-api | 8080 | REST API, JWT auth, Stripe billing |
| cowork-web | 3000 | Member portal — booking & dashboard |
| cowork-admin | 3001 | Admin panel — analytics & management |
| cowork-ai | 8081 | AI recommendations & occupancy forecast |

## Quick Start (Docker)

```bash
cp cowork-api/.env.example cowork-api/.env
docker-compose up --build
```

Then open:
- Member portal: http://localhost:3000
- Admin panel: http://localhost:3001
- API docs: http://localhost:8080/docs
- AI service: http://localhost:8081/docs

## Deploy to Railway (separate repos)

Each service is self-contained and ready to deploy as its own Railway service.

1. Create a Railway project
2. Add a service for each folder (cowork-api, cowork-web, cowork-admin, cowork-ai)
3. Set environment variables from each service's `.env.example`
4. Add a PostgreSQL plugin and wire `DATABASE_URL` to cowork-api

## Features

- JWT authentication with refresh tokens
- Space management (hot desk, dedicated, private office, meeting room)
- Real-time availability checking
- Stripe subscription billing (checkout + billing portal + webhooks)
- Check-in / check-out tracking
- Admin analytics dashboard with charts
- AI-powered slot recommendations
- 7-day occupancy forecasting
- Member space type recommendations
