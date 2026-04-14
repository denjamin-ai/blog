#!/usr/bin/env bash
# api-check.sh — проверяет HTTP-статус API-эндпоинта
# Выводит ✅/❌ и при несоответствии — тело ответа для диагностики
#
# Использование:
#   ./api-check.sh GET /api/articles 200
#   ./api-check.sh GET /api/articles 200 /tmp/admin_cookies.txt
#   ./api-check.sh POST /api/articles 201 /tmp/author_cookies.txt '{"title":"x","slug":"x","content":"","tags":[],"status":"draft"}'
#   ./api-check.sh DELETE /api/articles/ID 200 /tmp/admin_cookies.txt
#
# Переменные окружения:
#   BASE_URL — по умолчанию http://localhost:3000

set -euo pipefail

METHOD="${1:?Метод: GET|POST|PUT|DELETE|PATCH}"
PATH_="${2:?Путь: /api/...}"
EXPECTED="${3:?Ожидаемый HTTP-статус}"
COOKIE_FILE="${4:-}"
BODY="${5:-}"

BASE_URL="${BASE_URL:-http://localhost:3000}"
URL="$BASE_URL$PATH_"

# Собираем аргументы curl
CURL_ARGS=(-s -o /tmp/_api_check_body.txt -w "%{http_code}" -X "$METHOD")
CURL_ARGS+=(-H "Origin: $BASE_URL")
[ -n "$COOKIE_FILE" ] && CURL_ARGS+=(-b "$COOKIE_FILE")
if [ -n "$BODY" ]; then
  CURL_ARGS+=(-H "Content-Type: application/json" -d "$BODY")
fi

ACTUAL=$(curl "${CURL_ARGS[@]}" "$URL")
BODY_OUT=$(cat /tmp/_api_check_body.txt 2>/dev/null || echo "")

if [ "$ACTUAL" = "$EXPECTED" ]; then
  echo "✅ $METHOD $PATH_ → $ACTUAL"
else
  echo "❌ $METHOD $PATH_ → $ACTUAL (ожидалось $EXPECTED)"
  # Показываем тело ответа для диагностики (первые 200 символов)
  EXCERPT=$(echo "$BODY_OUT" | python3 -c "
import sys
s = sys.stdin.read().strip()
try:
    import json
    d = json.loads(s)
    print('  Body:', json.dumps(d, ensure_ascii=False)[:200])
except:
    print('  Body:', s[:200])
" 2>/dev/null || echo "  Body: $BODY_OUT")
  echo "$EXCERPT"
  exit 1
fi
