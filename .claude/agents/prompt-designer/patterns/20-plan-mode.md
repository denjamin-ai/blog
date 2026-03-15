---
description: "Pattern: Claude Code plan mode for structured implementation planning"
enabled: true
---

# 20. Plan Mode Pattern

**What**: Use plan mode for structured, multi-phase implementation planning before writing code.

**When**: Designing workflows that require careful planning, or when building agents that interact with plan mode.

## Plan File Location

```
.claude/plans/{auto-generated-name}.md
```

Plan files are auto-generated when entering plan mode. They are the **only writable file** during plan mode.

## Plan Mode Constraints

| Constraint | Details |
|-----------|---------|
| **Read-only** | Cannot create, modify, or delete any files except the plan file |
| **No code changes** | No Edit, Write, or destructive Bash commands |
| **Exploration only** | Read, Glob, Grep, read-only Bash commands allowed |
| **Single output** | The plan file is the sole artifact |

## 5-Phase Planning Workflow

### Phase 1: Initial Understanding

**Goal**: Understand the request and explore the codebase.

- Launch up to 3 `Explore` agents in parallel (single message, multiple tool calls)
- Each agent has a specific search focus
- Use minimum agents needed (usually 1-2)

```
Agent(prompt="Find all auth-related files", subagent_type="Explore")
Agent(prompt="Find test patterns used", subagent_type="Explore")
```

### Phase 2: Design

**Goal**: Design the implementation approach.

- Launch up to 1 `Plan` agent
- Provide comprehensive context from Phase 1
- Request a detailed implementation plan

```
Agent(prompt="Design auth refactoring based on: [context from Phase 1]", subagent_type="Plan")
```

### Phase 3: Review

**Goal**: Validate plan against user intent.

- Read critical files identified by agents
- Ensure alignment with user's original request
- Use `AskUserQuestion` for any remaining ambiguities

### Phase 4: Final Plan

**Goal**: Write the finalized plan to the plan file.

Plan file structure:

```markdown
# Plan: [Task Title]

## Context
Why this change is needed, what prompted it, intended outcome.

## Implementation
### Step 1: [Description]
- Files to modify: `path/to/file.ts`
- Changes: [specific changes]
- Reuse: `existingFunction()` from `utils/helpers.ts`

### Step 2: [Description]
...

## Critical Files
- [file.ts](path/to/file.ts) — role in the change

## Verification
- Run `npm test` to verify unit tests pass
- Run `npm run build` to verify no type errors
- Manual test: [specific scenario to verify]
```

### Phase 5: Exit

**Goal**: Signal completion and request approval.

- Call `ExitPlanMode` tool — this presents the plan for user review
- Do NOT ask "Is this plan okay?" via text or `AskUserQuestion`
- `ExitPlanMode` inherently requests approval

## Plan Mode Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `AskUserQuestion` | Clarify requirements | Phase 1-3: when requirements are ambiguous |
| `ExitPlanMode` | Signal plan completion | Phase 5: when plan is finalized |

**Critical rule**: Every turn in plan mode must end with either `AskUserQuestion` or `ExitPlanMode`. Never end a turn with just text.

## Plan Content Best Practices

1. **Start with Context** — Explain *why* this change is being made
2. **Include only the recommended approach** — Not all alternatives considered
3. **Reference existing code** — "Reuse `parseConfig()` from `src/utils/config.ts:42`"
4. **Be specific about file changes** — Name exact files and what changes in each
5. **Include verification steps** — How to test the changes end-to-end
6. **Keep it scannable** — Concise enough to review quickly, detailed enough to execute

## When to Use Plan Mode

- Large features spanning multiple files
- Architectural changes affecting system design
- Migrations or large-scale refactorings
- When the user explicitly requests planning before execution
- When the scope is unclear and exploration is needed first

## When NOT to Use Plan Mode

- Single-file changes
- Typo fixes or simple renames
- Tasks where the approach is obvious
- Research or information gathering (no code output)

## Integration with Agent Design

When designing agents that work within plan mode:

1. **Explore agents** should return structured findings (file paths, function signatures, patterns found)
2. **Plan agents** should output step-by-step implementation plans with file references
3. Agents in plan mode have read-only tool access — design prompts accordingly
4. Agent results feed into the plan file, not into code changes

## Application Checklist

When designing a plan mode workflow:

- [ ] Explore agents have specific, non-overlapping search focuses
- [ ] Plan agent receives comprehensive context from exploration
- [ ] Plan file includes Context, Implementation, Critical Files, and Verification sections
- [ ] Each implementation step names specific files and changes
- [ ] Existing functions/utilities referenced for reuse (with file paths)
- [ ] Verification section describes end-to-end testing approach
- [ ] Workflow ends with ExitPlanMode (not text-based approval request)

## References

- Full ecosystem reference: [../docs/claude-code-ecosystem.md](../docs/claude-code-ecosystem.md) §8
- Agent invocation patterns: [./14-subagent-design.md](./14-subagent-design.md)
