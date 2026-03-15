---
description: "Drizzle ORM patterns for database queries and schema changes"
globs: ["src/lib/db/**/*.ts", "src/app/api/**/*.ts"]
---

# Drizzle ORM Patterns

## Driver
- Single driver: `@libsql/client` — works with both local SQLite (`file:blog.db`) and Turso in production
- All queries are async (`await`) — no synchronous API
- Connection config: `TURSO_CONNECTION_URL` env var, falls back to `file:blog.db`

## IDs
- Use ULID (`import { ulid } from "ulid"`) for all new record IDs
- ULIDs are sortable by creation time — no need for separate `ORDER BY created_at` when ordering by ID

## JSON Fields
- `tags` stored as JSON string array: `JSON.stringify(["tag1", "tag2"])`
- `links` stored as JSON string object: `JSON.stringify({ github: "..." })`
- Always wrap `JSON.parse()` in try-catch when reading these fields — corrupt data shouldn't crash the page

## Schema Changes
- Edit schema in `src/lib/db/schema.ts`
- Generate migration: `npx drizzle-kit generate`
- Apply migration: `npx drizzle-kit migrate`
- Dialect is `turso` in drizzle.config.ts

## Seed
- Seed script: `npx tsx src/lib/db/seed.ts`
- Uses `onConflictDoUpdate` for idempotent seeding
- MUST call `process.exit(0)` at end — libsql client keeps connection alive
