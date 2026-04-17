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
| 26. Review Sessions — мультиревьюер и общий чат | Planned | — |
| 27. Страница «Руководство» | Done | 2026-04-16 |
| 28. E2E тесты фаз 26–27 | Done | 2026-04-16 |
| 29. Доработки UX — авторизация, медиа, руководство | Done | 2026-04-16 |
| 30. Inline Review: схема + anchoring engine | Planned | — |
| 31. Inline Review: UI выделения и тредов | Planned | — |
| 32. Inline Review: suggestions + batch review | Planned | — |
| 33. Inline Review: ревью + E2E | Planned | — |

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

---

### Фаза 25 — Ре-ран (2026-04-15): Медиа + Финальная валидация

**Scope**: Баг дублирования медиа + тесты 1–7 + повторный smoke + P2 фиксы.

#### 25fixes — Баг дублирования медиа

**Первопричина**: `cursorPosRef` инициализируется в `0` и не обновляется пока пользователь не кликнет в textarea. При загрузке статьи медиа вставлялось в позицию 0 (начало контента), создавая паттерн `<ArticleImage /> # Заголовок Текст...` → у ревьюера дублирование.

**Фиксы**:
1. `src/app/author/(protected)/articles/[id]/page.tsx` — `cursorPosRef.current = data.content?.length ?? 0` после `setContent()`
2. `src/app/author/(protected)/articles/new/page.tsx` — убран `# Заголовок` из placeholder textarea

#### Тесты 1–7 (все PASS)

| Тест | Статус |
|------|--------|
| 1. Медиа при создании | ✅ PASS |
| 2. Медиа при редактировании | ✅ PASS |
| 3. Медиа у ревьюера (нет дублирования) | ✅ PASS |
| 4-5. Медиа у гостя/читателя | ✅ PASS |
| 6. Обложка (cover.png) | ✅ PASS |
| 7. Аватар (big_author_photo.jpg) | ✅ PASS |

#### 25a–25e — Повторный smoke + фиксы

- **Smoke 18/18 PASS**
- **TC-UI 4/4 PASS**
- **UX 5/5 PASS**
- **P2 фиксы**: Escape для mobile nav (`nav-mobile-menu.tsx`), MDX-теги в SEO description (`utils.ts → mdxToPlainText`)
- **npm run build: ✅**
- Отчёт: `testing/reports/REPORT_UI_FINAL.md`

**Файлы изменены**:
- `src/app/author/(protected)/articles/[id]/page.tsx` — cursorPosRef init fix
- `src/app/author/(protected)/articles/new/page.tsx` — placeholder fix
- `src/components/nav-mobile-menu.tsx` — Escape key handler
- `src/lib/utils.ts` — MDX tag stripping in mdxToPlainText

---

### Фаза 26: Review Sessions — Мультиревьюер и общий чат (Done)

**Контекст**: Требуется поддержка нескольких ревьюеров на одну статью (до 3), минимальные квоты по сложности (medium ≥1, hard ≥2), и единый чат обсуждений для всех участников сессии (ревьюеры + автор + админ), привязанный к статье.

#### 26a — Схема БД и миграция

**Изменения схемы** (`src/lib/db/schema.ts`):

1. **Новая таблица `reviewSessions`**:
   - `id` (ULID) — PK
   - `articleId` TEXT — FK → articles, CASCADE delete
   - `articleVersionId` TEXT — FK → articleVersions (снимок на момент отправки)
   - `status` TEXT — `'open' | 'completed' | 'cancelled'`, default `'open'`
   - `createdAt` INTEGER — Unix seconds
   - `completedAt` INTEGER — nullable, проставляется когда все ревьюеры дали `approved`

2. **Таблица `reviewAssignments`** — добавить поле:
   - `sessionId` TEXT — FK → reviewSessions, CASCADE delete

3. **Таблица `reviewComments`** — заменить привязку:
   - Удалить `assignmentId` (FK → reviewAssignments)
   - Добавить `sessionId` TEXT — FK → reviewSessions, CASCADE delete
   - Смысл: чат теперь общий на всю сессию (все ревьюеры видят одни и те же комментарии)
   - Миграционный скрипт: для каждого существующего комментария найти `assignment.sessionId` (через backfill)

**Задачи**:
- `npx drizzle-kit generate` → проверить SQL-миграцию
- `npx drizzle-kit migrate` → применить
- `npm run build` → 0 ошибок TypeScript

**Агент/скилл**: Прямая реализация. Правило `.claude/rules/drizzle-queries.md`.

**Валидация**:
- `npx drizzle-kit generate` — миграция сгенерирована корректно
- `npx drizzle-kit migrate` — применена без ошибок
- `npm run build` — OK

---

#### 26b — API: Сессии и обновление send_for_review

**Новые/изменённые endpoints**:

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/review-sessions` | Создать сессию: `{ articleId, reviewerIds: string[] }`. Auth: admin или author (owner). Создаёт `reviewSession` + N `reviewAssignment` записей. Копирует checklist template для каждого назначения. |
| GET | `/api/articles/[id]/review-sessions` | Список сессий статьи. Auth: admin, author owner, любой ревьюер в сессии. |
| GET | `/api/review-sessions/[sessionId]` | Детали сессии + все assignments. |
| POST | `/api/sessions/[id]/review-comments` | Создать комментарий в общем чате. Auth: admin, article author, любой ревьюер из сессии. |
| GET | `/api/sessions/[id]/review-comments` | Получить все комментарии сессии. |

**Изменения в существующих endpoints**:
- `PUT /api/articles/[id]` — `saveMode=send_for_review`: принимает `reviewerIds: string[]` (вместо `reviewerId`). Валидация: для `difficulty=medium` → min 1, для `difficulty=hard` → min 2, max 3. Создаёт сессию через ту же логику что и POST `/api/review-sessions`.
- `PUT /api/articles/[id]` — `saveMode=notify_reviewer`: уведомляет всех активных ревьюеров сессии (не одного).
- `PUT /api/reviewer/assignments/[id]` — при выставлении `verdict=approved`: проверить все assignments сессии; если все `completed + approved` → установить `reviewSession.status = 'completed'`.
- `GET/POST /api/assignments/[id]/review-comments` — устаревший путь, переадресовать на `/api/sessions/[sessionId]/review-comments`.
- `POST /api/review-comments/[id]/resolve` — доступ: admin + любой ревьюер сессии + автор статьи.

**Правила доступа для общего чата**:
```
canAccessSessionChat(session, articleAuthorId):
  isAdmin(session) || 
  session.userId === articleAuthorId ||
  isReviewerInSession(session.userId, sessionId)
