---
description: "Complete reference for the Claude Code ecosystem: CLAUDE.md, rules, agents, skills, hooks, memory, plans, settings, and tools"
alwaysApply: true
---

# Claude Code Ecosystem Reference

This document is the authoritative reference for the entire Claude Code ecosystem. Pattern files 15-20 reference this document for deeper detail.

## 1. Architecture Overview

Claude Code is an agentic CLI that operates within a project directory. Its behavior is shaped by seven composable systems:

```
Claude Code Execution Environment
├── CLAUDE.md           → Project-level instructions (global context)
├── .claude/rules/      → Scoped rules (file-pattern or always-on)
├── .claude/agents/     → Subagents (autonomous specialized workers)
├── .claude/skills/     → Skills (user-invoked slash commands)
├── .claude/settings.*  → Settings + hooks (permissions, automation)
├── .claude/projects/   → Memory (persistent cross-session context)
└── .claude/plans/      → Plans (structured implementation planning)
```

### How These Systems Compose

| System | Triggered By | Scope | Persistence |
|--------|-------------|-------|-------------|
| CLAUDE.md | Always loaded | Project / directory | File on disk |
| Rules | File pattern match or `alwaysApply` | Per-file or global | File on disk |
| Agents | Agent tool invocation or description match | Per-task | File on disk |
| Skills | User slash command (`/skill-name`) | Current conversation | File on disk |
| Hooks | Tool call events | Per-tool-call | Settings file |
| Memory | Explicit save/recall | Cross-session | File on disk |
| Plans | Plan mode activation | Current task | File on disk |

---

## 2. CLAUDE.md System

### File Locations and Hierarchy

| Location | Scope | Loaded When |
|----------|-------|-------------|
| `./CLAUDE.md` (project root) | Entire project | Always |
| `./.claude/CLAUDE.md` | Entire project | Always |
| `./src/CLAUDE.md` | `./src/` subtree | Working in `./src/` |
| `./src/api/CLAUDE.md` | `./src/api/` subtree | Working in `./src/api/` |

Parent directory CLAUDE.md files are always included. Subdirectory files add to (not replace) parent context.

### Content Guidelines

**What belongs in CLAUDE.md:**
- Build and test commands (`npm test`, `pytest`)
- Code style preferences and naming conventions
- Project architecture overview
- Technology stack and version constraints
- Common development workflows
- Team conventions

**What does NOT belong:**
- Per-file rules → use `.claude/rules/` with `globs`
- Agent behavior → use `.claude/agents/`
- Secrets or credentials → use environment variables
- Transient task context → use memory or plans

### Example

```markdown
# MyProject

## Build
- `npm run build` — production build
- `npm run dev` — development server on :3000

## Test
- `npm test` — unit tests (vitest)
- `npm run test:e2e` — end-to-end (Playwright)

## Code Style
- TypeScript strict mode required
- Use PascalCase for components, camelCase for functions
- Prefer named exports over default exports

## Architecture
- Frontend: React 18 + TypeScript in `./src/`
- API: Express in `./server/`
- Database: PostgreSQL via Prisma ORM
```

---

## 3. Rules System (.claude/rules/)

### Rule File Format

```markdown
---
description: "Human-readable summary of what this rule enforces"
alwaysApply: true
---

Rule content in markdown...
```

### Frontmatter Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `description` | string | Yes | Summary shown in rule listings |
| `alwaysApply` | boolean | No | If `true`, rule loads for every conversation |
| `globs` | string or string[] | No | File pattern(s) that trigger this rule |

### Scoping Behavior

- **`alwaysApply: true`** — Rule is injected into every conversation regardless of context
- **`globs: "*.ts"`** — Rule loads only when `.ts` files are in the active context
- **`globs: ["*.ts", "*.tsx"]`** — Rule loads when any matching file is active
- **No `alwaysApply` and no `globs`** — Rule is available but only loaded when Claude determines it's relevant based on the description

### Loading Priority

1. Rules override or augment CLAUDE.md content
2. Multiple rules can match simultaneously
3. More specific globs take precedence when conflicting

### Examples

