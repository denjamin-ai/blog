#!/usr/bin/env bash
# db-query.sh — частые запросы к SQLite для верификации в тестах
# Агент использует его вместо того, чтобы каждый раз помнить имена таблиц
#
# Использование:
#   ./db-query.sh articles                    # все статьи (id, title, status)
#   ./db-query.sh article <id>               # одна статья
#   ./db-query.sh versions <article_id>      # версии статьи
#   ./db-query.sh users                      # все пользователи
#   ./db-query.sh user <username>            # один пользователь
#   ./db-query.sh assignments [article_id]   # назначения (опц. по статье)
#   ./db-query.sh notifications [role]       # уведомления (admin/user-id)
#   ./db-query.sh checklist <assignment_id>  # чеклист назначения
#   ./db-query.sh comments <article_id>      # публичные комментарии статьи
#   ./db-query.sh sql "SELECT ..."          # произвольный SQL

set -euo pipefail

cd "$(dirname "$0")/../.."
DB="${DB_PATH:-blog.db}"

CMD="${1:-help}"

case "$CMD" in
  articles)
    sqlite3 "$DB" \
      "SELECT id, substr(title,1,50) as title, status, author_id IS NULL as is_admin, updated_at FROM articles ORDER BY updated_at DESC;"
    ;;

  article)
    ID="${2:?Укажи ID статьи}"
    sqlite3 "$DB" ".mode column" ".headers on" \
      "SELECT id, title, slug, status, author_id, published_at, scheduled_at, view_count FROM articles WHERE id='$ID';"
    ;;

  versions)
    ID="${2:?Укажи ID статьи}"
    sqlite3 "$DB" \
      "SELECT id, created_at, change_note FROM article_versions WHERE article_id='$ID' ORDER BY created_at DESC;"
    ;;

  users)
    sqlite3 "$DB" \
      "SELECT id, username, role, is_blocked, commenting_blocked FROM users ORDER BY created_at DESC;"
    ;;

  user)
    USERNAME="${2:?Укажи username}"
    sqlite3 "$DB" ".mode column" ".headers on" \
      "SELECT id, username, name, role, is_blocked, commenting_blocked, created_at FROM users WHERE username='$USERNAME';"
    ;;

  assignments)
    ARTICLE_ID="${2:-}"
    if [ -n "$ARTICLE_ID" ]; then
      sqlite3 "$DB" \
        "SELECT ra.id, ra.status, u.username as reviewer, ra.verdict, ra.created_at FROM review_assignments ra LEFT JOIN users u ON u.id=ra.reviewer_id WHERE ra.article_id='$ARTICLE_ID' ORDER BY ra.created_at DESC;"
    else
      sqlite3 "$DB" \
        "SELECT ra.id, substr(a.title,1,30) as article, ra.status, u.username as reviewer, ra.verdict, ra.created_at FROM review_assignments ra LEFT JOIN articles a ON a.id=ra.article_id LEFT JOIN users u ON u.id=ra.reviewer_id ORDER BY ra.created_at DESC LIMIT 20;"
    fi
    ;;

  notifications)
    FILTER="${2:-}"
    if [ "$FILTER" = "admin" ]; then
      sqlite3 "$DB" \
        "SELECT id, type, is_read, created_at FROM notifications WHERE is_admin_recipient=1 ORDER BY created_at DESC LIMIT 20;"
    elif [ -n "$FILTER" ]; then
      # filter = user id or username
      USER_ID=$(sqlite3 "$DB" "SELECT id FROM users WHERE username='$FILTER' OR id='$FILTER' LIMIT 1;" 2>/dev/null || echo "")
      sqlite3 "$DB" \
        "SELECT id, type, is_read, created_at FROM notifications WHERE recipient_id='${USER_ID:-$FILTER}' ORDER BY created_at DESC LIMIT 20;"
    else
      sqlite3 "$DB" \
        "SELECT id, type, is_admin_recipient, recipient_id, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 20;"
    fi
    ;;

  checklist)
    ASSIGN_ID="${2:?Укажи ID назначения}"
    sqlite3 "$DB" \
      "SELECT items FROM review_checklists WHERE assignment_id='$ASSIGN_ID';" | \
      python3 -c "import sys,json; items=json.load(sys.stdin); [print(f'  [{\"x\" if i.get(\"checked\") else \" \"}] {i[\"text\"]}') for i in items]" 2>/dev/null || \
      sqlite3 "$DB" "SELECT items FROM review_checklists WHERE assignment_id='$ASSIGN_ID';"
    ;;

  comments)
    ARTICLE_ID="${2:?Укажи ID статьи}"
    sqlite3 "$DB" \
      "SELECT id, substr(content,1,50) as content, parent_id IS NOT NULL as is_reply, deleted_at IS NOT NULL as deleted FROM public_comments WHERE article_id='$ARTICLE_ID' ORDER BY created_at DESC LIMIT 20;"
    ;;

  sql)
    QUERY="${2:?Укажи SQL-запрос}"
    sqlite3 "$DB" "$QUERY"
    ;;

  help|*)
    grep "^#   " "$0" | sed 's/^#   /  /'
    ;;
esac