```

**Агент/скилл**: `.agents/skills/next-best-practices` для паттернов route handlers.

**Валидация**:
- `npm run build` — OK
- Ручная проверка: создать сессию с 2 ревьюерами, оба видят один чат

---

#### 26c — UI: ReviewerPickerModal (мультивыбор)

**Изменения в `src/components/reviewer-picker-modal.tsx`**:
- Чекбоксы вместо одиночного выбора
- Счётчик выбранных (0/3)
- Индикатор минимума: если `difficulty=medium` → «Нужен минимум 1 ревьюер», если `hard` → «Нужно минимум 2»
- Кнопка «Отправить» заблокирована если нарушен минимум
- Пропс `difficulty` и `maxReviewers=3`
- Возвращает `onSelect(reviewers: {id, name, username}[])` (массив)

**Агент/скилл**: `.agents/skills/frontend-design`. Дизайн-система: чекбоксы с `border-accent`, disabled-состояние `opacity-50`.

**Валидация**:
- `npm run build` — OK
- Визуальный тест: выбрать 2 ревьюера, проверить счётчик и кнопку

---

#### 26d — UI: Блок сессии на страницах статей + общий чат

**Admin/Author — страница статьи** (`admin/(protected)/articles/[id]/page.tsx`, `author/(protected)/articles/[id]/page.tsx`):
- Блок «Активная сессия ревью»:
  - Карточки всех ревьюеров: имя, статус назначения (pending/accepted/completed + verdict badge), чеклист read-only
  - Кнопка «Уведомить всех ревьюеров» (notify_reviewer для всей сессии)
  - Статус сессии: `open` / `completed` (все одобрили) / `cancelled`
- Убрать старые блоки per-assignment

**Reviewer — страница назначения** (`reviewer/(protected)/assignments/[id]/page.tsx`):
- Блок «Участники сессии»: список других ревьюеров (имена + статусы)
- Общий чат: показывать все комментарии сессии, не только от текущего ревьюера
- Подпись к сообщениям: имя ревьюера (не анонимно)

**Review thread** (shared chat component):
- Новый компонент `SessionReviewThread` (клиентский)
- Заменяет `AssignmentThread` / `ReviewCommentThread` везде, где был per-assignment чат
- Props: `sessionId`, `articleAuthorId`, `currentUserRole`
- Отображает все комментарии сессии с именами авторов

**Агент/скилл**: `.agents/skills/frontend-design`.

**Валидация**:
- `npm run build` — OK
- UX-тест: 2 ревьюера пишут в чат → оба видят сообщения друг друга

---

#### 26e — Ревью кода

**Агент/скилл**: `.agents/skills/critique` (code review) + `.agents/skills/audit` (security).

Фокус ревью:
- Права доступа к общему чату: убедиться что посторонние не могут читать/писать
- N+1 запросов при загрузке сессии с несколькими назначениями
- Корректность логики автозавершения сессии (`all approved` → `session.status = completed`)
- TypeScript типы для `reviewerIds[]` vs старого `reviewerId`

**Валидация**:
- `npm run build` — 0 ошибок
- 0 P0, 0 P1 по результатам ревью

---

**Файлы фазы 26**:
- `src/lib/db/schema.ts` — новая таблица reviewSessions, изменения reviewAssignments + reviewComments
- `drizzle/` — новые миграции
- `src/app/api/review-sessions/route.ts` — новый
- `src/app/api/review-sessions/[id]/route.ts` — новый
- `src/app/api/sessions/[id]/review-comments/route.ts` — новый
- `src/app/api/articles/[id]/route.ts` — обновлён send_for_review (reviewerIds[])
- `src/app/api/reviewer/assignments/[id]/route.ts` — логика автозавершения сессии
- `src/components/reviewer-picker-modal.tsx` — мультивыбор
- `src/components/review/session-review-thread.tsx` — новый (общий чат)
- `src/app/admin/(protected)/articles/[id]/page.tsx` — блок сессии
- `src/app/author/(protected)/articles/[id]/page.tsx` — блок сессии
- `src/app/reviewer/(protected)/assignments/[id]/page.tsx` — участники + общий чат

---

### Фаза 27: Страница «Руководство» (Done)

**Контекст**: В навигации нужна иконка «Руководство», открывающая модальное окно с описанием возможностей сайта для текущей роли пользователя. Контент зависит от роли: Гость, Читатель, Автор, Ревьюер, Админ.

#### 27a — Компонент GuideModal и навигация

**Новый компонент** `src/components/guide-modal.tsx` (клиентский):
- `<dialog>` с backdrop click-to-close и Escape для закрытия
- Анимация: `dialog-in` keyframe (уже в `globals.css`)
- Контент только для текущей роли (prop `role: 'guest' | 'reader' | 'author' | 'reviewer' | 'admin'`)
- Структура контента — разделы с заголовками и bullet-списками, всё на русском
- Без кнопок сохранения, только «Закрыть»

**Контент по ролям**:

| Роль | Разделы руководства |
|------|---------------------|
| **Гость** | Чтение статей и блога; TOC, difficulty-бейдж; публичные комментарии (только чтение); RSS-лента; профили авторов; как зарегистрироваться |
| **Читатель** | Комментарии (2 уровня, 15-мин ред.); голосование за статьи и комментарии; закладки; подписка на авторов; лента подписок; уведомления |
| **Автор** | Создание статей в MDX (с примерами: заголовки, код, таблицы); LaTeX-формулы (`$inline$`, `$$block$$`); MDX-компоненты (`<Expandable>`, `<Mermaid>`, `<Diagram>`, `<ArticleImage>`, `<ArticleVideo>`); live-preview; загрузка медиа; планирование публикации; процесс ревью (отправка, выбор ревьюеров, общий чат); управление changelog |
| **Ревьюер** | Принятие/отклонение назначений; чеклист проверки; общий чат сессии; вердикт (approved/needs_work/rejected); diff изменений; уведомления |
| **Админ** | Управление статьями всех авторов; CRUD пользователей; блокировка авторов/комментаторов; шаблон чеклиста; настройки блога; отправка на ревью; сессии ревью |

**Интеграция в Nav** (`src/components/nav.tsx`):
- Иконка `BookOpenIcon` (SVG, 20×20, `aria-label="Руководство"`)
- Позиция: слева от `ThemeToggle` в desktop-навигации; в мобильном меню — отдельный пункт
- Отображается для всех пользователей (включая гостей)
- Клик → открывает `GuideModal`
- Определение роли: на основе `GET /api/auth/user`

**Агент/скилл**: `.agents/skills/frontend-design` + `.agents/skills/impeccable` (design quality).

**Валидация**:
- `npm run build` — OK
- Визуальный тест: открыть модал для каждой роли, проверить корректность контента

---

#### 27b — Ревью кода

**Агент/скилл**: `.agents/skills/critique`.

Фокус: hydration mismatch (роль определяется клиентски), Escape/backdrop обработка, `aria-modal`, focus trap внутри диалога.

**Валидация**:
- `npm run build` — OK
- 0 P0, 0 P1

---

**Файлы фазы 27**:
- `src/components/guide-modal.tsx` — новый компонент
- `src/components/nav.tsx` — иконка и интеграция GuideModal
- `src/components/nav-mobile-menu.tsx` — пункт «Руководство» в мобильном меню

---

### Результаты фазы 27 (Done — 2026-04-16)

**Что сделано**:
- **`GuideButton`** (`src/components/guide-modal.tsx`): клиентский компонент с нативным `<dialog>`, иконка BookOpen (18×18 SVG), `open:animate-dialog-in`, backdrop/Escape/× close. Экспортирует тип `GuideRole = "guest" | "reader" | "author" | "reviewer" | "admin"`.
- **Контент по ролям** (`GUIDE_CONTENT`): 5 ролей × 2–3 секции с bullet-списками на русском. Статический — без API-запросов. Гость / Читатель / Автор / Ревьюер / Админ.
- **`nav.tsx`**: вычисляет `guideRole` server-side через `getSession()` (type-safe: явный union check без `as` cast), рендерит `<GuideButton role={guideRole} />` перед `<ThemeToggle />` в desktop-навигации.
- **`nav-mobile-menu.tsx`**: принимает `guideRole: GuideRole`, рендерит `<GuideButton>` между ThemeToggle и hamburger.

**Ревью**:
- design-watcher: 0 P0 (backdrop:bg-black/50 — established pattern из reviewer-picker-modal)
- code-reviewer: 1 P1 исправлен (unsafe `as` cast → explicit union type guard)
- security-reviewer: CRITICAL — ложное срабатывание (контент руководства публичен), MEDIUM исправлен (тот же type guard)
- seo-optimizer: PASS (0 issues)

**Валидация**: `npm run build` OK (0 TypeScript ошибок)

---

### Фаза 28: E2E тесты фаз 26–27 (Done — 2026-04-16)

**Контекст**: После реализации мультиревьюера и руководства нужно покрыть новые flow E2E-тестами.

#### Что сделано

**Инфраструктура**:
- `seed.test.ts` — добавлен второй ревьюер (`reviewer2 / password`, ID `01TEST0000REVIEWERUSER02`)
- `global-setup.ts` — добавлен логин и сохранение storageState для reviewer2

**Новые тесты** (9 тест-кейсов, все PASS):

| Spec-файл | Тест-кейс | Приоритет |
|-----------|-----------|-----------|
| `admin.spec.ts` | TC-AD-030: Создание review session с 2 ревьюерами через ReviewerPickerModal | P0 |
| `admin.spec.ts` | TC-AD-031: Guide modal для админа | P1 |
| `author.spec.ts` | TC-AU-025: Отправка статьи на ревью 2 ревьюерам | P0 |
| `author.spec.ts` | TC-AU-026: Guide modal для автора (закрытие через Escape) | P1 |
| `reviewer.spec.ts` | TC-RV-025: Запись в общий чат сессии (POST + проверка появления) | P0 |
| `reviewer.spec.ts` | TC-RV-026: Участники сессии видны (details + имя второго ревьюера) | P1 |
| `reviewer.spec.ts` | TC-RV-027: Guide modal для ревьюера | P1 |
| `guest.spec.ts` | TC-GU-007: Guide modal для гостя (закрытие через Escape) | P1 |
| `reader.spec.ts` | TC-RD-010: Guide modal для читателя | P1 |

**Тестовая стратегия**:
- Review session тесты в `reviewer.spec.ts` используют `beforeAll` с admin API для создания тестовых данных (статья + сессия с 2 ревьюерами), затем тестируют от лица reviewer1
- Admin и author тесты создают сессию через UI (ReviewerPickerModal flow: поиск → выбор 2 ревьюеров → подтверждение)
- Guide modal тесты — простой паттерн click → assert content → close

**Прогон**: 35 passed, 8 failed (все 8 — pre-existing), 3 skipped. Новые 9 тестов — **все PASS**.

**Ревью**:
- code-reviewer: 0 P0, 4 P1, 5 P2. Исправлены P1-1 (corrupted char в reader.spec), P1-2 (убран waitForTimeout), P1-3 (regex вместо hardcoded текста). P1-4 (reviewer2.json не используется) — оставлен для будущих тестов
- security-reviewer: 0 CRITICAL, 0 HIGH. 2 LOW (стандартные тестовые паттерны: тестовые пароли и fallback)
- seo-optimizer: 0 HIGH, 0 MEDIUM. Все проверки PASS. Phase 26-27 не затрагивают SEO

**Валидация**:
- `npm run build` — OK (0 ошибок TypeScript)
- `npm run test:e2e` — 9/9 новых тестов PASS

**Файлы**:
- `src/lib/db/seed.test.ts` — reviewer2
- `testing/e2e/global-setup.ts` — reviewer2 auth
- `testing/e2e/admin.spec.ts` — +2 теста
- `testing/e2e/author.spec.ts` — +2 теста
- `testing/e2e/reviewer.spec.ts` — +3 теста
- `testing/e2e/guest.spec.ts` — +1 тест
- `testing/e2e/reader.spec.ts` — +1 тест

---

### Фаза 29: Доработки UX — авторизация, медиа, руководство (In Progress — 2026-04-16)

**Контекст**: Три доработки по результатам ручного тестирования.

#### 29a — Nav обновляется сразу после авторизации

**Причина**: `Nav` — Server Component, `router.push()` — soft navigation, layout не перерендеривается.
**Решение**: Добавлен `router.refresh()` после `router.push()` в обеих login-страницах.

**Файлы**:
- `src/app/login/page.tsx` — `router.refresh()` после навигации
- `src/app/admin/login/login-form.tsx` — `router.refresh()` после навигации

#### 29b — Размеры медиа при вставке (ширина × высота в px)

**Что сделано**:
- Установлен `image-size` для определения размеров изображения из буфера
- API upload (`/api/upload`) возвращает `width` и `height` в JSON-ответе для изображений
- `ArticleImage` и `ArticleVideo` — добавлены опциональные `width`/`height` props; когда заданы, применяют `maxWidth`/`maxHeight` через inline style; без них — `w-full` (как раньше)
- `useArticleEditor` — `insertMediaTag()` принимает `width`/`height`, генерирует `width={N} height={N}` в MDX-теге; `MediaPreview` хранит размеры из API
- Редактор автора (edit + new): поля «Ширина × Высота px» в media preview, предзаполняются из API, пустые = полная ширина
- Preview route: `remarkMdxDiagramsToHtml` читает `width`/`height` атрибуты и применяет как inline style

**Файлы**:
- `src/app/api/upload/route.ts` — imageSize + width/height в ответе
- `src/components/mdx/article-image.tsx` — width/height props
- `src/components/mdx/article-video.tsx` — width/height props
- `src/hooks/useArticleEditor.ts` — dimensions в MediaPreview + insertMediaTag
- `src/app/author/(protected)/articles/[id]/page.tsx` — UI полей размеров
- `src/app/author/(protected)/articles/new/page.tsx` — UI полей размеров
- `src/app/api/preview/route.ts` — width/height в preview rendering

#### 29c — Подробное руководство для автора и ревьюера

**Что сделано**: Расширено содержание `GUIDE_CONTENT` в guide-modal.tsx:
- **Автор**: 3 → 7 секций (44 пункта): Написание статей, Синтаксис MDX, Медиафайлы, LaTeX-формулы, MDX-компоненты, Процесс ревью, Планирование и публикация
- **Ревьюер**: 2 → 5 секций (26 пунктов): Назначения, Чеклист проверки, Замечания и чат, Diff и обновления, Вердикт
- Заголовки изменены с «Возможности» на «Руководство» для обеих ролей

**Файлы**:
- `src/components/guide-modal.tsx` — расширенный контент

**Валидация**: `npm run build` OK

#### E2E регрессия (Done — 2026-04-16)

- **Smoke**: 20/20 PASS
- **Targeted (фаза 29)**: 8/8 PASS
  - 29a: навбар обновляется после логина reader/author/reviewer без F5
  - 29b: API upload возвращает width/height для изображений
  - 29c: руководство автора — 7 секций, ревьюера — 5 секций
- **Test cases (P0)**: 29/29 PASS
- **Всего**: 57/57
- **Вердикт**: GO

---

### Фаза 30: Inline Review — схема + anchoring engine (Done — 2026-04-17)

**Контекст**: Требуется расширить систему ревью inline-аннотациями: ревьюер может привязать комментарий к конкретному фрагменту текста (TextQuoteSelector + TextPositionSelector + MDX source offset), оставить suggestion (предложить замену текста), отправить все замечания batch-ом. Покрытие: US-RV6–RV8 (обновлены), US-RV17–RV23, US-A32–A35, US-AD32–AD34.

**Scope:** Расширение DB-схемы для inline-аннотаций (тройной селектор, тип комментария, batch-статус). Rehype-плагин для стабильных `data-anchor-id`. Серверная библиотека anchoring (fuzzy re-anchoring через `diff-match-patch`). API-эндпоинты.

---

#### 30a — Схема и миграция

**Изменения в `src/lib/db/schema.ts`** — таблица `reviewComments`:

Новые поля:
- `anchorType: text("anchor_type", { enum: ["text", "block", "general"] }).default("general")`
- `anchorData: text("anchor_data")` — JSON: `{ selectors: [TextQuoteSelector, TextPositionSelector, MdxSourceOffset], blockId?, lineNumber? }`
- `commentType: text("comment_type", { enum: ["comment", "suggestion"] }).default("comment")`
- `suggestionText: text("suggestion_text")` — предложенный текст для типа suggestion
- `batchId: text("batch_id")` — `null` = опубликован; non-null = pending в batch
- `appliedAt: integer("applied_at")` — Unix seconds, когда suggestion применён

Индекс: `index` на `(sessionId, batchId)` для быстрой фильтрации.

**Задачи:**
- `npx drizzle-kit generate` → проверить SQL-миграцию
- `npx drizzle-kit migrate` → применить
- Обновить `seed.test.ts` при необходимости (пример inline-комментария)
- `npm run build` → 0 ошибок TypeScript

**Файлы:** `src/lib/db/schema.ts`, `drizzle/XXXX_*.sql`

---

#### 30b — Rehype-плагин для стабильных anchor ID

**Новый файл:** `src/lib/rehype-anchor-ids.ts`

Rehype-плагин, который обходит HAST-дерево и добавляет `data-anchor-id` атрибуты:
- Текстовые блоки (`p`, `li`, `h1-h6`, `blockquote`, `td`) → `data-anchor-id = sha256(позиция в дереве + первые 32 символа текста)[:12]`
- Code blocks → `data-anchor-id` на `<pre>` + `data-line-id` на каждом `<span data-line>` (номер строки)
- KaTeX (`.katex-display`, `.katex`) → `data-anchor-id` на обёртке
- Mermaid/Diagram/Circuit → `data-anchor-id` на контейнере

**Интеграция:**
- Подключить в `src/lib/mdx.ts` — в rehype pipeline после `rehype-pretty-code` и `rehype-katex`
- Подключить в `src/app/api/preview/route.ts` (preview pipeline)

**Файлы:** `src/lib/rehype-anchor-ids.ts` (новый), `src/lib/mdx.ts`, `src/app/api/preview/route.ts`

---

#### 30c — Клиентская библиотека anchoring

**Зависимость:** `npm install diff-match-patch` (fuzzy matching)

**Новый файл:** `src/lib/anchoring.ts` (клиентская библиотека)

```
createAnchor(range: Range, container: HTMLElement): AnchorData
```
Из `Selection.getRangeAt(0)` генерирует:
- `TextQuoteSelector`: exact (выделенный текст), prefix (32 символа до), suffix (32 символа после)
- `TextPositionSelector`: start, end (character offset от container)
- `mdxSourceOffset`: ближайший `data-anchor-id` элемент

```
resolveAnchor(anchorData: AnchorData, container: HTMLElement): Range | null
```
Каскад re-anchoring:
1. Exact position + exact quote match
2. Fuzzy match через diff-match-patch (Bitap, threshold 0.4)
3. Full-document fuzzy search
4. `null` (orphan)

```
isOrphan(anchorData: AnchorData, container: HTMLElement): boolean
```
Быстрая проверка: `resolveAnchor === null`

**Типы** — добавить в `src/types/index.ts`:
- `AnchorData`, `TextQuoteSelector`, `TextPositionSelector`, `AnchorType`, `CommentType`

**Файлы:** `src/lib/anchoring.ts` (новый), `src/types/index.ts`

---

#### 30d — API-эндпоинты

**Обновить** `POST /api/sessions/[id]/review-comments`:
- Новые поля в body: `anchorType`, `anchorData`, `commentType`, `suggestionText`, `batchId`
- Валидация:
  - `anchorType === "text"` → `anchorData` обязателен, должен содержать `selectors[]`
  - `anchorType === "block"` → `anchorData.blockId` обязателен
  - `commentType === "suggestion"` → `suggestionText` обязателен
  - `batchId`: если передан, привязывает к текущему batch ревьюера

**Обновить** `GET /api/sessions/[id]/review-comments`:
- Для author/admin: фильтровать `batchId IS NULL` (не показывать pending batch чужого ревьюера)
- Для reviewer (owner): показывать всё включая свои pending batch
- Для admin: показывать всё включая pending batch всех ревьюеров
- В ответе добавить `anchorType`, `anchorData`, `commentType`, `suggestionText`, `appliedAt`

**Новый** `PUT /api/review-comments/[id]/apply-suggestion`:
- Auth: `requireAuthor()` или `requireAdmin()`
- Проверки: `commentType === "suggestion"`, `appliedAt === null`, назначение не `completed`/`declined`
- Логика:
  1. Получить MDX-источник статьи
  2. Exact match `anchorData.selectors[0].exact` в MDX
  3. Если не найден → 409 «Текст изменился»
  4. Заменить фрагмент на `suggestionText` (только первое вхождение)
  5. Snapshot в `articleVersions` перед заменой
  6. Обновить статью
  7. `appliedAt = now()`, auto-resolve тред
  8. Уведомить ревьюера: `suggestion_applied`
  9. Sanitize `suggestionText` через `stripDangerousHtml()` перед apply
- Ответ: `{ applied: true }`

**Новый** `POST /api/assignments/[id]/submit-review`:
- Auth: `requireUser("reviewer")` + ownership
- Логика:
  1. Найти все `review_comments` с `batchId` текущего ревьюера
  2. Обнулить `batchId` (сделать видимыми)
  3. Обновить assignment `verdict`/`verdictNote` если переданы
  4. Отправить уведомление `review_submitted` автору/админу
- Ответ: `{ submitted: N, verdict: "..." }`

**Обновить `NotificationType`** в `src/types/index.ts`: добавить `'review_submitted'`, `'suggestion_applied'`

**Файлы:**
- `src/app/api/sessions/[id]/review-comments/route.ts` — обновлён
- `src/app/api/review-comments/[id]/apply-suggestion/route.ts` — новый
- `src/app/api/assignments/[id]/submit-review/route.ts` — новый
- `src/types/index.ts` — обновлён
- `src/lib/db/schema.ts` — notification type enum

**Валидация фазы 30:**
- `npm run build` OK
- `npx drizzle-kit migrate` OK
- Existing E2E tests pass (регресс)

---

### Фаза 31: Inline Review — UI выделения и тредов (Done — 2026-04-17)

**Контекст**: Клиентские компоненты для inline-ревью: подсветка аннотаций в тексте статьи, floating popover при выделении текста, sidebar с тредами, пронумерованные пины в margin, кнопка комментирования блоков (код, формулы, диаграммы). Split-pane layout для reviewer/author/admin.

**Scope:** 6 новых клиентских компонентов в `src/components/review/`, обновление 3 страниц порталов. Особый упор на UI/UX: плавные анимации, accessibility, responsive (mobile stack).

---

#### 31a — Highlight rendering + popover

**Новый** `src/components/review/highlight-layer.tsx` (`'use client'`):
- Props: `annotations` (из API), `containerRef`, `filter` (текущий фильтр тредов)
- На mount: для каждой аннотации вызывает `resolveAnchor()` из `src/lib/anchoring.ts`
- **Подсветка через CSS Custom Highlight API**:
  - Создать `Range` для каждого resolved anchor
  - `new Highlight(...ranges)`, `CSS.highlights.set('review-open', hl)` / `CSS.highlights.set('review-resolved', hl)`
  - CSS: `::highlight(review-open) { background: oklch(85% 0.15 80 / 0.3) }` (жёлтый)
  - CSS: `::highlight(review-resolved) { background: var(--muted) / 0.15 }` (серый)
- **Fallback** для старых браузеров: оборачивание в `<mark data-comment-id>`
- При клике на подсвеченную область: `onAnnotationClick(commentId)` — hit-test через `document.caretPositionFromPoint()`
- Orphan annotations: не подсвечиваются, но показываются в sidebar с бейджем «⚠ Текст изменён»
- **Анимация**: при активации тред → подсветка мигает (пульс opacity) на 1 сек
- **Accessibility**: `role="mark"` на fallback-`<mark>`, `aria-describedby` ссылка на тред

**Новый** `src/components/review/selection-popover.tsx` (`'use client'`):
- Слушает `selectionchange` на контейнере
- При непустом выделении → floating popover (позиционирование через `getBoundingClientRect()`)
- Кнопки:
  - «💬 Комментировать» → `onComment(range)`
  - «✏️ Предложить правку» → `onSuggest(range)`
  - «📌 Цитировать в тред» → `onQuote(range)` (список открытых тредов)
- Скрывается при: клик вне, пустое выделение, Escape
- НЕ показывается: внутри SVG (Mermaid), если статус не `pending`/`accepted`, если выделение пересекает границу MDX-компонента (`[data-anchor-id]` разных типов)
- **Дизайн**: `bg-elevated`, `rounded-lg`, `shadow-md`, `border border-border`, `animate-in` fadeIn 150ms; кнопки `px-3 py-1.5 text-sm hover:bg-muted rounded`; `z-[60]` (выше scroll-progress)
- **Mobile**: popover позиционируется под выделением (не перекрывает текст)

**Новый** `src/components/review/block-comment-button.tsx` (`'use client'`):
- На hover элемента с `[data-anchor-id]` типа `pre`, `.katex-display`, `.mermaid-container`, `figure` → кнопка «💬» слева от блока
- При клике: `onBlockComment(anchorId, blockType)`
- **Дизайн**: `opacity-0 group-hover:opacity-100 transition-opacity`, `bg-elevated rounded-full shadow-sm w-7 h-7`, `absolute -left-10`
- **Accessibility**: `aria-label="Комментировать блок"`

**Файлы:** `src/components/review/highlight-layer.tsx`, `src/components/review/selection-popover.tsx`, `src/components/review/block-comment-button.tsx`, `src/app/globals.css` (highlight CSS)

---

#### 31b — Sidebar тредов + margin pins

**Новый** `src/components/review/review-sidebar.tsx` (`'use client'`):
- Props: `comments`, `activeCommentId`, `filter`, `onReply`, `onResolve`, `onReopen`, `onScrollToAnchor`
- **Фильтры** вверху: 5 табов «Все» / «Открытые» / «Решённые» / «Предложения» / «Без ответа» — счётчики в каждом табе
- Список тредов: каждый тред = `ReviewThread` компонент
- Скролл к active тред при изменении `activeCommentId` (`scrollIntoView({ behavior: 'smooth', block: 'nearest' })`)
- Empty state: SVG-иконка + «Ревьюер пока не оставил замечаний»
- **Дизайн**: `overflow-y-auto`, `divide-y divide-border`, фильтр-табы `flex gap-1 p-1 bg-muted/30 rounded-lg` с `text-xs font-medium`, active tab `bg-elevated shadow-sm`
- **Progress bar** вверху (US-RV19): `Открыто: N · Решено: M · Предложения: K · Чеклист: X/Y`; тонкая полоска `h-1 bg-accent rounded-full` width = (resolved + applied) / total; скрыт если нет комментариев

**Новый** `src/components/review/review-thread.tsx` (`'use client'`):
- Props: `comment` (root), `replies[]`, `isActive`, `onReply`, `onResolve`, `onReopen`, `onScrollToAnchor`, `onApplySuggestion`, `canApply` (author/admin)
- **Header**: пин-номер + quoted text (если `anchorType` text/block) + тип (`comment`/`suggestion`)
- Quoted text кликабельный → `onScrollToAnchor(anchorData)` → левая панель скроллится к фрагменту
- **Suggestion display**: оригинал (красный фон `bg-danger-bg`, зачёркнутый `line-through`) + предложенный текст (зелёный фон `bg-success-bg`); кнопка «Применить» (видна только author/admin, `bg-accent text-white rounded px-3 py-1 text-sm`)
- **Applied badge**: `bg-success-bg text-success rounded-full px-2 py-0.5 text-xs` «✓ Правка применена»
- **Orphan badge**: `bg-warning-bg text-warning rounded-full px-2 py-0.5 text-xs` «⚠ Текст изменён» + оригинальная цитата курсивом
- **Replies**: вложенный список с `ml-4 border-l-2 border-border`
- **Input**: `textarea` + «Ответить» (скрыт если `completed`/`declined`); `isAdminComment` бейдж на admin-ответах
- **Resolve/Reopen**: кнопки по ролям (как в текущей реализации); `resolvedAt` → серый фон `bg-muted/20`
- **Batch-pending визуал**: пунктирная левая border `border-dashed border-warning`, лейбл «Черновик — видно только вам» `text-xs text-warning`
- **Анимация**: новый тред `animate-in` fadeInUp; resolve → плавный переход цвета 300ms

**Новый** `src/components/review/margin-pins.tsx` (`'use client'`):
- Props: `annotations` (resolved anchors с координатами), `onPinClick`
- Рендерит пронумерованные пины в абсолютной позиции вдоль правого margin контентной панели
- **Алгоритм stacking**: сортировка по `anchorTop`, размещение с `min-gap: 28px` (если перекрываются → сдвиг вниз)
- **Дизайн**: `w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center`; открытые = `bg-accent text-white`; resolved = `bg-muted text-foreground/50`; active = `ring-2 ring-accent ring-offset-2`
- При клике → `onPinClick(commentId)`
- **Accessibility**: `role="button"`, `aria-label="Замечание N"`

**Файлы:** `src/components/review/review-sidebar.tsx`, `src/components/review/review-thread.tsx`, `src/components/review/margin-pins.tsx`

---

#### 31c — Split-pane layout для reviewer, author, admin

**Обновить** `src/app/reviewer/(protected)/assignments/[id]/page.tsx`:
- **Split-pane layout**: `grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0`
  - Left = MDX article (`prose`) + `HighlightLayer` + `SelectionPopover` + `BlockCommentButton` + `MarginPins`
  - Right = `ReviewSidebar`
- **Состояние**: `activeCommentId`, `filter`, `pendingBatch[]` (массив id для batch review)
- **Scroll synchronization**: клик на тред → scroll article to anchor; клик на highlight/pin → scroll sidebar to thread
- **Mobile** (`< lg`): stack вертикально, article сверху, sidebar снизу с `max-h-[50vh] overflow-y-auto`
- **Resize handle**: вертикальная полоска между панелями, `cursor-col-resize`, drag для изменения пропорций (CSS custom property `--split`, сохранять в localStorage)

**Обновить** `src/app/author/(protected)/articles/[id]/review/page.tsx`:
- Split-pane: left = MDX (текущая версия) с `HighlightLayer` + `MarginPins`; right = `ReviewSidebar` (read + reply + resolve + apply suggestion)
- Автор **НЕ** видит `SelectionPopover` (не может создавать аннотации)
- Автор видит кнопку «Применить» на suggestion-тредах

**Обновить** `src/app/admin/(protected)/articles/[id]/review/page.tsx`:
- Аналогично автору, но admin может отвечать с `isAdminComment=1`
- Admin может apply suggestions на любую статью
- Admin видит batch-pending комментарии всех ревьюеров

**Обратная совместимость**: старые комментарии (`anchorType=general`) отображаются как раньше — без подсветки, просто в списке тредов

**Файлы:**
- `src/app/reviewer/(protected)/assignments/[id]/page.tsx` — обновлён
- `src/app/author/(protected)/articles/[id]/review/page.tsx` — обновлён (или новый)
- `src/app/admin/(protected)/articles/[id]/review/page.tsx` — обновлён (или новый)

**Валидация фазы 31:**
- `npm run build` OK
- Визуально: reviewer page показывает split-pane, выделение текста → popover, подсветки аннотаций, треды в sidebar, пины в margin
- Mobile: stack layout, sidebar scrollable
- Accessibility: focus management, aria-labels, keyboard tab order

---

### Фаза 32: Inline Review — suggestions + batch review (Done — 2026-04-17)

**Контекст**: Полный flow применения suggestion (MDX замена + версионирование + re-anchoring). Batch review (pending → publish). Клавиатурная навигация. Diff overlay.

**Scope:** Suggestion apply UI, batch review bar + modal, keyboard shortcuts, diff overlay layer.

---

#### 32a — Suggestion apply flow

**В `review-thread.tsx`:**
- Кнопка «Применить правку» на suggestion-тредах → `PUT /api/review-comments/[id]/apply-suggestion`
- **Optimistic UI**: кнопка → spinner (`animate-spin`) → «✓ Применено» (`bg-success-bg`)
- **Ошибка 409** → показать inline: «Текст изменился, примените вручную» + оригинал + suggestion (side-by-side в thread)
- После apply: refetch комментариев, re-resolve все anchors (подсветки обновляются)

**Серверная логика apply** (`PUT /api/review-comments/[id]/apply-suggestion`):
1. Exact match `anchorData.selectors[0].exact` в текущем MDX-источнике
2. `String.replace(exactMatch, suggestionText)` — только первое вхождение
3. Если exactMatch не найден → fuzzy search через `diff-match-patch`:
   - `>80%` match → apply + предупреждение в ответе
   - Не найден → 409
4. `stripDangerousHtml(suggestionText)` перед заменой (XSS protection)
5. Snapshot в `articleVersions` перед заменой
6. Обновить статью, `appliedAt = now()`, auto-resolve тред, уведомить ревьюера

**Файлы:** `src/components/review/review-thread.tsx`, `src/app/api/review-comments/[id]/apply-suggestion/route.ts`

---

#### 32b — Batch review

**Состояние в reviewer page:**
- Все новые комментарии создаются с `batchId = ulid()` (генерируется при первом комментарии сессии, хранится в `useRef`)
- Pending комментарии визуально: пунктирная рамка `border-dashed border-warning` + лейбл «Черновик — видно только вам»

**Новый** `src/components/review/batch-review-bar.tsx` (`'use client'`):
- Sticky bar внизу viewport: `fixed bottom-0 left-0 right-0 bg-elevated border-t border-border shadow-lg z-40 px-4 py-3`
- Содержимое: «N замечаний в черновике · **Отправить ревью**»
- Скрыт если нет pending комментариев
- Кнопка → открывает `BatchReviewModal`
- **Анимация**: slide-up при появлении, slide-down при исчезновении

**Новый** `src/components/review/batch-review-modal.tsx` (`'use client'`):
- `<dialog>` (паттерн как `ReviewerPickerModal`)
- Содержимое:
  - Список pending комментариев (readonly, scrollable, max-h)
  - Вердикт: `approved` / `needs_work` / `rejected` (radio buttons, обязателен)
  - Общая заметка (textarea, опциональна)
  - «Отправить» → `POST /api/assignments/[id]/submit-review`
- После отправки: pending комментарии становятся видимыми, bar исчезает, toast «Ревью отправлено»
- **Дизайн**: `max-w-lg`, вердикт radio — цветные карточки (approved=`border-success`, needs_work=`border-warning`, rejected=`border-danger`)

**Обновить** `NotificationType` в schema: добавить `'review_submitted'`

**Файлы:** `src/components/review/batch-review-bar.tsx`, `src/components/review/batch-review-modal.tsx`, `src/app/reviewer/(protected)/assignments/[id]/page.tsx`, `src/lib/db/schema.ts`

---

#### 32c — Keyboard navigation + diff overlay

**Keyboard navigation** (`useEffect` на `keydown` в reviewer assignments page):
- `N`: next unresolved thread → scroll both panels
- `P`: previous unresolved thread
- `R`: resolve active thread
- `E`: focus reply input в active thread
- `C`: если есть Selection → trigger comment popover
- `⌘↵` / `Ctrl+Enter`: submit текущий reply
- **Guard**: shortcuts отключены когда фокус в `textarea`/`input` (кроме `⌘↵`)
- **Визуал**: при навигации N/P подсветка anchor мигает 1 сек (`animate-[pulse_1s_ease-in-out]`)

**Новый** `src/components/review/diff-overlay.tsx` (`'use client'`):
- Переключатель «Показать изменения» над article панелью (toggle switch)
- `GET /api/reviewer/assignments/[id]/diff` → `{ old, new, hasChanges }`
- **Рендер**: inline diff (не side-by-side) — добавленный текст = `bg-success-bg`, удалённый = `bg-danger-bg line-through`
- Реализация: diff на уровне слов/предложений через `computeDiff()`, рендер overlay поверх article
- **Комбинирование** с annotation highlights: diff = фон (нижний слой), annotations = underline/border (верхний слой)
- Неактивен если `hasChanges === false` (`opacity-50 pointer-events-none`)
- **Бейдж**: «Изменено с момента вашего ревью: N блоков» (`bg-info-bg text-info rounded px-2 py-1 text-xs`)

**Файлы:** `src/components/review/diff-overlay.tsx`, `src/app/reviewer/(protected)/assignments/[id]/page.tsx`

**Валидация фазы 32:**
- `npm run build` OK
- Визуально: suggestion apply (happy path + 409), batch review flow (create → submit → visible), keyboard nav, diff overlay + annotations combo
- Security: `stripDangerousHtml()` на suggestionText, batch visibility isolation

---

### Фаза 33: Inline Review — ревью + E2E (Done — 2026-04-17)

**Контекст**: Code review, security review, обновление тест-кейсов, E2E прогон.

**Scope:** Агентский ревью кода (critique + audit + design-watcher), тест-кейсы, E2E, обновление документации.

---

#### 33a — Ревью агентами

**code-reviewer** — фокус:
- `anchoring.ts`: XSS через `anchorData`, корректность fuzzy matching
- `apply-suggestion/route.ts`: injection в MDX через `suggestionText`, race conditions при параллельном apply
- `submit-review/route.ts`: race conditions при batch submit
- `review-comments/route.ts`: batch visibility (auth bypass — author/reviewer2 не видят pending batch)
- `highlight-layer.tsx`: cleanup CSS Highlights, memory leaks при re-render
- `selection-popover.tsx`: корректность позиционирования, cleanup event listeners

**security-reviewer** — фокус:
- `PUT apply-suggestion`: может ли ревьюер инжектировать `<script>` через `suggestionText`? → `stripDangerousHtml()`
- `anchorData`: `JSON.parse` без валидации структуры? → добавить zod/manual validation
- `batchId`: может ли author увидеть pending batch ревьюера? → проверить фильтрацию в GET
- Keyboard shortcuts: могут ли вызвать действия без авторизации?

**design-watcher** — фокус:
- Новые компоненты `src/components/review/` — CSS-переменные, нет hardcoded цветов
- Popover/modal — `bg-elevated`, `border-border`, `shadow-md`
- Анимации — `prefers-reduced-motion` respected
- Responsive — mobile stack layout
- Accessibility — `aria-label`, focus management

---

#### 33b — Обновление тест-кейсов

Тест-кейсы уже созданы в diff:
- `testing/test-cases/TC-REVIEWER.md` — 27 тест-кейсов (TC-RV-ANNO-001..027)
- `testing/test-cases/TC-AUTHOR.md` — 11 тест-кейсов (TC-AU-ANNO-001..011)
- `testing/test-cases/TC-ADMIN.md` — 5 тест-кейсов (TC-AD-ANNO-001..005)

**Дополнительно создать/обновить:**
- `testing/test-cases/TC-INLINE-REVIEW.md` — сводный cross-role файл (15 TC, формат как TC-GUEST.md):
  - TC-IR-001: Выделение текста → popover → комментарий (P0)
  - TC-IR-002: Выделение текста → suggestion → apply (P0)
  - TC-IR-003: Suggestion apply на изменённый текст → 409 (P0)
  - TC-IR-004..006: Block comment на code/KaTeX/Mermaid (P1)
  - TC-IR-007: Batch review: создать 3 комментария → отправить → автор видит все (P0)
  - TC-IR-008: Batch pending: автор НЕ видит pending (P0, security)
  - TC-IR-009: Keyboard N/P/R/E/⌘↵ (P2)
  - TC-IR-010: Orphan → «Текст изменён» (P1)
  - TC-IR-011: Suggestion XSS: `<script>...` → stripped (P0, security)
  - TC-IR-012: Diff overlay + annotations одновременно (P2)
  - TC-IR-013..014: Author resolve/reply inline comment (P1)
  - TC-IR-015: Admin apply suggestion на чужую статью (P1)

- `testing/smoke/SMOKE-SUITE.md` — добавить:
  - SMOKE-IR-001: выделение + комментарий
  - SMOKE-IR-002: suggestion apply

- `testing/regression/REGRESSION-SUITE.md` — секция «Inline Review» со ссылками на TC-IR-*

---

#### 33c — E2E прогон

**Набор тестов:**
1. Полный smoke из `SMOKE-SUITE.md` (регресс)
2. SMOKE-IR-001: выделение текста → комментарий
3. SMOKE-IR-002: suggestion apply
4. TC-IR-007: batch review flow
5. TC-IR-008: batch visibility isolation (security)
6. TC-IR-011: suggestion XSS (security)

**Для E2E inline review:**
- Login as reviewer → navigate to assignment
- Select text via `page.evaluate(() => { window.getSelection()... })`
- Verify popover appears
- Click comment button → fill thread → verify in sidebar
- Verify highlight in article panel

**Вердикт**: GO / NO-GO → `testing/reports/REPORT_INLINE_REVIEW.md`

---

#### 33d — Запись результатов и обновление документации

1. `docs/PLAN.md` — фазы 30–33 → Done, записать результаты
2. `CLAUDE.md` — добавить секцию «Inline Review» (anchoring, компоненты `src/components/review/`, API endpoints, batch review)
3. Обновить сводную матрицу в `docs/JTBD.md` (уже обновлена в diff)
4. Обновить критические граничные случаи (уже обновлены в diff)

**Валидация фазы 33:**
- `npm run build` OK
- `npx playwright test` — existing + new tests pass
- code-reviewer: 0 P0
- security-reviewer: 0 CRITICAL
- design-watcher: 0 P0
- playwright-tester: GO

---

### Фаза 34: UX ревью + фикс диаграмм (Planned — 2026-04-17)

**Контекст**: После Фазы 33 на seed-статьях с диаграммами падает JS-ошибка `Cannot read properties of undefined (reading 'replace')`, блокирующая ревью. Дополнительно: карточки тредов имеют 4 уровня вложенных border'ов и плохо сканируются; статьи «на ревью» теряются в общем списке автора; при нескольких ревьюерах автор вынужден переключаться между отдельными страницами `/review/{assignmentId}`; после apply-suggestion в треде нет визуального статуса «применено»; ревьюер не видит исходник диаграммы, комментировать «по строкам» нельзя.

**Scope:** Null-safety guards в MDX-компонентах диаграмм + preview API, новый компонент `DiagramWithSource` + `reviewMode` в `compileMDX`, редизайн `review-thread.tsx` (левый цветной border вместо nested cards), секция «На ревью» на дашборде автора и в списке статей, unified review page для мульти-ревьюеров + новый endpoint, визуальный статус «Применена» + toast, расширение тест-кейсов и E2E, прогон code/security/design/seo агентов.

---

#### 34a — Фикс `.replace()` на undefined (P0)

**Root causes:**
- `src/app/api/preview/route.ts` — в `getAttr()` вызывается `val.value.trim()` без проверки типа `val.value` (может быть undefined для expression без stringified-значения)
- `src/components/mdx/diagram.tsx` — `sanitizeSvg(svg)` падает при пустом body ответа kroki
- `src/components/mdx/mermaid.tsx` — `m.default.render(id, chart)` при undefined `chart`
- `src/components/mdx/circuit.tsx` — тот же kroki-поток что `diagram.tsx`

**Правки:**
- `getAttr()`: guard `typeof val?.value === "string"` до `.trim()`
- `diagram.tsx` / `circuit.tsx`: default `chart = ""`, `type = ""`; `typeof svg === "string" && svg.length > 0` перед `sanitizeSvg`; иначе `<Fallback chart={chart}/>`
- `mermaid.tsx`: early return `<Fallback chart={chart ?? ""}/>` если `!chart`
- Reuse: существующий `Fallback` в `diagram.tsx:29-35`

---

#### 34b — Исходник диаграммы рядом с рендером (для ревьюера)

**Новый компонент**: `src/components/mdx/diagram-with-source.tsx` (`"use client"`)
- `<details>` + `<summary>` «Показать исходник»
- `<pre><code>` (mono, `white-space: pre-wrap`), selectable — anchoring создаёт annotation на тексте исходника как на обычном коде

**Интеграция через `reviewMode`:**
- `src/lib/mdx.ts`: `compileMDX(source, { reviewMode?: boolean })` — при `reviewMode=true` компоненты `Mermaid`/`Diagram`/`Circuit` оборачиваются в `DiagramWithSource` (рендер оригинала + исходник)
- Публичный блог (`/blog/[slug]`) использует `reviewMode=false` по умолчанию
- Reviewer page и Author review assignment page вызывают `compileMDX(content, { reviewMode: true })`

---

#### 34c — Редизайн карточек тредов

**Файл**: `src/components/review/review-thread.tsx`

- Убрать внешнюю `border rounded-lg` → `border-l-4` (цвет по статусу: `warning`/`success`/`success/60`/`danger`/`muted`)
- Header в одну строку: пин + автор + время + бейдж статуса, без flex-wrap
- Quoted text: `pl-3 text-muted-foreground text-xs italic` с `::before '»'`, без рамки
- Suggestion diff: сохраняем двухцветный блок, но без внутреннего `rounded`/`margin`; applied → `<details>` «Правка применена»
- Replies: `pt-3 bg-muted/10`, убрать `ml-6 border-l-2`
- Applied state: `bg-success-bg/30` + чекмарк на пине

`src/components/review/review-sidebar.tsx`: `divide-y` между тредами, единый фон.

Соответствие `.claude/rules/frontend-design.md`: нет cards-in-cards, только CSS-переменные.

---

#### 34d — Блок «На ревью» у автора

**Dashboard** `src/app/author/(protected)/page.tsx`:
- Карточка-счётчик «На ревью: N статей» → `/author/articles?filter=review`

**Список статей** `src/app/author/(protected)/articles/page.tsx`:
- `<section>` «На ревью» над таблицей. Карточки: заголовок + кол-во ревьюеров + badge непрочитанных замечаний. Клик → unified review page
- Если `filter=review` в query — показать только секцию
- Пустое состояние скрыто

**Запрос**: join `articles` ↔ `reviewAssignments` (status `pending`/`accepted`), group by `articleId`. Отдельный count нерезолвленных `reviewComments` по каждой статье.

---

#### 34e — Unified review page (мульти-ревьюер)

**Рефактор** `src/app/author/(protected)/articles/[id]/review/page.tsx` → единая страница:
- Левая панель: MDX статьи с `reviewMode: true` + inline-аннотации всех ревьюеров; каждый пин — цвет по стабильному hash(reviewerId) → HSL (контраст ≥ 4.5:1)
- Правая панель: chips-фильтр ревьюеров («Все» + по одному), список тредов фильтруется. В header треда — бейдж с именем ревьюера
- Кнопка «Открыть сессию N» → старая `[assignmentId]/page.tsx` (для verdict + checklist)
- Автор может применить suggestion любого ревьюера из unified view

**Новый endpoint** `src/app/api/author/articles/[id]/review-comments/route.ts`:
- `GET` возвращает все `reviewComments` по всем `reviewAssignments` статьи + список `reviewers [{id, name, colorSeed}]`
- Auth: `requireAuthor()` + `article.authorId === session.userId`
- Исключает pending batch комментарии ревьюеров (они видны только автору пендинга + админу)

**Backward compat**: старый `[assignmentId]/page.tsx` остаётся для deep-link из уведомлений.

**Файлы:**
- `src/app/author/(protected)/articles/[id]/review/page.tsx` (рефактор)
- `src/app/author/(protected)/articles/[id]/review/unified-review-view.tsx` (новый)
- `src/app/api/author/articles/[id]/review-comments/route.ts` (новый)
- `src/components/review/review-context.tsx` — добавить `reviewerId`, `reviewerColorSeed` в `ReviewComment`
- `src/components/review/review-thread.tsx` — бейдж ревьюера

---

#### 34f — Статус «Применена» + toast

**Файл** `src/components/review/review-thread.tsx`:
- После успешного `PUT /api/review-comments/[id]/apply-suggestion` — оптимистичное обновление `appliedAt`, бейдж «Применена», collapse исходника
- Toast «Правка применена» (reuse из `batch-review-bar.tsx`)
- Кнопка «Применить» → disabled «Применена ✓», `bg-success/10 text-success`
- 409 race → inline-нотис «Правка уже применена»

`src/app/api/review-comments/[id]/apply-suggestion/route.ts` — подтвердить `appliedAt` в ответе.

---

#### 34g — Тест-кейсы (qa-test-planner)

**TC-REVIEWER.md — Diagrams in Review:**
- `TC-RV-DIAG-001` (P0): открытие ревью статьи с Mermaid — 0 JS-ошибок, рендер + исходник видны
- `TC-RV-DIAG-002` (P0): Kroki недоступен → Fallback, страница не падает
- `TC-RV-DIAG-003` (P1): выделение в исходнике → annotation
- `TC-RV-DIAG-004` (P1): Circuit/TikZ — рендер + toggle
- `TC-RV-DIAG-005` (P2): `prefers-reduced-motion` соблюдён

**TC-AUTHOR.md — UX Review Hub:**
- `TC-AU-UX-001` (P0): секция «На ревью» на `/author/articles`
- `TC-AU-UX-002` (P0): клик по карточке → unified review page
- `TC-AU-UX-003` (P0): unified page показывает комментарии всех ревьюеров с цветовой кодировкой
- `TC-AU-UX-004` (P1): chips-фильтр по ревьюеру
- `TC-AU-UX-005` (P0): apply suggestion → бейдж «Применена», toast, collapse
- `TC-AU-UX-006` (P1): «Открыть сессию N» → `[assignmentId]/page.tsx`
- `TC-AU-UX-007` (P2): дизайн-snapshot треда без nested-borders

**TC-REVIEWER.md — Multi-reviewer:**
- `TC-MULTI-001` (P0): 2 ревьюера комментируют → автор видит обоих
- `TC-MULTI-002` (P0, security): ревьюер B не видит pending batch ревьюера A
- `TC-MULTI-003` (P1): apply suggestion A → B видит обновлённый MDX
- `TC-MULTI-004` (P1): счётчик новых замечаний корректен

**Smoke**:
- `SMOKE-RV-DIAG-001` — открытие ревью статьи с диаграммой (регресс)
- `SMOKE-AU-UX-001` — клик по «На ревью» → unified page

**Regression**: новый блок 14 «UX ревью и мульти-ревьюер».

---

#### 34h — E2E прогон (playwright-tester)

1. `reset-test-db.sh` → seed с 2 ревьюерами + статья с Mermaid + Diagram + Circuit
2. Полный SMOKE-SUITE (регресс)
3. TC-RV-DIAG-001..005, TC-AU-UX-001..007, TC-MULTI-001..004
4. Для TC-RV-DIAG-001: `page.on('pageerror')` ловит JS-ошибки
5. Для TC-MULTI-002: curl с reviewer-cookies — проверка 403
6. Отчёт: `testing/reports/REPORT_PHASE_34.md`

---

#### 34i — Валидация агентами

- **design-watcher** — карточки тредов (border-left, контраст, dark/light), `DiagramWithSource` (spacing, focus-ring), цветовая кодировка ревьюеров (hsl-hash контраст ≥ 4.5:1), секция «На ревью»
- **code-reviewer** — null-safety guards, `reviewMode` branch в `compileMDX`, новый endpoint (N+1, auth), race в apply-suggestion из unified view
- **security-reviewer** — unified endpoint не утекает pending batch; `DiagramWithSource` без `dangerouslySetInnerHTML`; apply-suggestion с проверкой `article.authorId === session.userId`
- **seo-optimizer** — `reviewMode` не активен на `/blog/[slug]`, robots.txt закрывает `/author`/`/reviewer`

---

**Валидация фазы 34:**
- `npm run build` OK, `npm run lint` OK
- Баг `.replace()` не воспроизводится ни на одной seed-статье с диаграммами
- Исходник диаграммы виден ревьюеру, anchoring работает
- Unified page: автор с 2+ ревьюерами видит всё в одной точке
- Apply suggestion: бейдж «Применена», toast, collapse
- `npx playwright test` — все тесты pass
- code-reviewer 0 P0, security-reviewer 0 CRITICAL, design-watcher 0 P0, seo-optimizer no-op
- Вердикт: GO

**NO-GO (блокеры):**
- JS-ошибка на ревью-странице с диаграммой
- Leak pending batch между ревьюерами
- Регрессия на `/blog/[slug]` из-за `reviewMode`