**Always-on rule** (`.claude/rules/no-console-log.md`):
```markdown
---
description: "Forbid console.log in production code"
alwaysApply: true
---

Never use `console.log()` in production code. Use the project logger instead:
- `logger.info()` for informational messages
- `logger.error()` for errors
- `logger.debug()` for debug-only output
```

**File-scoped rule** (`.claude/rules/react-conventions.md`):
```markdown
---
description: "React component conventions for TSX files"
globs: "*.tsx"
---

When creating or modifying React components:
- Use functional components with hooks (no class components)
- Props interface must be exported and named `{ComponentName}Props`
- Use `React.FC` typing sparingly; prefer explicit return types
```

**Multi-glob rule** (`.claude/rules/test-patterns.md`):
```markdown
---
description: "Testing conventions for test files"
globs: ["*.test.ts", "*.test.tsx", "*.spec.ts"]
---

Test files must follow arrange-act-assert pattern.
Use `describe` blocks grouped by function/method name.
Each test must have a single assertion focus.
```

---

## 4. Agents System (.claude/agents/)

### Agent File Structure

```
.claude/agents/{agent-name}/
├── agent.md              # Required: agent definition
├── patterns/             # Optional: reusable patterns
├── docs/                 # Optional: reference documentation
└── templates/            # Optional: output templates
```

Alternatively, a single file: `.claude/agents/{agent-name}.md`

### Agent Definition Format (agent.md)

```yaml
---
name: agent-name              # Required: lowercase-hyphens, max 50 chars
description: "When to invoke"  # Required: trigger conditions
tools: Read, Glob, Grep       # Optional: comma-separated tool list
model: sonnet                  # Optional: opus | sonnet | haiku
---

System prompt content follows...
```

### Agent Tool (Invocation)

Agents are invoked via the `Agent` tool with these parameters:

| Parameter | Type | Required | Purpose |
|-----------|------|----------|---------|
| `prompt` | string | Yes | Task description for the agent |
| `description` | string | Yes | Short 3-5 word summary |
| `subagent_type` | string | No | Agent type to use (see below) |
| `run_in_background` | boolean | No | Run without blocking |
| `isolation` | `"worktree"` | No | Run in isolated git worktree |
| `resume` | string | No | Agent ID to resume previous session |
| `model` | string | No | Override model (opus/sonnet/haiku) |

### Built-in Agent Types

| Type | Tools | Best For |
|------|-------|----------|
| `general-purpose` | All tools | Multi-step tasks, code changes |
| `Explore` | Read-only (no Edit, Write) | Codebase exploration, search |
| `Plan` | Read-only (no Edit, Write) | Implementation planning |
| `claude-code-guide` | Glob, Grep, Read, WebFetch, WebSearch | Claude Code documentation questions |

### Invocation Patterns

**Single agent:**
```
Agent(prompt="Find all API endpoints", subagent_type="Explore")
```

**Parallel agents (multiple in one message):**
```
Agent(prompt="Search for auth patterns", subagent_type="Explore", run_in_background=true)
Agent(prompt="Search for test patterns", subagent_type="Explore", run_in_background=true)
```

**Worktree isolation (safe file changes):**
```
Agent(prompt="Refactor auth module", isolation="worktree")
```

**Resume previous agent:**
```
Agent(prompt="Continue from where you left off", resume="agent-id-from-previous")
```

---

## 5. Skills System (.claude/skills/)

### Skills vs Agents

| Aspect | Skills | Agents |
|--------|--------|--------|
| Invocation | User types `/skill-name` | System or manual via Agent tool |
| Context | Runs in current conversation | Separate context (subagent) |
| State | Stateless, single-shot | Can maintain conversation state |
| Complexity | Simple, focused workflows | Complex autonomous tasks |
| Definition | Single markdown file | Directory or single file |

### Skill File Format

Location: `.claude/skills/{skill-name}.md`

```markdown
---
name: skill-name
description: "When this skill should be used"
---

Skill prompt content that gets injected when user types /skill-name...
```

### When to Use Skills vs Agents

- **Skill**: User-initiated, single-shot workflow (e.g., `/review`, `/commit`, `/simplify`)
- **Agent**: Autonomous worker invoked programmatically or by description match

---

## 6. Hooks System

### Configuration

