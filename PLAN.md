# План разработки блога

## Процесс работы (workflow каждой фазы)

```
1. Реализация → 2. Валидация (npm run build) → 3. Ревью кода → 4. Фикс по ревью → 5. Повторная валидация → 6. Запись результата
```

Ревью включает:
- Проверка безопасности (XSS, инъекции, утечки секретов)
- Проверка типов и edge-cases
- Проверка консистентности стилей и паттернов
- Проверка на дублирование кода
- Проверка UX (ошибки, loading states, доступность)

---

## Текущий статус

| Фаза | Статус | Дата |
|------|--------|------|
| 1. Инициализация | Done | 2026-03-15 |
| 2. Профиль + Layout | Done | 2026-03-15 |
| 3. Блог + Статьи | Done | 2026-03-15 |
| 4. Copy-кнопка + Админка + CRUD | Done (баг-фикс редиректа) | 2026-03-15 |
| 5. Ревью Фаз 1–4 | Done | 2026-03-15 |
| 6. MDX-компоненты (Expandable, Run) | Done | 2026-03-15 |
| 7. Деплой (Turso-ready) | Done | 2026-03-15 |

---

## История результатов

### Фаза 1: Инициализация (Done)
- **Что сделано**: Next.js 15 + TypeScript + Tailwind v4, Drizzle-схема (articles, article_versions, profile, profile_versions), миграции применены
- **Валидация**: `npm run build` OK, `npm run dev` OK, таблицы созданы в SQLite
- **Файлы**: drizzle.config.ts, src/lib/db/index.ts, src/lib/db/schema.ts, drizzle/0000_lame_champions.sql

### Фаза 2: Профиль + Layout (Done)
- **Что сделано**: ThemeProvider, ThemeToggle, Nav, Footer, главная страница с профилем из БД, seed-скрипт
- **Валидация**: `npm run build` OK, профиль рендерится, тема переключается
- **Файлы**: src/components/nav.tsx, footer.tsx, theme-toggle.tsx, theme-provider.tsx, src/app/layout.tsx, page.tsx, src/lib/db/seed.ts

### Фаза 3: Блог + Статьи (Done)
- **Что сделано**: MDX-компиляция (next-mdx-remote + rehype-pretty-code + shiki dual theme), список статей /blog, страница статьи /blog/[slug], ArticleCard, prose-стили
- **Валидация**: `npm run build` OK, статьи рендерятся, код подсвечен
- **Файлы**: src/lib/mdx.ts, src/app/blog/page.tsx, src/app/blog/[slug]/page.tsx, src/components/article-card.tsx

### Фаза 4: Copy-кнопка + Админка + CRUD (Done)
- **Что сделано**:
  - CopyButton — клиентский компонент, добавляет кнопку копирования ко всем блокам кода (hover → кнопка → clipboard → галочка)
  - Авторизация — iron-session + bcryptjs, POST /api/auth (логин), DELETE (логаут)
  - Админ-панель — dashboard (статистика), список статей, создание/редактирование/удаление, публикация/черновик
  - История версий — автоснимок при PUT, страница /admin/articles/[id]/history
- **Баг-фикс**: Бесконечный редирект /admin/login → перенос в route group (protected)
- **Валидация**: `npm run build` OK, все 13 роутов скомпилированы
- **Файлы**: src/components/mdx/copy-button.tsx, src/lib/auth.ts, src/app/api/auth/route.ts, src/app/admin/login/page.tsx, src/app/admin/(protected)/layout.tsx, page.tsx, articles/page.tsx, articles/new/page.tsx, articles/[id]/page.tsx, articles/[id]/history/page.tsx, src/app/api/articles/route.ts, src/app/api/articles/[id]/route.ts
- **Env**: .env.local (SESSION_SECRET, ADMIN_PASSWORD_HASH), пароль: admin123
- **Баг-фикс #2**: `$` в bcrypt-хеше интерпретировались dotenv-expand → экранирование `\$` в .env.local

