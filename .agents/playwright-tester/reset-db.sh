#!/usr/bin/env bash
# reset-db.sh — сбрасывает БД до состояния после seed
# Удаляет blog.db (и WAL/SHM), применяет миграции, запускает seed
#
# Использование:
#   ./reset-db.sh            # полный сброс + seed
#   ./reset-db.sh --no-seed  # только сброс + миграции (без seed)
#
# ⚠️  Все данные будут потеряны. Запускай только в dev-среде.

set -euo pipefail

cd "$(dirname "$0")/../.."  # корень проекта

NO_SEED="${1:-}"

echo "🗑️  Удаляю blog.db..."
rm -f blog.db blog.db-shm blog.db-wal

echo "📦 Применяю миграции..."
npx drizzle-kit migrate 2>&1 | tail -5

if [ "$NO_SEED" != "--no-seed" ]; then
  echo "🌱 Запускаю seed..."
  npm run seed 2>&1 | tail -10
  echo "✅ БД сброшена и заполнена"
else
  echo "✅ БД сброшена (seed пропущен)"
fi
