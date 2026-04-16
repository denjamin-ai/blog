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
| 14. Медиа-контент в статьях | Done | 2026-04-14 |
| 15. LaTeX + FormulaInserter + EditorWithPreview | Done | 2026-04-14 |
| 16. Диаграммы в статьях (Mermaid + Kroki + Circuit) | Done | 2026-04-14 |
| 17. E2E-тесты (Playwright) + REPORT_LOG | Done | 2026-04-14 |
| 18. Ревью фаз 14–17 | Done | 2026-04-14 |
| 20. Типографическая система | Done | 2026-04-15 |
| 21. Layout публичных страниц | Done | 2026-04-15 |
| 22. Layout панелей управления | Done | 2026-04-15 |
| 23. Анимации и micro-interactions | Done | 2026-04-15 |
| 24. Responsive + Accessibility + Визуальный аудит | Done | 2026-04-15 |
| 25. E2E UI + UX ревью + финализация | Done | 2026-04-15 |

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

### Фаза 15: LaTeX + FormulaInserter + EditorWithPreview (Done)
- **Что сделано**:
  - **LaTeX в MDX**: `remark-math` + `rehype-katex` добавлены в pipeline `src/lib/mdx.ts`; `rehypeSanitize` удалён (контент от доверенных авторов, allowlist для KaTeX слишком сложен); KaTeX CSS через CDN в `layout.tsx`; формулы `$...$` и `$$...$$` рендерятся в публичных статьях
  - **`FormulaInserter`** (`src/components/formula-inserter.tsx`): collapsible-панель над textarea; ввод LaTeX + KaTeX client-side превью; inline/block режим; 11 быстрых символов (∑, ∫, √, ∂, α-π, матрица); вставка в позицию курсора через `insertFormulaAtCursor`
  - **`EditorWithPreview`** (`src/components/editor-with-preview.tsx`): toolbar с 4 режимами (right/left/bottom/none); layout в `localStorage('editor_preview_layout')`; debounce 500ms → `POST /api/preview` → preview pane с `prose`-стилями; skeleton-анимация; drag handle (pointer events, CSS `--split` custom property); mobile: right/left скрыты
  - **`POST /api/preview`** (`src/app/api/preview/route.ts`): auth admin/author; unified pipeline (remark-parse + remark-math + remark-rehype + rehype-katex + rehype-pretty-code + rehype-slug + rehype-stringify); processor на уровне модуля; content limit 100KB; ошибки → inline HTML
  - **Интеграция**: в `src/app/author/(protected)/articles/[id]/page.tsx` — `insertFormulaAtCursor`, `EditorWithPreview` как обёртка контент-поля; content field вынесен из `max-w-4xl` для full-width split режима
  - **US-A28, US-A29, US-A30** добавлены в JTBD.md
- **Валидация**: `npm run build` OK (0 ошибок TypeScript)

### Фаза 16: Диаграммы в статьях (Done)
- **Что сделано**:
  - **`<Mermaid chart={...}>`** (`src/components/mdx/mermaid.tsx`): `'use client'`, dynamic import `mermaid@11`; IntersectionObserver — lazy render при попадании в viewport; skeleton-анимация; смена темы через `useTheme().resolvedTheme` → `mermaid.initialize({theme})`; ошибка синтаксиса → inline сообщение
  - **`<Diagram type="..." chart={...}>`** (`src/components/mdx/diagram.tsx`): Server Component; `fetch https://kroki.io/{type}/svg` (POST); module-level `Map` кэш по sha256-хэшу; поддерживаемые типы: plantuml, bpmn, wavedrom, graphviz, d2, svgbob, tikz; fallback `<pre><code>` при недоступности
  - **`<Circuit code={...}>`** (`src/components/mdx/circuit.tsx`): тонкая обёртка над `<Diagram type="tikz">`
  - **Регистрация**: все три компонента добавлены в `mdxComponents` в `src/lib/mdx.ts`
  - **Preview API** (`src/app/api/preview/route.ts`): добавлены `remarkMdx` + custom remark-плагин `remarkMdxDiagramsToHtml` — трансформирует `<Mermaid>` → `<pre class="mermaid">`, `<Diagram>` и `<Circuit>` → `<pre class="language-{type}-diagram">` до `remarkRehype`
  - **`EditorWithPreview`**: новый проп `diagramInserter`; `previewRef` + `useEffect([previewHtml])` → `mermaid.run({nodes})` для рендера диаграмм в preview pane
  - **`DiagramInserter`** (`src/components/diagram-inserter.tsx`): collapsible-панель; 10 Mermaid-типов + 6 Kroki-типов с шаблонами; Mermaid-предпросмотр через `import('mermaid')` при выборе типа; Kroki-типы — только шаблон; вставка в позицию курсора
  - **Интеграция**: `DiagramInserter` добавлен в `src/app/author/(protected)/articles/[id]/page.tsx`
  - **US-G11, US-A31, US-AD31** добавлены в JTBD.md