### Фаза 5: Ревью Фаз 1–4 (Done)
- **Задача**: Полный code review всех созданных файлов, фикс найденных проблем, повторная валидация
- **Найдено**: 5 критических, 13 средних, 12 низких проблем
- **Исправлено (критические)**:
  1. auth.ts — убран fallback secret, теперь throw Error если SESSION_SECRET не задан
  2. copy-button.tsx — добавлен cleanup в useEffect (удаление кнопок и таймаутов при размонтировании)
  3. api/articles/[id]/route.ts — добавлена проверка уникальности slug при обновлении
  4. api/auth/route.ts — добавлена валидация пароля (тип, длина, формат запроса)
- **Исправлено (среднее)**:
  5. article-card.tsx, page.tsx, blog/[slug]/page.tsx — JSON.parse обёрнут в try-catch
  6. admin/login/page.tsx — добавлен autoComplete="current-password"
  7. admin/articles/[id]/page.tsx — добавлен rel="noopener noreferrer" на target="_blank"
- **Не исправлено (низкий приоритет, отложено)**:
  - Rate limiting на /api/auth (нужен отдельный пакет, не MVP)
  - CSRF-токены (iron-session + SameSite cookie достаточно для MVP)
  - Оптимизация 3 COUNT-запросов в 1 (незначительно)
- **Повторная валидация**: `npm run build` OK

### Фаза 6: MDX-компоненты (Done)
- **Что сделано**:
  - Expandable — раскрывающийся контент (`<Expandable title="...">...</Expandable>`)
  - RunCode — запуск JS в iframe sandbox (`<RunCode code="..." lang="javascript" />`)
  - Подключены к MDX-рендерингу через components map
  - Тестовая статья с демо всех компонентов (slug: mdx-interactive-components)
- **Ревью**: 1 критическая (XSS через `</script>` в коде), 4 средних проблемы
- **Исправлено**:
  1. run-code.tsx — экранирование `</` в JSON.stringify для предотвращения HTML-инъекции
  2. run-code.tsx — cleanup event listener при unmount (useEffect + cleanupRef)
  3. run-code.tsx — timeout убивает iframe (`about:blank`), не только снимает флаг
  4. run-code.tsx — revoke blob URL для предотвращения утечки памяти
  5. run-code.tsx — setRunning(true) после null-check
  6. mdx.ts — обработка ошибок компиляции MDX (try/catch)
- **Валидация**: `npm run build` OK
- **Повторная валидация**: `npm run build` OK после фиксов
- **Файлы**: src/components/mdx/expandable.tsx, run-code.tsx, src/lib/mdx.ts, src/lib/db/seed.ts

### Фаза 7: Деплой — Turso-ready (Done)
- **Что сделано**:
  - Переключение БД на единый драйвер `@libsql/client` (работает и с локальным SQLite через `file:`, и с Turso)
  - `drizzle.config.ts` обновлён на dialect `turso`
  - `seed.ts` переведён на async API
  - Все запросы уже используют `await` — совместимы с async libsql
- **Для деплоя на Vercel нужно**:
  1. Создать БД на Turso: `turso db create blog`
  2. Получить URL и токен: `turso db show blog --url` + `turso db tokens create blog`
  3. В Vercel: добавить env `TURSO_CONNECTION_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`
  4. Применить миграции: `TURSO_CONNECTION_URL=... TURSO_AUTH_TOKEN=... npx drizzle-kit migrate`
  5. Запустить seed: `TURSO_CONNECTION_URL=... TURSO_AUTH_TOKEN=... npx tsx src/lib/db/seed.ts`
- **Валидация**: `npm run build` OK, dev-сервер с libsql OK, API auth OK
- **Файлы**: src/lib/db/index.ts, drizzle.config.ts, src/lib/db/seed.ts

---

## Предстоящие фазы

### Фаза 6: MDX-компоненты
- Expandable — раскрывающийся контент (`<details>/<summary>`)
- CodeBlock с кнопкой Run — iframe-sandbox для JS/TS
- Тестовая статья со всеми компонентами

### Фаза 7: Деплой
- Turso для prod, переключение SQLite/Turso по env
- Vercel: env-переменные, деплой
- Проверка prod-сборки
