#!/usr/bin/env bash
# =============================================================================
# setup-local.sh — Local development environment setup
# =============================================================================
set -euo pipefail

echo "=== uKeyTr Local Setup ==="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Error: docker is required"; exit 1; }
command -v dotnet >/dev/null 2>&1 || { echo "Error: dotnet SDK is required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Error: node.js is required"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Warning: python3 not found, ai-engine will only run via Docker"; }

# Create .env from example if not exists
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example — please edit with your values"
  else
    echo "Warning: .env.example not found"
  fi
fi

# Start PostgreSQL via Docker
echo ""
echo "Starting PostgreSQL..."
docker compose up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "PostgreSQL is ready"
    break
  fi
  sleep 1
done

# Run migrations
echo ""
echo "Running database migrations..."
bash scripts/run-migrations.sh

# Install backend dependencies
echo ""
echo "Restoring .NET packages..."
dotnet restore backend/FinancePlatform.sln

# Install frontend dependencies
echo ""
echo "Installing frontend packages..."
cd frontend && npm ci && cd ..

# Install AI engine dependencies (if Python available)
if command -v python3 >/dev/null 2>&1; then
  echo ""
  echo "Installing AI engine packages..."
  cd ai-engine && pip install -e ".[dev]" && cd ..
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "To start all services: docker compose up"
echo "Or run individually:"
echo "  Backend:    cd backend && dotnet run --project src/FinancePlatform.API"
echo "  Frontend:   cd frontend && npm run dev"
echo "  AI Engine:  cd ai-engine && uvicorn src.main:app --reload --port 8000"
