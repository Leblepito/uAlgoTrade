#!/usr/bin/env bash
# =============================================================================
# run-migrations.sh — Execute PostgreSQL migrations in order
# =============================================================================
set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ukeytr}"
DB_USER="${DB_USER:-postgres}"

MIGRATION_DIR="$(cd "$(dirname "$0")/../database/postgres" && pwd)"

echo "=== uKeyTr Database Migration ==="
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo "Migration dir: $MIGRATION_DIR"
echo ""

# Find and sort all .sql files
for sql_file in $(ls "$MIGRATION_DIR"/*.sql | sort); do
  filename=$(basename "$sql_file")
  echo "▶ Running: $filename"
  PGPASSWORD="${DB_PASSWORD:-}" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$sql_file" \
    --set ON_ERROR_STOP=on \
    -q
  echo "  ✓ $filename applied"
done

echo ""
echo "=== All migrations applied successfully ==="
