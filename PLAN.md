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
| 8. Базовая дистрибуция (SEO, RSS, Share) | Done | 2026-04-12 |
| 9. Ревью-пайплайн (базовый) | Done | 2026-04-12 |
| 10. UX статьи (TOC, reading-time, upload) | Done | 2026-04-13 |
| 11. Расширенный ревью-пайплайн | Done | 2026-04-13 |
| 12. Ревью Фазы 12 (вовлечение) | Done | 2026-04-13 |
| 13. Финальный ревью фаз 8–13 | Done | 2026-04-13 |

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

### Фаза 8: Базовая дистрибуция — SEO, RSS, Share (Done)
- **Что сделано**:
  - OG-теги и Twitter Cards (`twitter:card: summary_large_image`, `og:type: article`, `article:published_time`, `article:author`, `og:image` из profile.avatarUrl) на `/blog/[slug]`
  - Canonical URLs на всех публичных страницах (`/`, `/blog`, `/blog/[slug]`)
  - `metadataBase` в корневом layout для формирования абсолютных URL
  - `generateMetadata()` на главной странице с данными из profile
  - sitemap.xml — скорректированы приоритеты: `/` 1.0, `/blog` 0.8, статьи 0.6
  - robots.txt — явные Allow-правила + wildcards для Disallow
  - RSS 2.0 фид (`/feed.xml`) — title, link, description, pubDate, author, category из тегов; excerpt или plain-text из MDX
  - `ShareButton` клиентский компонент — Telegram, ВКонтакте, X, «Копировать ссылку» (✓ на 2 сек); кнопка неактивна если Clipboard API недоступен
  - RSS-иконка (SVG) в Footer
- **OG image**: `og:image` использует `articles.coverImageUrl` с fallback на `profile.avatarUrl` (реализовано вместе с Фазой 10)
- **Валидация**: `npm run build` OK (52 роута, новый `/feed.xml`)
- **Файлы**:
  - `src/app/layout.tsx` — metadataBase
  - `src/app/sitemap.ts` — приоритеты
  - `src/app/robots.ts` — Allow + wildcards
  - `src/app/page.tsx` — generateMetadata
  - `src/app/blog/page.tsx` — canonical
  - `src/app/blog/[slug]/page.tsx` — расширенный generateMetadata + ShareButton
  - `src/app/feed.xml/route.ts` — новый RSS Route Handler
  - `src/components/share-button.tsx` — новый клиентский компонент
  - `src/components/footer.tsx` — RSS-иконка
  - `src/app/globals.css` — стили `.share-btn`
  - `src/lib/utils.ts` — утилита `mdxToPlainText`

### Ревью Фазы 8 (Done)
- **Найдено**: 0 P0, 1 P1, 2 P2, 1 P3
- **Исправлено**:
  1. P1 `share-button.tsx` — `clipboardUnavailable` через `useState` не работал из-за SSR (initializer выполнялся на сервере, где `navigator` не определён, и React сохранял серверное `false` при гидратации). Заменено на `useEffect(() => setClipboardAvailable(!!navigator?.clipboard), [])`.
  2. P2 `feed.xml/route.ts` — несогласованный fallback URL (`"http://..."` vs `"https://..."` в sitemap.ts). Выровнено на `https://localhost:3000`.
  3. P2 `feed.xml/route.ts` — `<author>` в RSS 2.0 требует email-адрес по спецификации. Заменено на `<dc:creator>` (Dublin Core namespace `xmlns:dc="http://purl.org/dc/elements/1.1/"`).
  4. P3 `blog/[slug]/page.tsx` — `description` в `generateMetadata` не имел fallback на контент статьи. Добавлен `mdxToPlainText(row.content)` как fallback.
  5. Рефакторинг: `mdxToPlainText` вынесена из `feed.xml/route.ts` в `src/lib/utils.ts`.
- **Повторная валидация**: `npm run build` OK

