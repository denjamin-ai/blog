---
description: "Pattern: Claude Code memory system for persistent cross-session context"
enabled: true
---

# 17. Memory System Pattern

**What**: Design and manage persistent memory files that provide context across sessions.

**When**: Storing information that should persist between conversations — user preferences, feedback, project decisions, external references.

## Memory Architecture

```
~/.claude/projects/{project-path-hash}/memory/
├── MEMORY.md                    # Index file (always loaded)
├── user_role.md                 # Memory file
├── feedback_testing.md          # Memory file
├── project_architecture.md      # Memory file
└── reference_linear.md          # Memory file
```

### MEMORY.md Index

The index is **always loaded** into conversation context. It contains only links and brief descriptions — never memory content directly.

```markdown
# Memory Index

## User
- [user_role.md](user_role.md) - Senior Go developer, new to React frontend

## Feedback
- [feedback_testing.md](feedback_testing.md) - Always use real DB in tests, never mock

## Project
- [project_architecture.md](project_architecture.md) - Microservices auth rewrite for compliance

## Reference
- [reference_linear.md](reference_linear.md) - Pipeline bugs tracked in Linear project INGEST
```

**Constraint**: Keep under 200 lines. Lines after 200 are truncated.

## Memory File Format

```markdown
---
name: descriptive-memory-name
description: "One-line description — used to decide relevance in future conversations"
type: user | feedback | project | reference
---

Memory content here. For feedback and project types, structure as:

Rule or fact statement.

**Why:** The reason this matters (past incident, user preference, constraint).

**How to apply:** When and where this guidance kicks in.
```

## Memory Types

### 1. User Memory
Information about the user's role, goals, and preferences.

```markdown
---
name: user-backend-expertise
description: "User is senior Go developer, new to React — frame frontend explanations with backend analogues"
type: user
---

User has 10 years of Go experience but this is their first time working with React.
Frame frontend concepts using backend analogues when explaining.
```

**Save when**: Learning about user's role, preferences, responsibilities, or knowledge level.

### 2. Feedback Memory
Corrections or guidance the user has given.

```markdown
---
name: feedback-real-database-tests
description: "Integration tests must use real database, never mocks"
type: feedback
---

Integration tests must hit a real database, not mocks.

**Why:** Last quarter, mocked tests passed but the production migration failed because mock/prod diverged.

**How to apply:** When writing or reviewing integration tests, always configure a real test database connection. Never use jest.mock() or similar for database layers.
```

**Save when**: User corrects your approach, says "don't do X", or provides guidance that could apply to future conversations.

### 3. Project Memory
Information about ongoing work, decisions, deadlines.

```markdown
---
name: project-auth-rewrite
description: "Auth middleware rewrite driven by legal compliance, not tech debt"
type: project
---

The auth middleware rewrite is driven by legal/compliance requirements around session token storage.

**Why:** Legal flagged the old middleware for storing session tokens in a non-compliant way. This is not a tech-debt cleanup.

**How to apply:** Scope decisions should favor compliance over ergonomics. When in doubt about auth design choices, prioritize the compliance requirement.
```

**Save when**: Learning about project decisions, deadlines, or context not derivable from code. Always convert relative dates to absolute dates.

### 4. Reference Memory
Pointers to external resources.

```markdown
---
name: reference-pipeline-bugs
description: "Pipeline bugs tracked in Linear project INGEST"
type: reference
---

Pipeline bugs are tracked in the Linear project "INGEST".
Grafana dashboard for API latency: grafana.internal/d/api-latency (oncall watches this).

**How to apply:** When investigating pipeline issues, check Linear INGEST first. When touching request-path code, consider impact on the latency dashboard.
```

**Save when**: Learning about external resources, dashboards, tracking systems, documentation locations.

## When to Save vs NOT Save

### Save

- User explicitly asks to remember something
- User corrects your approach (especially if surprising or non-obvious)
- Learning user's role, expertise level, or preferences
- Important project decisions or deadlines
- External resource locations and their purpose

### Do NOT Save

| Information Type | Why Not | Alternative |
|-----------------|---------|-------------|
| Code patterns and conventions | Derivable from reading code | CLAUDE.md or rules |
| Git history / who changed what | `git log` / `git blame` is authoritative | Use git commands |
| Debugging solutions | The fix is in the code; commit message has context | Read the code |
| Anything in CLAUDE.md | Already loaded every session | Keep in CLAUDE.md |
| Ephemeral task details | Only useful in current conversation | Use TodoWrite |
| File paths and project structure | Changes frequently; read from disk | Use Glob/Grep |

## Two-Step Save Process

**Step 1**: Write the memory file:
```
Write(file_path="~/.claude/projects/{hash}/memory/feedback_testing.md", content="...")
```

**Step 2**: Update MEMORY.md index with a pointer to the new file.

## Application Checklist

When designing memory usage for an agent or workflow:

- [ ] Memory type correctly chosen (user/feedback/project/reference)
- [ ] `description` field is specific enough for relevance matching
- [ ] Feedback memories include **Why** and **How to apply**
- [ ] Project memories use absolute dates (not "next Thursday")
- [ ] No duplicate of existing memory — check MEMORY.md index first
- [ ] Content is not derivable from code, git, or CLAUDE.md
- [ ] MEMORY.md index stays under 200 lines

## References

- Full ecosystem reference: [../docs/claude-code-ecosystem.md](../docs/claude-code-ecosystem.md) §7
- Anti-pattern to avoid: [../anti-patterns/05-ignoring-context-window.md](../anti-patterns/05-ignoring-context-window.md)
