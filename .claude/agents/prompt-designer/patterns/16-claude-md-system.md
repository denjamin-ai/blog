---
description: "Pattern: CLAUDE.md project configuration files for project-wide instructions"
enabled: true
---

# 16. CLAUDE.md System Pattern

**What**: Configure project-level and directory-level instructions via CLAUDE.md files.

**When**: Setting up project-wide conventions, build commands, architecture context, or directory-specific guidance.

## CLAUDE.md Locations and Hierarchy

| Location | Scope | Loaded When |
|----------|-------|-------------|
| `./CLAUDE.md` | Entire project | Always |
| `./.claude/CLAUDE.md` | Entire project | Always (alternative to root) |
| `./src/CLAUDE.md` | `./src/` subtree | Working in `./src/` |
| `./backend/CLAUDE.md` | `./backend/` subtree | Working in `./backend/` |

**Inheritance**: Parent directory CLAUDE.md files are always included. Subdirectory files **add to** (not replace) parent context. Content from all matching levels is concatenated.

## Content Guidelines

### What Belongs in CLAUDE.md

1. **Build and test commands**: `npm run build`, `pytest`, `make`
2. **Code style preferences**: naming conventions, formatting rules
3. **Project architecture overview**: component structure, data flow
4. **Technology stack and versions**: "React 18, TypeScript 5.3, Node 20"
5. **Common development workflows**: "run migrations before testing"
6. **Team conventions**: commit message format, PR process

### What Does NOT Belong

| Content Type | Use Instead |
|-------------|-------------|
| Per-file-type rules | `.claude/rules/` with `globs` |
| Agent behavior | `.claude/agents/` |
| Secrets or credentials | Environment variables |
| Transient task context | Memory system or plans |
| User-specific preferences | Memory (`user` type) |

## CLAUDE.md vs Rules vs Agent Prompts

```
Is the instruction project-wide and general?
├── Yes → CLAUDE.md
└── No
    ├── Does it apply to specific file types?
    │   ├── Yes → .claude/rules/ with globs
    │   └── No
    │       ├── Is it a constraint that must always be enforced?
    │       │   ├── Yes → .claude/rules/ with alwaysApply
    │       │   └── No → CLAUDE.md
    │       └── Is it behavior for a specialized worker?
    │           ├── Yes → .claude/agents/
    │           └── No → CLAUDE.md
```

## CLAUDE.md Structure Template

```markdown
# Project Name

## Build
- `command` — description

## Test
- `command` — description

## Code Style
- Convention 1
- Convention 2

## Architecture
Brief overview of system components and their relationships.

## Key Directories
- `src/` — Frontend React application
- `server/` — Backend API
- `shared/` — Shared types and utilities
```

## Best Practices

1. **Keep it concise** — CLAUDE.md is loaded into every conversation; brevity saves context window
2. **Use bullet points** — Easier to scan than paragraphs
3. **Include runnable commands** — Exact commands, not descriptions of commands
4. **Update when architecture changes** — Stale CLAUDE.md causes incorrect assumptions
5. **Don't duplicate rules** — If something is in `.claude/rules/`, don't repeat it here
6. **Subdirectory CLAUDE.md for isolated concerns** — e.g., `./mobile/CLAUDE.md` for mobile-only conventions

## Concrete Examples

### Root CLAUDE.md

```markdown
# EcommerceApp

## Build
- `pnpm build` — production build
- `pnpm dev` — dev server on :5173

## Test
- `pnpm test` — vitest unit tests
- `pnpm test:e2e` — Playwright end-to-end

## Code Style
- TypeScript strict mode required
- PascalCase for components, camelCase for functions
- Named exports preferred over default exports
- Use Zod for runtime validation schemas

## Architecture
- Frontend: React 18 + TanStack Router in `./src/`
- API: tRPC + Drizzle ORM in `./server/`
- Database: PostgreSQL 16 via Docker
- Auth: Lucia Auth with session tokens
```

### Subdirectory CLAUDE.md (`./server/CLAUDE.md`)

```markdown
# Server

## Local Dev
- `pnpm db:push` — push schema changes to local DB
- `pnpm db:seed` — seed development data

## Conventions
- All API routes defined in `./server/routes/`
- Use Drizzle ORM for all database queries (no raw SQL)
- Validation via Zod schemas co-located with route handlers
```

## Application Checklist

When creating or reviewing CLAUDE.md:

- [ ] Contains build and test commands
- [ ] Architecture overview is current
- [ ] No secrets or credentials present
- [ ] No per-file rules that belong in `.claude/rules/`
- [ ] Concise enough to fit comfortably in context window
- [ ] Subdirectory CLAUDE.md used for isolated concerns (if applicable)

## References

- Full ecosystem reference: [../docs/claude-code-ecosystem.md](../docs/claude-code-ecosystem.md) §2
- Rules system comparison: [./15-rules-system.md](./15-rules-system.md)