### Фаза 9: Ревью-пайплайн базовый (Done)
- **Что сделано**:
  - **Схема**: `verdict`/`verdictNote` в `reviewAssignments`; `resolvedAt`/`resolvedBy` в `reviewComments`; `review_comment_reopened` в enum уведомлений; миграция `0003_far_la_nuit.sql`
  - **Diff (US-RV15)**: утилита `src/lib/diff.ts` (пакет `diff`), `GET /api/reviewer/assignments/[id]/diff`, компонент `DiffView` с переключателем Diff/Полный текст; вкладки «Статья/Изменения» в `review-view.tsx`
  - **Разрешение замечаний (US-RV16, US-A24)**: `PUT /api/review-comments/[id]/resolve` — автор/админ разрешают, ревьюер переоткрывает (US-RV20); уведомление `review_comment_reopened`; компонент `ReviewProgress`; бейджи 🔴/🟢; фильтры «Все/Открытые/Решённые»
  - **Прогресс у автора (US-A25)**: сводка «Замечаний M | Решено N | Открыто K» на странице редактирования
  - **Версионная осведомлённость (US-A23)**: «Ревьюер видит версию от [дата]» + жёлтое предупреждение при расхождении; кнопка «Уведомить ревьюера» подсвечивается
  - **Вердикт (US-RV18, US-A26)**: `VerdictModal` с 3 радиокнопками + предупреждение о незакрытых замечаниях; `VerdictBadge`; PATCH требует `verdict` при `status=completed`; verdict в payload уведомления `review_completed`
  - **Таблица статей (US-AD34)**: колонка «Ревью» с последним вердиктом в `/admin/articles`
  - **Доступ автора к комментариям**: `GET /api/assignments/[id]/review-comments` расширен для article author (read-only)
  - **API автора расширен**: `/api/author/assignments?articleId=X` теперь возвращает `versionCreatedAt`, `verdict`, `verdictNote`, `totalComments`, `resolvedCount`
- **Валидация**: `npm run build` OK (54 роута, 0 ошибок TypeScript)

### Фаза 10: UX статьи (Done)
- **Что сделано**:
  - `TableOfContents` — клиентский компонент с IntersectionObserver, desktop sidebar (sticky) + mobile collapsible (`<details>`), поддержка h2–h4, slug-дедупликация, code-block-aware парсинг
  - `DifficultyBadge` — бейдж сложности (simple/medium/hard), тёмная/светлая тема
  - `estimateReadingTime` — чистая функция, учитывает код-блоки
  - `coverImageUrl` в схеме и CRUD: обложка статьи в БД, загрузка через `/api/upload`, отображение на странице и в ArticleCard
  - `/api/upload` — POST endpoint, whitelist MIME, 2 МБ лимит, ULID-имена файлов
  - OG-теги обновлены: `coverImageUrl ?? profile.avatarUrl` в generateMetadata
- **Валидация**: `npm run build` OK (57 роутов)

### Ревью Фазы 10 (Done)
- **Найдено**: 2 P0, 1 P1, 1 P2, 2 P3
- **Исправлено**:
  1. **P0** `upload/route.ts` — DoS: `Content-Length` проверяется ДО буферизации файла
  2. **P0** `upload/route.ts` — MIME-спуфинг: добавлена проверка magic bytes через `file-type` пакет (npm install file-type); клиентский `file.type` больше не используется
  3. **P1** `articles/route.ts` (POST) + `articles/[id]/route.ts` (PUT) — `coverImageUrl` теперь принимается только если начинается с `/uploads/`; произвольные URL отбрасываются
  4. **P2** `toc.tsx` — `parseHeadings` обёрнут в `useMemo([content])`; убран `eslint-disable`
  5. **P3** `toc.tsx` — `observerRef.current = null` после `disconnect()` в cleanup
  6. **P3** `toc.tsx` — добавлен `aria-controls={slug}` на каждую кнопку TOC
- **Не проблемы**: XSS в TOC (React auto-escapes), Image компонент (корректен), responsive layout (корректен)
- **Повторная валидация**: `npm run build` OK (57 роутов, 0 ошибок TypeScript)

### Ревью Фазы 9 (Done)
- **Найдено**: 1 P0, 2 P1, 1 P2, 1 P3
- **Исправлено**:
  1. **P0** `resolve/route.ts:108` — `resolvedBy` хранил строку `"admin"` вместо `null`, нарушая FK → `users.id`. Исправлено: `session.userId ?? null` (admin хранится как `null`, аналогично `authorId` в комментариях)
  2. **P1** `author/assignments/route.ts` — N+1: N запросов для подсчёта комментариев. Исправлено: один `inArray` batch-запрос + in-memory группировка
  3. **P1** `author-assignment-thread.tsx` — UI показывал кнопку «Переоткрыть» автору (нарушение US-RV20: только ревьюер может переоткрыть). Исправлено: автор видит только «Решено» на незакрытых reviewer-комментариях
  4. **P2** `reviewer/assignments/[id]/route.ts` — отсутствие терминальных состояний `completed: []`, `declined: []` в state machine. Добавлены для ясности
  5. **P3** `resolve/route.ts` — race condition: если комментарий удалён между UPDATE и SELECT, возвращался `null`. Исправлено: 404 при `updated === null`
- **Повторная валидация**: `npm run build` OK

