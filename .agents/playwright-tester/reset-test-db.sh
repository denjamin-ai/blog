#!/usr/bin/env bash
# reset-test-db.sh — сбрасывает blog.test.db до начального seed-состояния
#
# Использование:
#   npm run test:reset
#   bash .agents/playwright-tester/reset-test-db.sh
#   bash .agents/playwright-tester/reset-test-db.sh --no-seed
#
# ⚠️  Только тестовая БД (blog.test.db). blog.db НЕ ТРОГАЕТСЯ.

set -euo pipefail

cd "$(dirname "$0")/../.."

NO_SEED="${1:-}"

echo "🗑️  Удаляю blog.test.db..."
rm -f blog.test.db blog.test.db-shm blog.test.db-wal

echo "📦 Применяю миграции к blog.test.db..."
TURSO_CONNECTION_URL=file:blog.test.db npx drizzle-kit migrate 2>&1 | tail -5

if [ "$NO_SEED" != "--no-seed" ]; then
  echo "🌱 Запускаю тестовый seed..."
  TURSO_CONNECTION_URL=file:blog.test.db npm run seed:test 2>&1 | tail -20
  echo ""
  echo "✅ blog.test.db сброшена и заполнена"
  echo "   Аккаунты: reader/password · author/password · reviewer/password"
else
  echo "✅ blog.test.db сброшена (seed пропущен)"
fi
