#!/usr/bin/env bash
# login.sh — логин в приложение, сохраняет cookies в файл
# Использование:
#   ./login.sh admin                            # логин admin (читает пароль из .env.local)
#   ./login.sh reader password                  # логин пользователя
#   ./login.sh reviewer testpass /tmp/rv.txt    # логин ревьюера, cookie в свой файл
#
# Переменные окружения:
#   BASE_URL  — по умолчанию http://localhost:3000
#   COOKIE_DIR — каталог для cookie-файлов (по умолчанию /tmp)

set -euo pipefail

ROLE="${1:?Укажи роль: admin | reader | reviewer | author}"
PASSWORD="${2:-}"
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_DIR="${COOKIE_DIR:-/tmp}"

# Определяем имя cookie-файла
if [ -n "${3:-}" ]; then
  COOKIE_FILE="$3"
else
  COOKIE_FILE="$COOKIE_DIR/${ROLE}_cookies.txt"
fi

# --- Admin ---
if [ "$ROLE" = "admin" ]; then
  if [ -z "$PASSWORD" ]; then
    # Читаем пароль из .env.local (в репо он хранится как hash, нужен plaintext)
    # Plaintext лежит в .env.local как ADMIN_PASSWORD_PLAIN (опционально)
    # или передай явно: ./login.sh admin 'dhome$32'
    ADMIN_PW=$(grep '^ADMIN_PASSWORD_PLAIN=' .env.local 2>/dev/null | cut -d= -f2- | tr -d '"')
    if [ -z "$ADMIN_PW" ]; then
      echo "❌ Укажи пароль: ./login.sh admin 'dhome\$32'"
      exit 1
    fi
    PASSWORD="$ADMIN_PW"
  fi

  RESP=$(curl -s -c "$COOKIE_FILE" \
    -X POST "$BASE_URL/api/auth" \
    -H "Content-Type: application/json" \
    -H "Origin: $BASE_URL" \
    -d "{\"password\":$(printf '%s' "$PASSWORD" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}")

  OK=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ok',''))" 2>/dev/null)
  if [ "$OK" = "True" ]; then
    echo "✅ Admin залогинен → $COOKIE_FILE"
  else
    echo "❌ Ошибка логина admin: $RESP"
    exit 1
  fi

# --- User (reader / author / reviewer) ---
else
  USERNAME="${ROLE}"
  if [ -z "$PASSWORD" ]; then
    echo "❌ Укажи пароль: ./login.sh $ROLE <password>"
    exit 1
  fi

  RESP=$(curl -s -c "$COOKIE_FILE" \
    -X POST "$BASE_URL/api/auth/user" \
    -H "Content-Type: application/json" \
    -H "Origin: $BASE_URL" \
    -d "{\"username\":\"$USERNAME\",\"password\":$(printf '%s' "$PASSWORD" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}")

  OK=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ok',''))" 2>/dev/null)
  ROLE_RESP=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('role',''))" 2>/dev/null)
  if [ "$OK" = "True" ]; then
    echo "✅ $USERNAME ($ROLE_RESP) залогинен → $COOKIE_FILE"
  else
    ERR=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error','unknown'))" 2>/dev/null)
    if echo "$ERR" | grep -qi "много попыток"; then
      echo "⚠️  Rate limit активен для '$USERNAME' — подожди 15 минут или используй другой IP"
      exit 2
    fi
    echo "❌ Ошибка логина $USERNAME: $ERR"
    exit 1
  fi
fi
