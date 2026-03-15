---
description: "Pattern: Clearly describe when and how to use Claude Code tools"
enabled: true
---

# 10. Tool-Usage Pattern

**What**: Clearly describe when and how to use each tool, including selection criteria, parallel invocation, and anti-patterns.

**When**: Any agent or workflow with tool access. This pattern ensures tools are used correctly and efficiently.

## Claude Code Tool Reference

### File Operations

| Tool | Purpose | Use Instead Of |
|------|---------|---------------|
| `Read` | Read file contents | `cat`, `head`, `tail`, `sed` (viewing) |
| `Edit` | Modify existing files (precise replacements) | `sed`, `awk` |
| `Write` | Create new files or full rewrites | `echo >`, `cat <<EOF` |
| `Glob` | Find files by name pattern | `find`, `ls` |
| `Grep` | Search file contents by regex | `grep`, `rg` |
| `Bash` | Execute shell commands | — (use only when dedicated tools can't) |

### Agent & Workflow Tools

| Tool | Purpose | Key Parameters |
|------|---------|---------------|
| `Agent` | Launch specialized subagents | `prompt`, `subagent_type`, `run_in_background`, `isolation`, `resume` |
| `TodoWrite` | Track task progress | `todos` (array: content, status, activeForm) |
| `Skill` | Invoke slash command skills | `skill`, `args` |

### Information Tools

| Tool | Purpose | Key Parameters |
|------|---------|---------------|
| `WebFetch` | Fetch URL content | `url` |
| `WebSearch` | Search the web | `query` |

### Plan Mode Tools

| Tool | Purpose |
|------|---------|
| `AskUserQuestion` | Ask user for clarification |
| `ExitPlanMode` | Signal planning is complete |

## Tool Selection Decision Tree

```
Need to find files by name/pattern?
└── Use Glob (NOT find or ls)

Need to search file contents?
└── Use Grep (NOT grep, rg, or Bash)

Need to read a file?
└── Use Read (NOT cat, head, tail)

Need to modify an existing file?
└── Use Edit (NOT sed, awk, or Bash)

Need to create a new file?
└── Use Write (NOT echo > or cat <<EOF)

Need to run a shell command?
└── Use Bash (ONLY when dedicated tools can't do it)

Need broad codebase exploration?
└── Use Agent(subagent_type="Explore")

Need to track multi-step progress?
└── Use TodoWrite
```

## Agent Tool Parameters

The `Agent` tool launches subagents for complex tasks:

```
Agent(
  prompt="Task description",              # Required: what to do
  description="3-5 word summary",         # Required: short summary
  subagent_type="Explore",                # Optional: agent type
  run_in_background=true,                 # Optional: non-blocking execution
  isolation="worktree",                   # Optional: git worktree isolation
  resume="agent-id-from-previous",        # Optional: resume previous agent
  model="sonnet"                          # Optional: model override
)
```

### Agent Types

| Type | Tools Available | Best For |
|------|----------------|----------|
| `general-purpose` | All tools | Multi-step tasks, code changes |
| `Explore` | Read-only (no Edit, Write, Agent) | Codebase search, pattern finding |
| `Plan` | Read-only (no Edit, Write, Agent) | Implementation design |
| `claude-code-guide` | Glob, Grep, Read, WebFetch, WebSearch | Claude Code questions |

### Background Execution

Use `run_in_background=true` when:
- You have other work to do while the agent runs
- Multiple independent agents can run in parallel
- The result is not needed immediately

Do NOT use background when:
- You need the result before proceeding
- The agent's output determines your next step

### Worktree Isolation

Use `isolation="worktree"` when:
- The agent makes file changes that could conflict with your work
- You want safe, isolated experimentation
- Changes should be reviewed before merging

### Resuming Agents

Use `resume="agent-id"` to continue a previous agent's work:
- The agent resumes with its full previous context preserved
- Useful for follow-up tasks on the same exploration
- Do NOT provide a new prompt when resuming (context is preserved)

## Parallel Tool Invocation

### Rule: Independent calls in the same message

When multiple tool calls have no dependencies, make them in a single message:

**Good** — parallel execution:
```
# These run simultaneously
Read(file_path="src/auth.ts")
Read(file_path="src/database.ts")
Grep(pattern="TODO", path="src/")
```

**Bad** — unnecessary sequential:
```
# Call 1
Read(file_path="src/auth.ts")
# Wait for result...
# Call 2
Read(file_path="src/database.ts")
# Wait for result...
```

### Parallel Agent Launch

Multiple agents can be launched simultaneously:
```
# Fan-out: explore different areas in parallel
Agent(prompt="Find auth patterns", subagent_type="Explore", run_in_background=true)
Agent(prompt="Find test patterns", subagent_type="Explore", run_in_background=true)
Agent(prompt="Find API routes", subagent_type="Explore", run_in_background=true)
```

### When NOT to Parallelize

Do NOT parallelize when:
- Call B depends on the result of Call A
- You need to read a file before editing it (Read → Edit)
- Agent B needs information from Agent A's result

## TodoWrite Tool

Track multi-step task progress:

```
TodoWrite(todos=[
  {content: "Implement auth module", status: "completed", activeForm: "Implementing auth module"},
  {content: "Write unit tests", status: "in_progress", activeForm: "Writing unit tests"},
  {content: "Update documentation", status: "pending", activeForm: "Updating documentation"}
])
```

### Task States
- `pending` — Not yet started
- `in_progress` — Currently working on (limit to ONE at a time)
- `completed` — Finished successfully

### When to Use TodoWrite
- Multi-step tasks (3+ distinct steps)
- Complex implementations requiring tracking
- User provides multiple tasks

### When NOT to Use TodoWrite
- Single, trivial task
- Conversational/informational request
- Task completable in < 3 steps

## Bash Tool Best Practices

1. **Use absolute paths** — Working directory may change between calls
2. **Quote paths with spaces** — `cd "path with spaces"`
3. **Set timeouts for long commands** — `timeout: 30000` (ms)
4. **Use `run_in_background`** for long-running commands
5. **Chain dependent commands** — `cmd1 && cmd2` (sequential)
6. **Never use Bash for file operations** when Read/Edit/Write/Glob/Grep can do it

**Bash-only tasks** (no dedicated tool exists):
- `git` operations
- `npm` / `pip` / package manager commands
- Running tests (`npm test`, `pytest`)
- Build commands (`npm run build`)
- Process management (`docker`, `kill`)

## Application Checklist

When designing tool usage for an agent:

- [ ] Each tool use has a clear purpose and selection rationale
- [ ] Dedicated tools used instead of Bash equivalents
- [ ] Independent tool calls are parallelized
- [ ] Agent tool parameters are appropriate (type, background, isolation)
- [ ] TodoWrite used for multi-step tasks
- [ ] Bash used only for tasks without a dedicated tool
- [ ] Tool selection documented with "when to use" and "when NOT to use"

## References

- Full ecosystem reference: [../docs/claude-code-ecosystem.md](../docs/claude-code-ecosystem.md) §10
- Agent tool details: [./14-subagent-design.md](./14-subagent-design.md)
