#!/usr/bin/env bash
# start-test-stand.sh — запускает dev-сервер тестового стенда
#
# Использование:
#   npm run dev:test
#   bash scripts/start-test-stand.sh
#
# Сервер стартует на порту 3001, использует blog.test.db
# Dev-окружение (порт 3000, blog.db) не затрагивается.
#
# Перед первым запуском выполни сброс БД:
#   npm run test:reset

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f ".env.test" ]; then
  echo "❌ Файл .env.test не найден"
  echo "   Он должен быть в корне проекта рядом с .env.local"
  exit 1
fi

echo "🧪 Запускаю тестовый стенд (порт 3001, blog.test.db)..."

# Загружаем .env.test и запускаем Next.js на порту 3001
set -a
# shellcheck source=../.env.test
source .env.test
set +a

exec npx next dev -p 3001