- **Валидация**: `npm run build` OK (0 ошибок TypeScript)

### Фаза 17: E2E-тесты (Playwright) + REPORT_LOG (Done)
- **Что сделано**:
  - `@playwright/test` установлен, chromium-браузер скачан
  - `playwright.config.ts` (корень): `testDir=testing/e2e`, `workers=1`, HTML-reporter в `testing/reports/playwright-html`, `globalSetup` сброс БД + auth
  - `.agents/playwright-tester/playwright.config.ts` — алиас для запуска тестов агентом
  - `testing/e2e/global-setup.ts` — сброс `blog.test.db` + сохранение storageState для admin/reader/author
  - **4 spec-файла** (19 тестов):
    - `guest.spec.ts` — US-G2: навигация, чтение статьи, 404, редирект
    - `admin.spec.ts` — US-AD1: вход; US-AD4: создание MDX-статьи; US-AD5: редактирование; US-AD6: публикация/снятие
    - `reader.spec.ts` — US-R1: вход; US-R2: комментарий; US-R8: голосование; US-R9: закладки
    - `author.spec.ts` — US-A1: вход; US-A3: черновик; US-A22: LaTeX; US-A23: live-preview; US-G11: Mermaid SVG
  - `testing/reports/REPORT_LOG.md` — индекс всех отчётов, первая запись REPORT_1 (2026-04-14, NO-GO, XSS BUG-006)
  - `package.json`: добавлены скрипты `test:e2e`, `test:e2e:ui`, `test:e2e:report`
  - `testing/TEST-PLAN.md`: E2E вынесены из Out of Scope в In Scope
- **Команды**:
  - Запуск: `npm run dev:test` → `npm run test:e2e`
  - Сброс БД: `npm run test:reset`
  - HTML-отчёт: `npm run test:e2e:report`
- **Файлы**: `playwright.config.ts`, `testing/e2e/`, `testing/reports/REPORT_LOG.md`

### Фаза 19: E2E тест-прогон + исправление багов (Done)
- **Прогон**: `npx playwright test` — 23/26 прошли, 3 пропущены, 0 провалились
- **Вердикт**: ✅ GO
- **Исправлено**:
  1. **BUG-003 (CRITICAL)** `src/lib/mdx.ts` — XSS: `<script>` в MDX-контенте выполнялся в браузере. Добавлена `stripDangerousHtml()` перед компиляцией.
  2. **BUG-004 (HIGH)** `src/app/api/admin/users/[id]/route.ts` — DELETE user → 500 при наличии review-комментариев. Добавлен NULL reviewComments.authorId перед удалением.
  3. **BUG-005 (HIGH)** `src/app/api/reviewer/assignments/route.ts` — GET с admin-сессией → 500 (NEXT_REDIRECT). Добавлен ранний return 403 для isAdmin.
- **Инфраструктура**:
  - `scripts/clear-test-db.ts` — исправлены snake_case имена таблиц
  - `reset-test-db.sh` — in-place очистка БД (без удаления файла)
  - `src/lib/rate-limit.ts` — namespace Map, MAX_ATTEMPTS=1000 в dev
  - Playwright-тесты: исправлены regex, waitForResponse, Mermaid timeout
- **Пропущены (UX gap)**: FormulaInserter, Live-preview, Vote (не реализованы)
- **Отчёт**: [REPORT_2.md](testing/reports/REPORT_2.md)
- **Валидация**: `npm run build` OK (0 ошибок TypeScript)

