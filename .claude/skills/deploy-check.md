---
name: deploy-check
description: "Pre-deployment verification checklist for Vercel + Turso. Use this skill before deploying, when the user says 'ready to deploy?', 'check deploy', 'pre-deploy', 'can we ship this?', or when preparing environment variables for production. Catches build failures, missing env vars, and Turso incompatibilities before they break in prod."
---

# Deploy Check

Run a comprehensive pre-deployment verification to catch issues before they reach Vercel.

## Why this exists

The project uses `@libsql/client` as a unified driver for local SQLite and Turso in production. Several things can go wrong: build failures, missing env vars, synchronous API calls that work locally but fail with Turso's async-only driver, and bcrypt hashes with unescaped `$` that get mangled by dotenv-expand.

## Steps

1. **Build** — Run `npm run build`. This catches TypeScript errors, missing imports, and SSR issues. If it fails, stop and fix before continuing.

2. **Environment variables** — Check that `.env.local` documents all required vars. For Vercel, these need to be set in the dashboard:
   - `SESSION_SECRET` — 32+ char random string for iron-session encryption
   - `ADMIN_PASSWORD_HASH` — bcrypt hash (remember: `$` must be escaped as `\$` in .env files because dotenv-expand interprets `$` as variable references)
   - `TURSO_CONNECTION_URL` — Turso database URL (e.g., `libsql://db-name-org.turso.io`)
   - `TURSO_AUTH_TOKEN` — Turso auth token

3. **Driver compatibility** — Read `src/lib/db/index.ts` and verify it uses `@libsql/client` (not `better-sqlite3`), and that `drizzle.config.ts` has `dialect: "turso"`.

4. **Async check** — Spot-check API routes and server components for any synchronous database calls (there shouldn't be any, but verify).

5. **Report**:

```
## Deploy Readiness

- [x] Build: PASS
- [x] Env vars: PASS
- [x] Turso driver: PASS
- [x] Async queries: PASS
- [x] Drizzle config: PASS

Ready to deploy: YES
```

Mark failed checks with `[ ]` and explain what needs fixing.
