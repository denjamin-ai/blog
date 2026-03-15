---
description: "Pattern: Claude Code skills (custom slash commands) for user-triggered workflows"
enabled: true
---

# 19. Skills System Pattern

**What**: Create custom skills that users invoke via slash commands (`/skill-name`).

**When**: Designing reusable, user-initiated workflows that run within the current conversation context.

## Skills vs Agents

| Aspect | Skills | Agents |
|--------|--------|--------|
| **Invocation** | User types `/skill-name` | System matches description or manual Agent tool call |
| **Context** | Runs in current conversation | Separate subagent context window |
| **State** | Stateless single-shot | Can accumulate context within the agent |
| **Complexity** | Simple, focused workflows | Complex multi-step autonomous tasks |
| **Output** | Injected into current conversation | Returned as agent result message |
| **Definition** | Single markdown file | Directory with agent.md + optional resources |

## Skill File Location

```
.claude/skills/{skill-name}.md     # Project-level
~/.claude/skills/{skill-name}.md   # Global (all projects)
```

## Skill File Format

```markdown
---
name: skill-name
description: "When this skill should be used and what it does"
---

Skill prompt content. This is injected into the current conversation
when the user types /skill-name.

You can include:
- Instructions for Claude
- Templates for output format
- References to project files
- Workflow steps
```

### Frontmatter Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `name` | string | Yes | Slash command name (lowercase, hyphens) |
| `description` | string | Yes | When to use; shown in skill listings |

## Decision: Skill vs Agent vs Rule

```
Is it a user-initiated workflow?
├── Yes
│   ├── Does it need its own context window?
│   │   ├── Yes → Agent (invoke via Agent tool)
│   │   └── No → Skill (/slash-command)
│   └── Is it a one-time slash command?
│       ├── Yes → Skill
│       └── No (autonomous, description-triggered) → Agent
└── No
    ├── Is it a constraint or convention?
    │   ├── File-type-specific → Rule with globs
    │   ├── Always-on → Rule with alwaysApply
    │   └── Project-wide → CLAUDE.md
    └── Is it persistent context?
        └── Yes → Memory system
```

## Concrete Examples

### Example 1: Code Review Skill

File: `.claude/skills/review.md`
```markdown
---
name: review
description: "Review staged changes for code quality, security, and best practices"
---

Review all staged git changes (`git diff --cached`). For each file:

1. Check for security issues (hardcoded secrets, SQL injection, XSS)
2. Check for code quality (naming, complexity, duplication)
3. Check for test coverage gaps
4. Check for performance concerns

Output format:

## Review: [filename]

### Critical
- [issue description]

### Warnings
- [warning description]

### Suggestions
- [suggestion]

End with a summary: APPROVE, REQUEST CHANGES, or NEEDS DISCUSSION.
```

### Example 2: Deploy Checklist Skill

File: `.claude/skills/deploy-check.md`
```markdown
---
name: deploy-check
description: "Run pre-deployment checklist to verify readiness"
---

Run the following pre-deployment checks:

1. Run `npm test` — all tests must pass
2. Run `npm run build` — build must succeed with no errors
3. Check `git status` — working directory must be clean
4. Check `git log origin/main..HEAD` — review pending commits
5. Check for TODO/FIXME comments in changed files

Report results as:

## Deploy Readiness

| Check | Status | Details |
|-------|--------|---------|
| Tests | ✅/❌ | ... |
| Build | ✅/❌ | ... |
| Clean working dir | ✅/❌ | ... |
| Commits reviewed | ✅/❌ | ... |
| No TODOs | ✅/❌ | ... |

**Verdict**: READY / NOT READY
```

### Example 3: Documentation Generator Skill

File: `.claude/skills/doc-function.md`
```markdown
---
name: doc-function
description: "Generate JSDoc/TSDoc documentation for the selected function"
---

Generate comprehensive documentation for the selected function or class:

1. Read the implementation
2. Identify parameters, return types, side effects
3. Write JSDoc/TSDoc comment block with:
   - @description — what the function does
   - @param — each parameter with type and description
   - @returns — return value description
   - @throws — any exceptions
   - @example — usage example

Place the comment directly above the function declaration.
```

## Design Principles

1. **Single responsibility** — One skill, one workflow
2. **Clear output format** — Define exactly what the skill produces
3. **Actionable steps** — List concrete steps, not vague instructions
4. **Runnable context** — Skills run in the current conversation with full tool access
5. **User-facing** — Skills are invoked by users, so descriptions should be clear to humans

## Application Checklist

When designing a skill:

- [ ] `name` is lowercase with hyphens
- [ ] `description` clearly explains when to use this skill
- [ ] Workflow steps are concrete and actionable
- [ ] Output format is defined with examples
- [ ] Skill has a single, focused purpose (not a "Caesar")
- [ ] Skill is the right abstraction (not better as an agent or rule)

## References

- Full ecosystem reference: [../docs/claude-code-ecosystem.md](../docs/claude-code-ecosystem.md) §5
- Agent comparison: [./14-subagent-design.md](./14-subagent-design.md)
