#!/usr/bin/env bash
# healthcheck.sh — ждёт готовности dev-сервера
# Использование:
#   ./healthcheck.sh                    # ждёт до 60 сек, URL по умолчанию
#   ./healthcheck.sh 120 http://localhost:3001
#
# Выход: 0 = сервер ответил 200, 1 = таймаут

MAX_WAIT="${1:-60}"
URL="${2:-http://localhost:3000}"
INTERVAL=3

echo "⏳ Ожидаю $URL (макс ${MAX_WAIT}с, интервал ${INTERVAL}с)..."

elapsed=0
while [ "$elapsed" -lt "$MAX_WAIT" ]; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$URL" 2>/dev/null)
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ]; then
    echo "✅ Сервер готов — HTTP $STATUS (${elapsed}с)"
    exit 0
  fi
  sleep "$INTERVAL"
  elapsed=$((elapsed + INTERVAL))
  echo "   HTTP $STATUS — жду ещё... (${elapsed}с)"
done

echo "❌ Сервер не ответил за ${MAX_WAIT}с"
echo "   Запусти: npm run dev"
exit 1
