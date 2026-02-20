# Scripts

Utility scripts for local development setup and database management.

## Key Files

| File | Purpose |
|------|---------|
| `setup-local.sh` | Full local dev environment setup (checks Docker, .NET, Node, Python; runs migrations) |
| `run-migrations.sh` | Runs all PostgreSQL migration files in order against the database |

## Usage

```bash
# First-time setup
bash scripts/setup-local.sh

# Run migrations only
bash scripts/run-migrations.sh
```
