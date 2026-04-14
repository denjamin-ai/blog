#!/usr/bin/env bash
# cleanup-test-data.sh — удаляет тестовые данные после прогона
# Удаляет статьи и пользователей, созданных с префиксом [TEST-RUN]
#
# Использование:
#   ./cleanup-test-data.sh                          # удаляет всё через API
#   ./cleanup-test-data.sh /tmp/admin_cookies.txt   # явный путь к cookie admin
#   ./cleanup-test-data.sh --dry-run                # показать, что будет удалено
#
# Переменные окружения:
#   BASE_URL  — по умолчанию http://localhost:3000
#   DB_PATH   — путь к SQLite (по умолчанию blog.db в корне проекта)

set -euo pipefail

cd "$(dirname "$0")/../.."  # корень проекта

COOKIE_FILE="${1:-/tmp/admin_cookies.txt}"
BASE_URL="${BASE_URL:-http://localhost:3000}"
DB_PATH="${DB_PATH:-blog.db}"
DRY_RUN=false
[ "${1:-}" = "--dry-run" ] && DRY_RUN=true && COOKIE_FILE="/tmp/admin_cookies.txt"

echo "🧹 Поиск тестовых данных с префиксом [TEST-RUN]..."

# --- Статьи ---
ARTICLES=$(sqlite3 "$DB_PATH" \
  "SELECT id, title FROM articles WHERE title LIKE '[TEST-RUN]%';" 2>/dev/null || echo "")
if [ -n "$ARTICLES" ]; then
  echo "Статьи:"
  echo "$ARTICLES" | while IFS='|' read -r id title; do
    echo "  - $title ($id)"
    if [ "$DRY_RUN" = false ]; then
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_FILE" \
        -X DELETE "$BASE_URL/api/articles/$id" \
        -H "Origin: $BASE_URL")
      [ "$STATUS" = "200" ] && echo "    ✅ удалено" || echo "    ⚠️  HTTP $STATUS"
    fi
  done
else
  echo "  Статей с [TEST-RUN] не найдено"
fi

# --- Пользователи ---
USERS=$(sqlite3 "$DB_PATH" \
  "SELECT id, username FROM users WHERE username LIKE 'test%' OR username IN ('author2','reviewertest','newreader1');" 2>/dev/null || echo "")
if [ -n "$USERS" ]; then
  echo "Пользователи:"
  echo "$USERS" | while IFS='|' read -r id username; do
    echo "  - $username ($id)"
    if [ "$DRY_RUN" = false ]; then
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_FILE" \
        -X DELETE "$BASE_URL/api/admin/users/$id" \
        -H "Origin: $BASE_URL")
      [ "$STATUS" = "200" ] && echo "    ✅ удалён" || echo "    ⚠️  HTTP $STATUS"
    fi
  done
else
  echo "  Тестовых пользователей не найдено"
fi

# --- Orphaned author_id ---
if [ "$DRY_RUN" = false ]; then
  ORPHANED=$(sqlite3 "$DB_PATH" \
    "SELECT count(*) FROM articles WHERE author_id IS NOT NULL AND author_id NOT IN (SELECT id FROM users);" 2>/dev/null || echo "0")
  if [ "$ORPHANED" -gt 0 ]; then
    echo "⚠️  Найдено $ORPHANED статей с orphaned author_id — исправляю..."
    sqlite3 "$DB_PATH" \
      "UPDATE articles SET author_id=NULL WHERE author_id IS NOT NULL AND author_id NOT IN (SELECT id FROM users);"
    echo "  ✅ author_id → NULL"
  fi
fi

[ "$DRY_RUN" = true ] && echo "" && echo "(dry-run: данные не удалены)"
echo "✅ Очистка завершена"
