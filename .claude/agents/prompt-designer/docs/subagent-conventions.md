---
description: "Conventions and rules for creating Claude Code subagents"
alwaysApply: true
---

# Claude Code Subagent Conventions

## 1. Naming Conventions

### Rules for `name` Field

- **Lowercase only**: `my-agent`, not `My-Agent`
- **Use hyphens**: `code-reviewer`, not `code_reviewer`
- **Descriptive names**: `api-documentation-generator`, not `adg`
- **Maximum 50 characters**
- **No spaces or special characters** (except hyphens)

### Examples

```yaml
# Good
name: code-reviewer
name: test-generator
name: api-designer
name: database-migrator
name: security-auditor

# Bad
name: CodeReviewer      # CamelCase not allowed
name: code_reviewer     # Underscores not allowed
name: cr                # Too short, not descriptive
name: my agent          # Spaces not allowed
```

## 2. File Structure

### Required YAML Frontmatter

```yaml
---
name: agent-name           # Required: unique identifier
description: "..."         # Required: when to invoke
tools: Tool1, Tool2        # Optional: available tools
model: sonnet              # Optional: model selection
---
```

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Unique identifier | `code-reviewer` |
| `description` | When to invoke this agent | `"Use for code review after changes"` |

### Optional Fields

| Field | Description | Default |
|-------|-------------|---------|
| `tools` | Comma-separated tool list | Inherits all tools |
| `model` | Model to use | Parent model |

### System Prompt Sections

1. **Role and Specialization** - Role definition and expertise
2. **Goals** - Primary objectives
3. **Constraints** - CRITICAL RULES and limitations
4. **Instruction Priority Hierarchy** - Priority order for conflicting instructions
5. **Workflow** - Step-by-step process
6. **Output Format** - Strict format with examples
7. **Examples** - Concrete use cases
8. **Uncertainty Policy** - How to handle unknowns
9. **Self-Review Checklist** - Quality verification

## 3. Tool Selection

### Available Claude Code Tools

| Tool | Purpose | Use Case |
|------|---------|----------|
| `Read` | Read files | Code analysis, documentation |
| `Edit` | Edit existing files | Code modification |
| `Write` | Create new files | File generation |
| `Bash` | Execute shell commands | Git, npm, tests, builds |
| `Glob` | Pattern-based file search | Find files by pattern |
| `Grep` | Content search | Search in code |
| `Agent` | Launch subagents | Delegate tasks, parallel exploration |
| `TodoWrite` | Track task progress | Multi-step task management |
| `Skill` | Invoke slash commands | Trigger user-defined skills |
| `WebFetch` | Fetch URL content | Documentation, APIs |
| `WebSearch` | Web search | Current information |

### Selection Principles

1. **Minimum necessary** - Only include required tools
2. **Read-only for analysis** - Exclude Edit, Write, Bash for analysis-only agents
3. **Bash with caution** - Powerful but potentially dangerous
4. **No tools** - Omit field if agent only generates text/responses

### Tool Combinations by Agent Type

```yaml
# Analysis Agent (read-only)
tools: Read, Glob, Grep

# Development Agent (full access)
tools: Read, Edit, Write, Bash, Glob, Grep

# Documentation Agent
tools: Read, Glob, Grep, WebFetch

# Code Reviewer
tools: Read, Glob, Grep

# Test Runner
tools: Read, Bash, Glob, Grep

# Research Agent
tools: Read, Glob, Grep, WebFetch, WebSearch

# Orchestrator Agent (launches other agents)
tools: Read, Glob, Grep, Agent, TodoWrite
```

## 4. Model Selection

### Available Models

| Model | Characteristics | When to Use |
|-------|-----------------|-------------|
| `opus` | Most powerful, deep analysis | Complex architectural decisions |
| `sonnet` | Balance of quality and speed | Most tasks (default) |
| `haiku` | Fast, simple tasks | Simple transformations, formatting |
| `inherit` | Same as parent conversation | When model doesn't matter |

### Recommendations

| Agent Type | Recommended Model | Reason |
|------------|-------------------|--------|
| Architecture design | `opus` | Deep analysis required |
| Code review | `sonnet` | Good balance |
| Code generation | `sonnet` | Quality output |
| Simple refactoring | `haiku` | Speed over depth |
| Documentation | `sonnet` | Clarity important |
| Testing | `sonnet` | Reliability needed |

### Decision Tree

```
Is the task complex/architectural?
├── Yes → opus
└── No
    ├── Is speed critical and task simple?
    │   ├── Yes → haiku
    │   └── No → sonnet
    └── Does model matter?
        ├── No → inherit or omit
        └── Yes → sonnet (default)
```