Hooks are configured in `.claude/settings.json` (project) or `~/.claude/settings.json` (global).

```json
{
  "hooks": {
    "PreToolCall": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'About to edit a file'"
          }
        ]
      }
    ],
    "PostToolCall": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/lint-file.sh $CLAUDE_FILE_PATH"
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' '$CLAUDE_NOTIFICATION'"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Agent stopped'"
          }
        ]
      }
    ]
  }
}
```

### Hook Events

| Event | Fires When | Use Cases |
|-------|-----------|-----------|
| `PreToolCall` | Before any tool is invoked | Validation, security checks |
| `PostToolCall` | After a tool completes | Linting, formatting, logging |
| `Notification` | When a notification is sent | Desktop alerts, Slack integration |
| `Stop` | When the agent stops | Cleanup, summary generation |

### Hook Matchers

- Match by tool name: `"matcher": "Edit"` — fires only for Edit tool
- Match all tools: omit `matcher` or use `"matcher": "*"`
- Hooks receive tool call details via environment variables

### Hook Script Contract

- **Exit code 0**: Proceed normally
- **Non-zero exit code**: Block the tool call (PreToolCall) or report error (PostToolCall)
- **stdout**: Displayed to the user as feedback

---

## 7. Memory System (.claude/projects/)

### Memory Location

```
~/.claude/projects/{project-path-hash}/memory/
├── MEMORY.md                    # Index of all memory files
├── user_preferences.md          # Example memory file
├── feedback_testing.md          # Example memory file
└── project_architecture.md      # Example memory file
```

### MEMORY.md Index Format

```markdown
# Memory Index

- [user_preferences.md](user_preferences.md) - User coding style and tool preferences
- [feedback_testing.md](feedback_testing.md) - User feedback: always use real DB in tests
- [project_architecture.md](project_architecture.md) - Microservices architecture decisions
```

Keep under 200 lines. Contains only links and brief descriptions, never memory content.

### Memory File Format

```markdown
---
name: descriptive-memory-name
description: "One-line description used to decide relevance"
type: user | feedback | project | reference
---

Memory content here...
```

### Memory Types

| Type | Purpose | Example Content |
|------|---------|----------------|
| `user` | User's role, preferences, knowledge | "Senior Go developer, new to React frontend" |
| `feedback` | Corrections and guidance from user | "Never mock the database — use real test DB" |
| `project` | Project decisions, goals, deadlines | "Auth rewrite driven by legal compliance, not tech debt" |
| `reference` | Pointers to external resources | "Pipeline bugs tracked in Linear project INGEST" |

### When to Save

- User explicitly asks to remember something
- User corrects your approach (feedback type)
- Learning about user's role or preferences (user type)
- Important project decisions or deadlines (project type)
- External resource locations (reference type)

### When NOT to Save

- Code patterns derivable from reading the codebase
- Git history (use `git log` / `git blame`)
- Information already in CLAUDE.md or rules
- Temporary task context
- Debugging solutions (the fix is in the code)

---

## 8. Plan Mode

### Plan File Location

`.claude/plans/{auto-generated-name}.md`

### Plan Mode Constraints

- **READ-ONLY**: Cannot create, modify, or delete files (except the plan file itself)
- Only exploration tools available: Read, Glob, Grep, Bash (read-only commands)
- The plan file is the single writable artifact

### 5-Phase Workflow

| Phase | Goal | Tools |
|-------|------|-------|
| 1. Understanding | Explore codebase, understand request | Explore agents (up to 3 parallel) |
| 2. Design | Design implementation approach | Plan agents (up to 1) |
| 3. Review | Validate plan against user intent | Read critical files, AskUserQuestion |
| 4. Final Plan | Write plan to plan file | Write (plan file only) |
| 5. Exit | Signal completion | ExitPlanMode |

### Plan Mode Tools

| Tool | Purpose |
|------|---------|
| `AskUserQuestion` | Clarify requirements during planning |
| `ExitPlanMode` | Signal plan is complete, request approval |

**Rule**: A turn in plan mode must end with either `AskUserQuestion` or `ExitPlanMode`.

### Plan File Structure

