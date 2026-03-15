---
description: "Next.js App Router conventions for page and API route files"
globs: ["src/app/**/*.tsx", "src/app/**/*.ts"]
---

# Next.js App Router Conventions

## Server vs Client Components
- Components are server components by default — only add `"use client"` when needed (useState, useEffect, event handlers, browser APIs)
- Prefer server components for data fetching — call `db` directly, no API routes needed
- Client components cannot be async — fetch data in parent server component and pass as props

## Route Groups
- `(protected)` route group wraps admin pages that require auth
- Auth check lives in `src/app/admin/(protected)/layout.tsx`
- `src/app/admin/login/page.tsx` is OUTSIDE the protected group (no auth check)

## API Routes
- Located in `src/app/api/` with `route.ts` files
- Always check auth via `getSession()` for admin-only endpoints
- Return proper HTTP status codes and JSON responses
- Use `NextResponse.json()` for responses

## Data Fetching
- Server components: query `db` directly (import from `src/lib/db`)
- Client components: fetch from API routes
- No caching configuration needed for MVP — default Next.js behavior is fine

## Dynamic Routes
- Blog: `[slug]` — lookup by slug field
- Admin articles: `[id]` — lookup by ULID id field