### Фаза 18: Ревью фаз 14–17 (Done)
- **Найдено**: 0 P0, 1 P1, 1 P2, 3 P3
- **Исправлено**:
  1. **P1** `mermaid.tsx:55–59` — XSS: сообщение об ошибке вставлялось в `innerHTML` через шаблонную строку без экранирования. Заменено на `createElement + textContent`.
  2. **P2** `diagram.tsx:61` — SVG от Kroki API рендерился без санитизации (`dangerouslySetInnerHTML`). Добавлена функция `sanitizeSvg()` — strip `<script>`, `on*` атрибуты, `javascript:` href; применяется перед записью в кэш.
- **P3 backlog**:
  - `article-video.tsx` — нет `<track>` для субтитров (WCAG 1.2.2); добавить prop `track?`
  - SEO — нет `og:video` на статьях с `<ArticleVideo>`; нужно поле в схеме или парсинг
  - `article-image.tsx` — `<img>` вместо `next/image`; нужен `unoptimized` или size props
- **Валидация**: `npm run build` OK (0 ошибок TypeScript)

### Фаза 20: Типографическая система (Done)
- **Что сделано**:
  - Шрифтовая пара с Кириллицей: **Playfair Display** (display, h1–h3) + **Manrope** (body, UI)
  - Подключены через `next/font/google` с subsets `["latin", "cyrillic"]`, CSS-переменные `--font-playfair` / `--font-manrope` на `<html>`
  - В `@theme inline` добавлены `--font-display`, `--font-sans`, `--font-mono` → Tailwind-утилиты `font-display`, `font-sans`, `font-mono`
  - Type scale в `:root`: `--type-h1`…`--type-code` (размеры), `--leading-*` (line-height), `--tracking-*` (letter-spacing) для каждого уровня
  - Prose-стили обновлены: добавлен `.prose h1`, обновлены `.prose h2`/`.prose h3` (font-display + leading + tracking), добавлен `.prose h4`
  - `font-display` применён к: логотипу nav, h3 в article-card, h1 на `/blog`, h1 на `/blog/[slug]`, h1 на страницах логина (`/login`, `/admin/login`)
  - `body { font-family: var(--font-sans) }` — тело Manrope
  - Моно-стек в prose унифицирован через `var(--font-mono)`
- **Валидация**: `npm run build` OK (79 роутов, 0 ошибок TypeScript)
- **Файлы**:
  - `src/app/layout.tsx` — импорт Playfair_Display + Manrope, .variable на `<html>`
  - `src/app/globals.css` — @theme fonts, :root type scale, prose h1/h2/h3/h4, body font
  - `src/components/nav.tsx` — `font-display` на логотипе
  - `src/components/article-card.tsx` — `font-display` на h3
  - `src/app/blog/page.tsx` — `font-display` на h1
  - `src/app/blog/[slug]/page.tsx` — `font-display` на h1 статьи
  - `src/app/admin/login/login-form.tsx` — `font-display` на h1
  - `src/app/login/page.tsx` — `font-display` на h1

