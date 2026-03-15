---
description: "Security rules for the blog project: secrets, input validation, XSS prevention"
alwaysApply: true
---

# Security Rules

## Secrets
- NEVER log, console.log, or expose SESSION_SECRET, ADMIN_PASSWORD_HASH, TURSO_AUTH_TOKEN
- NEVER commit .env.local or any file containing secrets
- bcrypt hashes in .env.local MUST escape `$` as `\$` (dotenv-expand interprets `$` as variable references)

## Input Validation
- Validate ALL user input at API route boundaries (src/app/api/)
- JSON.parse for tags/links fields MUST be wrapped in try-catch
- Validate request body type and required fields before processing

## XSS Prevention
- When embedding content in iframes or `<script>` tags, escape `</` as `<\/` to prevent HTML injection
- Never use `dangerouslySetInnerHTML` with user-provided content without sanitization
- MDX content is compiled server-side — treat raw MDX source as untrusted

## Auth
- iron-session cookie is the only auth mechanism — never add custom token schemes
- `requireAdmin()` must be called in server components/API routes, never client-side
- Session check goes in `(protected)/layout.tsx`, not in individual pages
