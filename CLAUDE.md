# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm run dev` — dev server (turbopack)
- `npm run build` — production build (use as primary validation)
- `npm run lint` — ESLint
- `npm run seed` — seed database (`npx tsx src/lib/db/seed.ts`)
- `npx drizzle-kit generate` — generate DB migrations after schema changes
- `npx drizzle-kit migrate` — apply migrations

## Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS v4
- Database: `@libsql/client` via Drizzle ORM — single driver for both dev (`file:blog.db`) and prod (Turso)
- MDX: `next-mdx-remote/rsc` + `rehype-pretty-code` (Shiki dual theme: github-dark/github-light)
- Auth: `iron-session` + `bcryptjs` (single admin user, session cookie)
- Theme: `next-themes` (dark/light)
- Deployment: Vercel + Turso

## Architecture

### Database (`src/lib/db/`)
- `index.ts` — libsql client, reads `TURSO_CONNECTION_URL`/`TURSO_AUTH_TOKEN` from env, falls back to `file:blog.db`
- `schema.ts` — Drizzle schema: `articles`, `articleVersions`, `profile`, `profileVersions`
- `drizzle.config.ts` — dialect is `"turso"` (not `"sqlite"`)
- All timestamps are **Unix seconds** (not milliseconds). Use `Math.floor(Date.now() / 1000)`
- Tags and profile links stored as **JSON strings** — always `JSON.parse()` with try-catch on read

### Auth (`src/lib/auth.ts`)
- `getSession()` / `requireAdmin()` — iron-session helpers
- `SESSION_SECRET` env var is **required** (throws if missing)
- Admin routes use route group `src/app/admin/(protected)/` — layout calls `requireAdmin()`
- Login page at `src/app/admin/login/` is **outside** the protected group (avoids redirect loop)

### MDX (`src/lib/mdx.ts`)
- `compileMDX(source)` — compiles MDX string with custom components map
- Custom components: `Expandable` (collapsible content blocks)
- Code blocks: rehype-pretty-code handles highlighting, `CodeCopyButtons` client component adds copy buttons via DOM manipulation on `[data-rehype-pretty-code-figure]`

### API pattern (`src/app/api/`)
- All admin API routes call `await requireAdmin()` first
- Article updates save a **version snapshot before updating** (in `articleVersions`)
- Slug uniqueness validated on create and update
- IDs generated with `ulid()`
- Dynamic route params are `Promise<{...}>` in Next.js 16 — must `await params`

## Conventions
- All DB queries go through Drizzle — no raw SQL
- API routes in `src/app/api/`, admin pages in `src/app/admin/(protected)/`
- Custom MDX components in `src/components/mdx/`, registered in `src/lib/mdx.ts`
- UI text is in Russian

## Environment variables (`.env.local`)
- `SESSION_SECRET` — 32+ char random string (required)
- `ADMIN_PASSWORD_HASH` — bcrypt hash with `$` escaped as `\$` (dotenv-expand interprets `$`)
- `TURSO_CONNECTION_URL` — Turso DB URL (optional in dev, required in prod)
- `TURSO_AUTH_TOKEN` — Turso auth token (optional in dev, required in prod)

## Gotchas
- Bcrypt hashes in `.env.local` need `\$` escaping (e.g., `\$2b\$10\$...`) — dotenv-expand treats `$` as variable reference
- Blog pages use `dynamic = "force-dynamic"` — no static generation
- MDX is compiled on every render (no cache layer)
- Seed script needs `process.exit()` because libsql client keeps connection alive
- RunCode component was removed — code renderers must use rehype-pretty-code pipeline, not standalone Shiki

## Claude Code Ecosystem

### Agents (`.claude/agents/`)
- `team-lead` — orchestrator, delegates to specialized agents (opus)
- `code-reviewer` — read-only security/correctness review (sonnet)
- `mdx-developer` — MDX component creation and integration (sonnet)
- `db-manager` — Drizzle schema, migrations, seeds (sonnet)
- `prompt-designer` — agent/prompt creation and verification (sonnet)

### Skills (`.claude/skills/`)
- `/review` — run code review on changed files
- `/seed` — run database seed script
- `/deploy-check` — pre-deployment verification checklist
- `/new-article` — create a new draft article

### Rules (`.claude/rules/`)
- `security.md` — always-on security rules (secrets, XSS, auth)
- `next-app-router.md` — App Router conventions (globs: `src/app/**`)
- `drizzle-queries.md` — Drizzle ORM patterns (globs: `src/lib/db/**`, `src/app/api/**`)
- `mdx-components.md` — MDX component conventions (globs: `src/components/mdx/**`)