```markdown
# Plan: [Task Title]

## Context
Why this change is needed, what prompted it, intended outcome.

## Implementation
Step-by-step plan with file paths and approach for each step.

## Critical Files
- [file.ts](path/to/file.ts) — what changes are needed

## Verification
How to test the changes end-to-end.
```

---

## 9. Settings System

### Settings File Locations

| File | Scope | Git-tracked |
|------|-------|-------------|
| `.claude/settings.json` | Project (shared) | Yes |
| `.claude/settings.local.json` | Project (personal) | No (gitignored) |
| `~/.claude/settings.json` | Global (all projects) | N/A |

### Key Settings

```json
{
  "permissions": {
    "allow": ["Bash(npm test)", "Read"],
    "deny": ["Bash(rm -rf *)"]
  },
  "hooks": { ... },
  "model": "sonnet"
}
```

### Permissions Format

- Tool-level: `"Read"` — allow all Read operations
- Parameterized: `"Bash(npm test)"` — allow only specific Bash commands
- Deny takes precedence over allow

---

## 10. Tool Reference

### Complete Tool List

| Tool | Purpose | Key Parameters |
|------|---------|---------------|
| `Read` | Read file contents | `file_path`, `offset`, `limit`, `pages` |
| `Edit` | Modify existing files | `file_path`, `old_string`, `new_string`, `replace_all` |
| `Write` | Create new files | `file_path`, `content` |
| `Bash` | Execute shell commands | `command`, `timeout`, `run_in_background` |
| `Glob` | Find files by pattern | `pattern`, `path` |
| `Grep` | Search file contents | `pattern`, `path`, `glob`, `output_mode` |
| `Agent` | Launch subagents | `prompt`, `subagent_type`, `run_in_background`, `isolation`, `resume` |
| `TodoWrite` | Track task progress | `todos` (array of task objects) |
| `Skill` | Invoke skills | `skill`, `args` |
| `WebFetch` | Fetch URL content | `url` |
| `WebSearch` | Search the web | `query` |
| `AskUserQuestion` | Ask user a question | `question` |
| `ExitPlanMode` | Exit plan mode | (none) |

### Tool Selection Rules

| Task | Use This | NOT This |
|------|----------|----------|
| Find files by name | `Glob` | `find`, `ls` |
| Search file contents | `Grep` | `grep`, `rg` |
| Read a file | `Read` | `cat`, `head`, `tail` |
| Edit a file | `Edit` | `sed`, `awk` |
| Create a file | `Write` | `echo >`, `cat <<EOF` |
| Broad codebase search | `Agent(subagent_type="Explore")` | Multiple manual Grep calls |

### Parallel Invocation

Independent tool calls should be made in the same message for parallel execution:

```
# Good: parallel (independent calls)
Read(file_path="src/a.ts")      # These run simultaneously
Read(file_path="src/b.ts")

# Bad: sequential when parallel is possible
Read(file_path="src/a.ts")      # Waits for result
Read(file_path="src/b.ts")      # Then runs this
```

---

## 11. Decision Matrices

### Where to Put Instructions

| Instruction Type | Location | Example |
|-----------------|----------|---------|
| Project-wide conventions | `CLAUDE.md` | "Use TypeScript strict mode" |
| File-type-specific rules | `.claude/rules/` with `globs` | "TSX files must use functional components" |
| Always-on constraints | `.claude/rules/` with `alwaysApply` | "Never use console.log" |
| Specialized worker behavior | `.claude/agents/` | "Code reviewer agent" |
| User-triggered workflow | `.claude/skills/` | "/deploy slash command" |
| Cross-session context | Memory system | "User prefers terse responses" |

### Agent vs Skill Decision

```
Is the workflow user-initiated by slash command?
├── Yes → Skill
└── No
    ├── Does it need autonomous multi-step execution?
    │   ├── Yes → Agent
    │   └── No → Inline in CLAUDE.md or rules
    └── Does it need its own context window?
        ├── Yes → Agent
        └── No → Skill or rules
```

### Model Selection

```
Is task complex/architectural?
├── Yes → opus
└── No
    ├── Is speed critical and task simple?
    │   ├── Yes → haiku
    │   └── No → sonnet (default)
    └── Does model matter?
        ├── No → omit field (inherit from parent)
        └── Yes → sonnet
```