### Фаза 20: Цветовая система (Done)
- **Что сделано**:
  - Акцент: **Teal** (`#0f766e` light / `#2dd4bf` dark) — заменил синий (#2563eb / #3b82f6)
  - Семантические токены: `success`, `warning`, `danger`, `info` (+ `-bg`, `-border` варианты) в `:root` и `.dark` через CSS-переменные
  - Тёмная тема: фон `#111111` (не чистый чёрный), поверхности `#1e1e1e` / `#161616`; все dark-значения соответствуют WCAG AA ≥4.5:1
  - `@theme inline` дополнен токенами → Tailwind-утилиты `text-danger`, `bg-success-bg`, `border-warning-border`, `text-info` и т.д.
  - Устранены все `dark:` префиксы в `.tsx` компонентах (кроме `dark:prose-invert` — стандарт Tailwind Typography)
  - Устранены все `text-red-500`, `text-green-600/400`, `text-yellow-*`, `bg-green-100`, `bg-red-100` и аналоги (~40+ файлов)
  - Shiki темы `github-dark`/`github-light` оставлены — нейтральны, совместимы с teal-акцентом; `code-bg` перекрыт через `var(--code-bg)`
- **Валидация**: `npm run build` OK (79 роутов, 0 ошибок TypeScript)
- **Ключевые файлы**:
  - `src/app/globals.css` — полная цветовая система: `:root`, `.dark`, `@theme` токены
  - `src/components/difficulty-badge.tsx`, `article-voting.tsx`, `review/verdict-badge.tsx` — семантика
  - `src/components/review/diff-view.tsx`, `version-warning.tsx`, `review-progress.tsx` — семантика
  - `src/components/comments/comment-item.tsx`, `comment-form.tsx` — семантика
  - `src/app/admin/(protected)/articles/page.tsx`, `users/page.tsx` — статусные бейджи
  - `src/app/author/(protected)/articles/[id]/page.tsx`, `admin/(protected)/articles/[id]/page.tsx` — все UI-состояния
### Фаза 21: Layout публичных страниц (Done)
- **Что сделано (сводка по 4 суб-шагам)**:
  - **21a — Nav + Homepage + Footer**:
    - `nav.tsx` → async Server Component: sticky backdrop-blur, auth-aware (портал/logout/войти), NotificationBadge
    - `nav-mobile-menu.tsx` — новый client-компонент (hamburger, Server Action logout prop)
    - `page.tsx` — editorial homepage для гостей (hero + featured article + 2-col grid), redirects для ролей сохранены
    - `footer.tsx` → async Server Component: profile.links (GitHub/Telegram/Website), profile.name
  - **21b — ArticleCard + /blog**:
    - `article-card.tsx` — aspect-video cover, bookmark overlay on hover, rating/author/tags, `hover:-translate-y-0.5`, all new props optional
    - `blog/page.tsx` — 2-col grid, SQL subqueries для rating/bookmarkCount, author info, bookmark personalization
  - **21c — Страница статьи + TOC**:
    - `blog/[slug]/page.tsx` — cover before title, `font-extrabold text-5xl`, single-line meta (дата·автор·время·difficulty), engagement row after prose, `lg:grid-cols-[1fr_220px]`
    - `toc.tsx` — `xl→lg` breakpoint, `text-xs`, active indicator via `border-l-2 border-accent`, `sticky top-20`
  - **21d — Остальные публичные страницы**:
    - `authors/[slug]/page.tsx` — circular avatar с border-2, display font, SVG иконки для GitHub/Telegram/Website, SubscribeButton с проверкой подписки, ArticleCard grid
    - `(reader)/bookmarks/page.tsx` — ArticleCard grid, empty state (SVG bookmark icon + текст)
    - `author/notifications`, `reviewer/notifications` — accent bg снижен до `bg-accent/5` (консистентно с reader)
    - `login/page.tsx`, `admin/login/login-form.tsx` — blog name «devblog» display font сверху, subtitle под ним
- **Валидация**: `npm run build` OK на каждом суб-шаге
- **Файлы** (16):
  - Layout: `nav.tsx`, `nav-mobile-menu.tsx`, `footer.tsx`
  - Страницы: `page.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx`, `authors/[slug]/page.tsx`, `(reader)/bookmarks/page.tsx`
  - Компоненты: `article-card.tsx`, `toc.tsx`
  - Уведомления: `author/notifications/page.tsx`, `reviewer/notifications/page.tsx`
  - Логин: `login/page.tsx`, `admin/login/login-form.tsx`

### Фаза 22: Layout панелей управления (Done)
- **Что сделано (3 суб-шага)**:
  - **22a — Admin панель**:
    - Dashboard: stats cards с `font-display` числами, `bg-elevated`, без shadow; quick actions «Новая статья» + «Все статьи»
    - Articles table: zebra-striping (`even:bg-muted/20`), hover `bg-elevated`
    - Users table: zebra-striping, hover `bg-elevated`; `isBlocked`/`commentingBlocked` индикаторы (danger/warning бейджи); role badges (reviewer=purple, author=accent, reader=muted); исправлена опечатка «Ревьер» → «Ревьюер»
    - Article edit: `bg-red-500` → `bg-danger`, `bg-yellow-500` → `bg-warning`, `bg-blue-600` → `bg-accent`; assignments table hover `bg-elevated`
    - Notifications: `bg-accent/20` → `bg-accent/5` (консистентно с 21d)
  - **22b — Author панель**:
    - Dashboard: stats cards с `font-display`, `bg-elevated`, `rounded-xl`; grid `grid-cols-2 sm:grid-cols-3`; CTA «Написать статью» + «Все мои статьи»
    - Articles list: zebra-striping, hover `bg-elevated`
    - Article edit: `bg-yellow-600/500` → `bg-warning`, `bg-red-500` → `bg-danger`, `bg-blue-600` → `bg-accent`; assignments table hover `bg-elevated`
  - **22c — Reviewer панель**:
    - Dashboard: cards `bg-elevated rounded-xl`, `font-display` числа
    - Assignments list: cards `rounded-xl`, hover `bg-elevated`
    - Assignment detail & versions: уже использовали семантические цвета — без изменений
- **Валидация**: `npm run build` OK на каждом суб-шаге
- **Файлы** (10):
  - Admin: `page.tsx`, `articles/page.tsx`, `users/page.tsx`, `articles/[id]/page.tsx`, `notifications/page.tsx`
  - Author: `page.tsx`, `articles/page.tsx`, `articles/[id]/page.tsx`
  - Reviewer: `page.tsx`, `assignments/page.tsx`

### Фаза 23: Анимации и micro-interactions (Done)
- **Что сделано**:
  - **globals.css**: 5 новых keyframes (`fadeInUp`, `pulse-badge`, `bookmark-pop`, `spin-in`, copy-button `.copied svg`), `.animate-in` с stagger delay через CSS custom property `--index`, `prefers-reduced-motion: reduce` override, body `transition: background-color/color 0.3s` для плавной смены темы, базовый `button, a` transition 0.15s
  - **Карточки статей**: `ArticleCard` получил prop `index`, класс `.animate-in` и `--index` через style — stagger-анимация на `/`, `/blog`, `/bookmarks`
  - **Scroll progress bar**: новый клиентский компонент `scroll-progress.tsx` — fixed top-0, h-[3px], bg-accent, z-[51], rAF-throttled; интегрирован в `blog/[slug]/page.tsx`
  - **CopyButton**: CSS-only анимация `.copied svg` через fadeInUp 0.2s
  - **TOC**: `transition-colors` → `transition-[color,border-color] duration-200` на кнопках навигации
  - **BookmarkButton**: SVG fill через CSS-классы `fill-current`/`fill-none` + `transition-[fill]`, pop-анимация `bookmark-pop` при переходе в bookmarked (через useRef для направления)
  - **NotificationBadge**: `motion-safe:animate-[pulse-badge_2s_ease-in-out_infinite]` на badge
  - **ThemeToggle**: `motion-safe:animate-[spin-in_0.3s_ease-out]` на обоих SVG (sun/moon)
  - **Empty states** (6 страниц): добавлены SVG-иконки + centered layout (`py-20, flex-col items-center`) по паттерну bookmarks — `/blog`, reader/admin/author/reviewer notifications, reviewer assignments
- **Валидация**: `npm run build` OK
- **Файлы** (16):
  - CSS: `globals.css`
  - Компоненты: `article-card.tsx`, `scroll-progress.tsx` (новый), `toc.tsx`, `bookmark-button.tsx`, `notification-badge.tsx`, `theme-toggle.tsx`
  - Страницы: `page.tsx` (home), `blog/page.tsx`, `blog/[slug]/page.tsx`, `bookmarks/page.tsx`, reader `notifications/page.tsx`, admin `notifications/page.tsx`, author `notifications/page.tsx`, reviewer `notifications/page.tsx`, reviewer `assignments/page.tsx`

### Фаза 24: Responsive + Accessibility + Визуальный аудит (Done)

**Scope**: Responsive layout, accessibility, визуальная консистентность, обновление тест-кейсов и тест-плана.

**Суб-шаги**: 24a → 24b → 24c → 24d → 24e

#### 24a — Responsive + Accessibility (реализация)

**Responsive** (breakpoints: 375px, 768px, 1024px):

1. Nav: mobile (<768px) — hamburger/compact menu
2. `/` (главная): hero и карточки stack вертикально на mobile
3. `/blog`: карточки 1col mobile → 2col desktop
4. `/blog/[slug]`: TOC — `<details>` на mobile, sticky sidebar на >1024px
5. `/authors/[slug]`: аватар + info stack вертикально
6. Review split-pane (`reviewer/assignments/[id]`, `author/articles/[id]/review`): stack вертикально на mobile
7. Admin таблицы: `overflow-x-auto` на mobile
8. `EditorWithPreview`: right/left layout скрыты на mobile, bottom only
9. Формы: full-width inputs на mobile
10. Комментарии: уменьшить indent вложенности на mobile

**Accessibility**:

1. `src/app/layout.tsx`: skip-to-content ссылка (`<a href="#main-content" class="sr-only focus:not-sr-only ...">Перейти к содержимому</a>`), `id="main-content"` на `<main>`
2. Icon-only кнопки — `aria-label`:
   - ThemeToggle: «Переключить тему»
   - CopyButton: «Скопировать код»
   - NotificationBadge: «Уведомления»
   - ShareButton: «Поделиться»
   - BookmarkButton: «Добавить в закладки» / «Убрать из закладок»
   - Vote buttons: «Голос за» / «Голос против»
3. `focus-visible`: `ring-2 ring-offset-2` с accent-цветом на всех интерактивных элементах
4. `prefers-reduced-motion`: все анимации из фазы 23 отключаются
5. Images: alt text на cover images и аватарах

**Валидация**: `npm run build`

#### 24b — design-watcher (аудит визуальной консистентности)

`@design-watcher` — полный аудит визуального качества после UI-рефакторинга фаз 20–24a:

- Grep hardcoded цвета вне CSS-переменных
- Grep запрещённые шрифты
- Grep `box-shadow` (кроме focus-ring)
- Grep отсутствие `aria-label` на icon-only кнопках
- `npm run build`
- Исправить P0 автоматически

#### 24c — code-reviewer (ревью кода UI-изменений)

`@code-reviewer` — ревью всех изменений фаз 20–24a:

- Фокус: client-компоненты (`useEffect` cleanup, hydration), CSS-переменные (не пропущены ли dark-mode), TypeScript-типы
- Отчёт P0/P1/P2/P3 → фиксить P0 и P1

#### 24d — security-reviewer (безопасность UI-изменений)

`@security-reviewer` — аудит безопасности изменений фаз 20–24a:

- Особое внимание: новые client-компоненты (scroll-progress, mobile menu), `dangerouslySetInnerHTML`, event listeners, `aria-*` атрибуты
- Проверка auth bypass, XSS, секреты, валидация → фиксить CRITICAL/HIGH

#### 24e — Обновление тест-кейсов и тест-плана

Используется скилл `qa-test-planner`. Задача: обновить тестовую документацию после UI/UX рефакторинга фаз 20–24.

1. **`testing/TEST-PLAN.md`** — обновить:
   - Секция «UI/UX тестирование» в In Scope
   - Entry criteria: «CSS-переменные, нет hardcoded цветов»
   - Exit criteria: «Responsive на 375/768/1024px, a11y checklist пройден»

2. **`testing/test-cases/TC-UI.md`** — новый файл, 15 тест-кейсов:
   - TC-UI-001: Skip-to-content ссылка
   - TC-UI-002: Dark/light тема
   - TC-UI-003: Mobile nav (375px)
   - TC-UI-004: Mobile карточки статей (375px)
   - TC-UI-005: Mobile TOC (375px)
   - TC-UI-006: Mobile split-pane ревью (375px)
   - TC-UI-007: Mobile таблицы admin (375px)
   - TC-UI-008: Focus-visible
   - TC-UI-009: Reduced motion
   - TC-UI-010: Aria-labels на icon-only кнопках
   - TC-UI-011: Page load анимации (desktop)
   - TC-UI-012: Scroll progress bar
   - TC-UI-013: Empty states
   - TC-UI-014: Hover states
   - TC-UI-015: Cover image в карточках

   Формат: как в `testing/test-cases/TC-GUEST.md` (Priority, Type, Preconditions, Steps с Expected, Post-conditions)

3. **`testing/smoke/SMOKE-SUITE.md`** — добавить:
   - SMOKE-UI-001: Dark/light тема переключается без сломанных элементов
   - SMOKE-UI-002: Mobile nav работает (375px)
   - SMOKE-UI-003: Skip-to-content ссылка (Tab → видна)

4. **`testing/regression/REGRESSION-SUITE.md`** — добавить секцию «UI/UX Regression» со ссылками на TC-UI-001..TC-UI-015

**Ожидаемые файлы**:
- `testing/TEST-PLAN.md` — обновлён
- `testing/test-cases/TC-UI.md` — новый, 15 TC
- `testing/smoke/SMOKE-SUITE.md` — +3 smoke теста
- `testing/regression/REGRESSION-SUITE.md` — +секция UI/UX

#### Валидация фазы 24

- [ ] `npm run build` OK
- [ ] design-watcher: 0 P0
- [ ] code-reviewer: 0 P0
- [ ] security-reviewer: 0 CRITICAL
- [ ] Тестовая документация обновлена

### Фаза 25: E2E прогон UI + UX ревью + финализация

**Scope**: Прогон UI тест-кейсов через playwright-tester, UX ревью ключевых flows, SEO-проверка, запись результатов.

**Суб-шаги**: 25a → 25b → 25c → 25d → 25e

#### 25a — playwright-tester (smoke UI)

Набор тестов:
1. Стандартный smoke из `testing/smoke/SMOKE-SUITE.md`
2. Новые UI smoke: SMOKE-UI-001, SMOKE-UI-002, SMOKE-UI-003
3. Из `testing/test-cases/TC-UI.md`: TC-UI-001 (skip-to-content), TC-UI-002 (dark/light), TC-UI-003 (mobile nav), TC-UI-008 (focus-visible)

Вердикт: GO / NO-GO → `testing/reports/REPORT_UI.md`

#### 25b — UX ревью (ручной проход)

5 ключевых flows через Playwright MCP:
1. Гость читает статью: `/` → `/blog/[slug]`
2. Читатель взаимодействует: login reader → комментарий, голос, закладка → `/bookmarks`
3. Автор создаёт статью: login author → `/author` → черновик → публикация
4. Ревьюер проводит ревью: login reviewer → `/reviewer` → назначение
5. Админ управляет: `/admin/login` → dashboard, статьи, пользователи, настройки

Итог → `testing/reports/REPORT_UX.md`

#### 25c — SEO-проверка

- `generateMetadata()` не пропали при рефакторинге
- Один `h1` на страницу
- `og:image` работает
- `alt` на всех изображениях
- JSON-LD на `/blog/[slug]` не сломан

#### 25d — Фикс найденных проблем

- P0 из REPORT_UI.md
- P0 из REPORT_UX.md
- HIGH из SEO-проверки
- `npm run build` после каждого фикса

#### 25e — Повторный прогон + запись результатов

1. Повторный smoke → `testing/reports/REPORT_UI_FINAL.md`
2. Обновить PLAN.md (статусы + история)
3. Обновить CLAUDE.md (новые конвенции)

#### Результаты фазы 25 (Done)

**25a — playwright-tester (smoke UI)**:
- Первый прогон: 21/24 (1 P0, 2 P2) → **NO-GO**
- P0: `onClick` в Server Component `article-card.tsx:153` → /blog 500
- P2: skip-link не перемещает фокус (нет `tabIndex={-1}` на `<main>`)
- Отчёт: `testing/reports/REPORT_UI.md`

**25b — UX ревью**:
- 5/5 flows пройдены
- P0: `POST /api/articles/[id]/comments` → 500 (нет articleVersions для seed-статей)
- Отчёт: `testing/reports/REPORT_UX.md`

**25c — SEO-проверка**:
- 1 HIGH: `src/app/page.tsx` — пропал `generateMetadata()` при рефакторинге
- 1 MEDIUM: 2 декоративных `alt=""` — не требует фикса (WAI-ARIA correct)
- h1, og:image, JSON-LD — PASS

**25d — Фиксы** (4 исправления):
1. P0: Удалён `onClick` из `article-card.tsx` (Server Component)
2. P2: Добавлен `tabIndex={-1}` на `<main>` в `layout.tsx`
3. HIGH SEO: Восстановлен `generateMetadata()` в `page.tsx`
4. P0: Auto-create initial `articleVersion` в `comments/route.ts`
- `npm run build` OK после каждого фикса

**25e — Повторный прогон**:
- 21/21 PASS → **GO**
- Отчёт: `testing/reports/REPORT_UI_FINAL.md`
- PLAN.md и CLAUDE.md обновлены

#### Валидация фазы 25

- [x] `npm run build` OK
- [x] playwright-tester: GO (21/21)
- [x] SEO: 0 HIGH (после фикса)
- [x] PLAN.md и CLAUDE.md обновлены

**Файлы** (изменённые/созданные):
- `src/components/article-card.tsx` — удалён onClick
- `src/app/layout.tsx` — tabIndex на main
- `src/app/page.tsx` — generateMetadata восстановлен
- `src/app/api/articles/[id]/comments/route.ts` — auto-create initial version
- `testing/reports/REPORT_UI.md` — отчёт 25a
- `testing/reports/REPORT_UX.md` — отчёт 25b
- `testing/reports/REPORT_UI_FINAL.md` — финальный прогон
- `PLAN.md` — обновлён
- `CLAUDE.md` — обновлён (секция Design System)
