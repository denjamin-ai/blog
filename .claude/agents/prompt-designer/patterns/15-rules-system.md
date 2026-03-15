---
description: "Pattern: Claude Code rules system (.claude/rules/) for scoped instructions"
enabled: true
---

# 15. Rules System Pattern

**What**: Design rules files in `.claude/rules/` that load contextually based on file patterns or globally.

**When**: Creating scoped behavioral instructions that apply to specific file types, directories, or always.

## Rule File Format

Rules are markdown files stored in `.claude/rules/` with YAML frontmatter:

```markdown
---
description: "Human-readable summary of what this rule enforces"
alwaysApply: true
---

Rule content in markdown. This becomes part of the system prompt
when the rule is active.
```

## Frontmatter Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `description` | string | Yes | Summary shown in rule listings; used for relevance matching |
| `alwaysApply` | boolean | No | If `true`, loads for every conversation unconditionally |
| `globs` | string or string[] | No | File pattern(s) that trigger this rule |

### Scoping Modes

**Mode 1: Always-on** — Rule loads in every conversation:
```yaml
---
description: "Security: never hardcode secrets"
alwaysApply: true
---
```

**Mode 2: File-pattern scoped** — Rule loads when matching files are in context:
```yaml
---
description: "React component conventions"
globs: "*.tsx"
---
```

**Mode 3: Multi-pattern scoped** — Rule loads for multiple file types:
```yaml
---
description: "Test file conventions"
globs: ["*.test.ts", "*.test.tsx", "*.spec.ts"]
---
```

**Mode 4: Description-only** — No `alwaysApply`, no `globs`. Claude loads based on description relevance:
```yaml
---
description: "Database migration conventions for PostgreSQL"
---
```

## Rule Loading Behavior

1. `alwaysApply: true` rules load unconditionally
2. `globs`-scoped rules load when matching files are in the active context
3. Description-only rules load when Claude determines they are relevant
4. Multiple rules can be active simultaneously
5. Rules augment (not replace) CLAUDE.md content

## When to Use Rules vs CLAUDE.md vs Agent Prompts

| Instruction Scope | Use This |
|-------------------|----------|
| Project-wide conventions (build commands, style) | `CLAUDE.md` |
| File-type-specific behavior (TSX, Python, tests) | `.claude/rules/` with `globs` |
| Always-on constraints (security, never-do) | `.claude/rules/` with `alwaysApply` |
| Specialized autonomous worker behavior | `.claude/agents/` agent prompt |
| User-triggered workflow | `.claude/skills/` |

## Concrete Examples

### Example 1: Security Rule (always-on)

File: `.claude/rules/security-no-secrets.md`
```markdown
---
description: "Prevent hardcoded secrets in source code"
alwaysApply: true
---

NEVER hardcode secrets, API keys, tokens, or passwords in source code.

Use environment variables:
- `process.env.API_KEY` (Node.js)
- `os.environ["API_KEY"]` (Python)

Always create `.env.example` with placeholder values.
Never commit `.env` files with real credentials.
```

### Example 2: TypeScript Convention (file-scoped)

File: `.claude/rules/typescript-strict.md`
```markdown
---
description: "TypeScript strict mode and type safety conventions"
globs: ["*.ts", "*.tsx"]
---

TypeScript files must follow strict mode:
- No `any` types — use `unknown` and type guards instead
- No type assertions (`as`) unless unavoidable — add a comment explaining why
- All function parameters and return types must be explicitly typed
- Use `interface` for object shapes, `type` for unions/intersections
```

### Example 3: Test Convention (multi-glob)

File: `.claude/rules/test-patterns.md`
```markdown
---
description: "Testing conventions for unit and integration tests"
globs: ["*.test.ts", "*.test.tsx", "*.spec.ts", "*.spec.tsx"]
---

Test files must follow arrange-act-assert (AAA) pattern:
1. Arrange: set up test data and dependencies
2. Act: call the function under test
3. Assert: verify the result

Use `describe` blocks grouped by function name.
Each `it` block tests one specific behavior.
Never use `console.log` in tests — use assertions.
```

## Application Checklist

When designing a rule:

- [ ] `description` field is present and descriptive
- [ ] Scoping is correct: `alwaysApply`, `globs`, or description-only
- [ ] `globs` patterns match the intended files
- [ ] Rule content is concrete and operational (no abstract formulations)
- [ ] Rule does not conflict with existing rules or CLAUDE.md
- [ ] Rule is the right abstraction (not better suited for CLAUDE.md or agent prompt)

## References

- Full ecosystem reference: [../docs/claude-code-ecosystem.md](../docs/claude-code-ecosystem.md) §3
- Anti-pattern to avoid: [../anti-patterns/02-conflicting-instructions.md](../anti-patterns/02-conflicting-instructions.md)
