#!/usr/bin/env bash
# session-manager.sh — управление сессиями при смене ролей
# Логинит несколько ролей разом, сохраняет cookies, умеет выходить
#
# Использование:
#   source ./session-manager.sh init admin 'dhome$32' reader password author2 pass reviewer password
#   source ./session-manager.sh logout reader
#   source ./session-manager.sh logout-all
#
# После init доступны переменные:
#   COOKIE_ADMIN, COOKIE_READER, COOKIE_AUTHOR, COOKIE_REVIEWER  (пути к файлам)
#
# Или использовать напрямую в скриптах:
#   SESSION_FILE=$(session_login reader password)
#   curl -b "$SESSION_FILE" ...

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_DIR="${COOKIE_DIR:-/tmp}"
SCRIPTS_DIR="$(dirname "$0")"

session_login() {
  local role="$1"
  local password="$2"
  local cookie_file="$COOKIE_DIR/${role}_cookies.txt"
  bash "$SCRIPTS_DIR/login.sh" "$role" "$password" "$cookie_file" >/dev/null 2>&1
  echo "$cookie_file"
}

session_logout() {
  local role="$1"
  local cookie_file="$COOKIE_DIR/${role}_cookies.txt"
  if [ -f "$cookie_file" ]; then
    curl -s -b "$cookie_file" \
      -X DELETE "$BASE_URL/api/auth/user" \
      -H "Origin: $BASE_URL" >/dev/null 2>&1 || true
    rm -f "$cookie_file"
    echo "🚪 $role вышел"
  fi
}

session_logout_admin() {
  local cookie_file="$COOKIE_DIR/admin_cookies.txt"
  if [ -f "$cookie_file" ]; then
    curl -s -b "$cookie_file" \
      -X DELETE "$BASE_URL/api/auth" \
      -H "Origin: $BASE_URL" >/dev/null 2>&1 || true
    rm -f "$cookie_file"
    echo "🚪 admin вышел"
  fi
}

CMD="${1:-help}"
shift || true

case "$CMD" in
  init)
    # Логиним все переданные пары role/password
    # ./session-manager.sh init admin 'pass' reader 'pass' ...
    while [ "$#" -ge 2 ]; do
      ROLE="$1"; PASS="$2"; shift 2
      FILE="$COOKIE_DIR/${ROLE}_cookies.txt"
      bash "$SCRIPTS_DIR/login.sh" "$ROLE" "$PASS" "$FILE"
      # Экспортируем переменную COOKIE_<ROLE> (заглавными)
      VARNAME="COOKIE_$(echo "$ROLE" | tr '[:lower:]' '[:upper:]')"
      export "$VARNAME"="$FILE"
      echo "   export $VARNAME=$FILE"
    done
    ;;

  logout)
    ROLE="${1:?Укажи роль}"
    if [ "$ROLE" = "admin" ]; then
      session_logout_admin
    else
      session_logout "$ROLE"
    fi
    ;;

  logout-all)
    for COOKIE_FILE in "$COOKIE_DIR"/*_cookies.txt; do
      [ -f "$COOKIE_FILE" ] || continue
      ROLE=$(basename "$COOKIE_FILE" _cookies.txt)
      if [ "$ROLE" = "admin" ]; then
        session_logout_admin
      else
        session_logout "$ROLE"
      fi
    done
    ;;

  status)
    echo "Активные cookie-файлы:"
    for COOKIE_FILE in "$COOKIE_DIR"/*_cookies.txt; do
      [ -f "$COOKIE_FILE" ] || continue
      ROLE=$(basename "$COOKIE_FILE" _cookies.txt)
      # Проверяем валидность сессии
      if [ "$ROLE" = "admin" ]; then
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_FILE" \
          "$BASE_URL/api/notifications" -H "Origin: $BASE_URL" 2>/dev/null)
      else
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_FILE" \
          "$BASE_URL/api/auth/user" -H "Origin: $BASE_URL" 2>/dev/null)
      fi
      [ "$STATUS" = "200" ] && echo "  ✅ $ROLE ($COOKIE_FILE)" || echo "  ❌ $ROLE — сессия истекла (HTTP $STATUS)"
    done
    ;;

  help|*)
    echo "Использование:"
    echo "  $0 init admin 'pass' reader 'pass' [role pass ...]"
    echo "  $0 logout <role>"
    echo "  $0 logout-all"
    echo "  $0 status"
    ;;
esac