### Фаза 11: Расширенный ревью-пайплайн (Done)
- **Что сделано**:
  - **US-RV17 — Фильтр «Без ответа»**: в `review-view.tsx` добавлен четвёртый режим фильтрации; логика — reviewer-комментарии верхнего уровня без ни одного admin-ответа; счётчик в label; «Все замечания получили ответ» при пустом наборе
  - **US-RV19 — Чеклист у ревьюера**: компонент `ReviewChecklist` с прогрессом «Проверено K из L», интерактивные чекбоксы (PUT при каждом клике), скрыт если items=[]; вставлен над filter bar в `review-view.tsx`
  - **US-AD33 — Шаблон чеклиста у админа**: страница `/admin/settings` (ссылка в nav), компонент `ChecklistTemplateEditor` с добавлением/удалением/сортировкой (↑↓) пунктов; шаблон копируется при создании назначения (admin POST + send_for_review); изменение шаблона не затрагивает созданные чеклисты
  - **US-A27 — Diff-превью для автора**: кнопка «Уведомить ревьюера» открывает `DiffPreviewModal` с `DiffView`; «Статья не менялась» если нет diff; отдельный endpoint `/api/author/assignments/[id]/diff` с ownership-проверкой
  - **US-AD35 — Diff для админа**: кнопка «Показать изменения» в `assignment-thread.tsx` раскрывает `DiffView` (max-h-96); endpoint `/api/admin/assignments/[id]/diff`
  - **Чеклист read-only**: добавлен в `author-assignment-thread.tsx` и admin `assignment-thread.tsx`
  - **DB**: таблица `review_checklists`, колонка `profile.checklist_template`; миграция `0005_curved_synch.sql`
  - **DiffView**: добавлен prop `diffUrl` для переиспользования с разными endpoint'ами
- **Валидация**: `npm run build` OK (63 роута, 0 ошибок TypeScript)

### Финальный ревью фаз 8–13 (Done)
- **Найдено**: 2 P0, 3 P1, 2 P2
- **Исправлено**:
  1. **P0** `schema.ts` — отсутствовали `uniqueIndex` на таблицах `bookmarks`, `articleVotes`, `commentVotes`, `subscriptions` (JTBD требует DB-level unique constraint). Заменены `index()` на `uniqueIndex()`. Миграция `0008_adorable_morbius.sql`.
  2. **P0** `schema.ts` — поле `reviewAssignments.verdict` было `text()` без enum. Добавлен `enum: ["approved", "needs_work", "rejected"]`.
  3. **P0** `subscriptions/route.ts` — check+insert/delete не был обёрнут в транзакцию (в отличие от `bookmarks` и `votes`). Добавлен `db.transaction()`.
  4. **P1** `sitemap.ts` — не включал `/authors/[slug]` (US-T3). Добавлен параллельный запрос авторов + `authorRoutes` с priority 0.4.
  5. **P1** `blog/[slug]/page.tsx` — отсутствовал JSON-LD (US-T6). Добавлен `<script type="application/ld+json">` Schema.org/Article с headline, author, publisher, datePublished, dateModified, image, mainEntityOfPage.
  6. **P1** `feed.xml/route.ts` — Content-Type был `application/xml` вместо `application/rss+xml`.
  7. **P2** `cron/publish/route.ts` — N+1: отдельный SELECT для каждого автора. Исправлено: один LEFT JOIN в основном запросе; batch `inArray` UPDATE; убран лишний авторский SELECT при уведомлениях.
- **Повторная валидация**: `npm run build` OK (77 роутов, 0 ошибок TypeScript)

### Ревью Фазы 12: Вовлечение (Done)
- **Что сделано**:
  - **Race conditions**: обёртка SELECT + мутация в `db.transaction()` для голосов по статьям (`/api/articles/[id]/votes`), голосов по комментариям (`/api/comments/[id]/votes`) и закладок (`/api/bookmarks`)
  - **Rate limit на голосование**: добавлена `checkUserRateLimit(userId, 1000, 1)` — 1 запрос/секунду per-user; применена к обоим vote-роутам; 429 при превышении
  - **Уже корректно**: атомарный `viewCount + 1`, batch-insert уведомлений подписчикам, SameSite=Lax на viewed_-cookie, каскадные удаления в схеме, нет N+1 на странице закладок
- **Файлы**: `src/lib/rate-limit.ts`, `src/app/api/articles/[id]/votes/route.ts`, `src/app/api/comments/[id]/votes/route.ts`, `src/app/api/bookmarks/route.ts`
- **Валидация**: `npm run build` OK

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