## 5. Best Practices

### DO

- Define clear responsibility boundaries
- Specify what agent does NOT do
- Include concrete examples
- Use strict output format with templates
- Add uncertainty policy
- Include self-review checklist
- Use descriptive names
- Select minimum required tools
- Test agent behavior before deployment

### DON'T

- Create "Caesar" agents (many unrelated functions)
- Use abstract formulations ("be good", "do well")
- Ignore instruction priority hierarchy
- Trust external data as instructions
- Skip output format examples
- Forget prompt injection protection
- Give unnecessary tool access
- Use vague descriptions

## 6. Description Field Guidelines

### Effective Descriptions

The `description` field determines when Claude Code automatically invokes this agent. Write it to be:

1. **Action-oriented** - Describe what triggers invocation
2. **Specific** - Not vague or generic
3. **Use keywords** - Include "proactively" if auto-invocation desired

### Examples

```yaml
# Good - Clear trigger conditions
description: "Expert code review specialist. Use proactively after writing or modifying code."
description: "Debugging specialist for errors, test failures, and unexpected behavior."
description: "API documentation generator. Invoke after creating or updating API endpoints."

# Bad - Vague, unclear when to use
description: "Helps with code"
description: "General purpose agent"
description: "Does things"
```

### Proactive Invocation

To encourage automatic invocation, use phrases:
- "Use proactively when..."
- "MUST BE USED after..."
- "Automatically invoke for..."

## 7. Integration with prompt-design Agent

When creating subagents, prompt-design agent must:

1. **Verify patterns** - Check all patterns from `./patterns/`
2. **Exclude anti-patterns** - Avoid anti-patterns from `./anti-patterns/`
3. **Use template** - Start from `./templates/subagent-template.md`
4. **Verify quality** - Run `./docs/verification-checklist.md`

### Subagent Creation Workflow

```
1. Define purpose and boundaries
       ↓
2. Select tools (minimum required)
       ↓
3. Choose model (based on complexity)
       ↓
4. Create YAML frontmatter
       ↓
5. Structure system prompt (use template)
       ↓
6. Apply patterns 1-20
       ↓
7. Verify no anti-patterns
       ↓
8. Run verification checklist
       ↓
9. Test and iterate
```

## 8. Agent Tool Invocation

When subagents are invoked via the `Agent` tool, these parameters control execution:

### Invocation Parameters

| Parameter | Type | Required | Purpose |
|-----------|------|----------|---------|
| `prompt` | string | Yes | Complete task description with context |
| `description` | string | Yes | Short 3-5 word summary for UI |
| `subagent_type` | string | No | Agent type or custom agent name |
| `run_in_background` | boolean | No | Non-blocking execution |
| `isolation` | `"worktree"` | No | Git worktree isolation for safe changes |
| `resume` | string | No | Agent ID to resume previous session |
| `model` | string | No | Override: opus/sonnet/haiku |

### Built-in Agent Types

| Type | Capability | Use Case |
|------|-----------|----------|
| `general-purpose` | All tools | Default; multi-step tasks |
| `Explore` | Read-only | Codebase search, pattern finding |
| `Plan` | Read-only | Implementation design |
| `claude-code-guide` | Docs/search | Claude Code feature questions |

### Custom Agent Invocation

Custom agents are invoked by their `name` field:

```
# Invokes .claude/agents/code-reviewer/agent.md
Agent(subagent_type="code-reviewer", prompt="Review auth changes")
```

### Parallel Launch Pattern

Launch multiple agents in a single message for parallel execution:

```
Agent(prompt="Find auth code", subagent_type="Explore", run_in_background=true)
Agent(prompt="Find tests", subagent_type="Explore", run_in_background=true)
```

### Worktree Isolation

Use `isolation="worktree"` when agents modify files to prevent conflicts:

```
Agent(prompt="Refactor auth module", isolation="worktree")
```

- Creates a temporary git worktree (isolated repo copy)
- Auto-cleaned if no changes made
- Returns worktree path and branch if changes were made

## 9. File Locations

### Claude Code Agent Locations

| Type | Location | Scope | Priority |
|------|----------|-------|----------|
| Project | `.claude/agents/` | Current project | Highest |
| User | `~/.claude/agents/` | All projects | Lower |
| CLI | `--agents` flag | Current session | Medium |

### Recommended Structure

```
.claude/
└── agents/
    └── your-agent/
        ├── agent.md              # Main agent file
        ├── patterns/             # Reusable patterns
        ├── anti-patterns/        # Anti-patterns to avoid
        ├── templates/            # Templates for outputs
        └── docs/                 # Documentation
```
