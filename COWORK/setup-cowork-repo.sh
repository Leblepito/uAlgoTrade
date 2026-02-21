#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Cowork Monorepo Setup Script
# Bu script, COWORK klasörünü standalone GitHub repo'su olarak
# Leblepito/Cowork'e push eder.
#
# Kullanım:
#   1. GitHub'da "Cowork" adlı boş bir repo oluştur (README ekleme!)
#   2. Bu scripti çalıştır:  bash setup-cowork-repo.sh
# ─────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_NAME="Leblepito/Cowork"
TEMP_DIR="/tmp/Cowork-setup-$$"

echo "==> COWORK klasörünü standalone repo olarak hazırlıyorum..."
mkdir -p "$TEMP_DIR"

# COWORK içeriğini kopyala (.git hariç)
rsync -a --exclude='.git' --exclude='node_modules' --exclude='.next' \
         --exclude='__pycache__' --exclude='.venv' --exclude='.env' \
         --exclude='.env.local' \
         "$SCRIPT_DIR/" "$TEMP_DIR/"

# Setup script'in kendisini repoya dahil etme
rm -f "$TEMP_DIR/setup-cowork-repo.sh"

cd "$TEMP_DIR"

echo "==> Git repo oluşturuluyor..."
git init
git branch -m main
git add -A
git commit -m "feat: initialize Cowork monorepo — consolidate 4 services

Merges cowork-api, cowork-web, cowork-admin, cowork-ai, and Seo-Ads
into a single monorepo with shared docker-compose, PR template,
and unified .env.example.

Services:
- cowork-api (FastAPI, port 8080): auth, bookings, Stripe billing
- cowork-web (Next.js, port 3000): member portal
- cowork-admin (Next.js, port 3001): admin dashboard
- cowork-ai (FastAPI, port 8081): AI recommendations & forecasting
- Seo-Ads (FastAPI, port 8082): AI content engine"

echo "==> GitHub'a push ediliyor..."
git remote add origin "https://github.com/$REPO_NAME.git"
git push -u origin main

echo ""
echo "==> Tamamlandı!"
echo "    https://github.com/$REPO_NAME"
echo ""
echo "Eski ayrı repoları arşivlemek/silmek için:"
echo "  gh repo archive Leblepito/cowork-api"
echo "  gh repo archive Leblepito/cowork-ai"
echo "  gh repo archive Leblepito/cowork-admin"
echo "  gh repo archive Leblepito/cowork-web"

# Temizlik
rm -rf "$TEMP_DIR"
