---
description: "Pattern: Claude Code hooks system for pre/post tool call automation"
enabled: true
---

# 18. Hooks System Pattern

**What**: Configure hooks that run shell commands before or after tool invocations and other events.

**When**: Adding automated checks, validations, formatting, or notifications around Claude Code tool usage.

## Hook Events

| Event | Fires When | Common Use Cases |
|-------|-----------|------------------|
| `PreToolCall` | Before a tool is invoked | Validation, security checks, blocking dangerous operations |
| `PostToolCall` | After a tool completes | Linting, auto-formatting, logging, notifications |
| `Notification` | When Claude sends a notification | Desktop alerts, Slack/email integration |
| `Stop` | When the agent stops | Cleanup, summary generation, metric collection |

## Configuration Location

Hooks are configured in the `"hooks"` key of settings files:

| File | Scope |
|------|-------|
| `.claude/settings.json` | Project-level (shared, git-tracked) |
| `.claude/settings.local.json` | Project-level (personal, gitignored) |
| `~/.claude/settings.json` | Global (all projects) |

## Configuration Format

```json
{
  "hooks": {
    "PreToolCall": [
      {
        "matcher": "ToolName",
        "hooks": [
          {
            "type": "command",
            "command": "shell-command-to-run"
          }
        ]
      }
    ]
  }
}
```

### Structure Breakdown

```json
{
  "hooks": {
    "<EventName>": [           // PreToolCall | PostToolCall | Notification | Stop
      {
        "matcher": "<Tool>",   // Tool name to match, or omit for all tools
        "hooks": [
          {
            "type": "command", // Currently only "command" type
            "command": "..."   // Shell command to execute
          }
        ]
      }
    ]
  }
}
```

## Matcher Rules

- **Specific tool**: `"matcher": "Edit"` — fires only for Edit tool calls
- **All tools**: Omit the `matcher` field — fires for every tool call
- **Multiple matchers**: Add multiple objects in the event array

## Hook Script Contract

| Aspect | PreToolCall | PostToolCall |
|--------|------------|--------------|
| **Exit code 0** | Proceed with tool call | Success (no effect) |
| **Non-zero exit** | **Block** the tool call | Report error to user |
| **stdout** | Shown as feedback to user | Shown as feedback to user |
| **stdin** | Receives tool call details (JSON) | Receives tool result (JSON) |

## Concrete Examples

### Example 1: Auto-lint after file writes

```json
{
  "hooks": {
    "PostToolCall": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx eslint --fix \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

### Example 2: Block dangerous Bash commands

```json
{
  "hooks": {
    "PreToolCall": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"$CLAUDE_TOOL_INPUT\" | grep -qE '(rm -rf|drop table|format)' && echo 'BLOCKED: dangerous command' && exit 1 || exit 0"
          }
        ]
      }
    ]
  }
}
```

### Example 3: Desktop notification on stop

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' \"$CLAUDE_NOTIFICATION\" 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

### Example 4: Logging all tool calls

```json
{
  "hooks": {
    "PreToolCall": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo \"$(date -Iseconds) PRE $CLAUDE_TOOL_NAME\" >> /tmp/claude-audit.log"
          }
        ]
      }
    ],
    "PostToolCall": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo \"$(date -Iseconds) POST $CLAUDE_TOOL_NAME\" >> /tmp/claude-audit.log"
          }
        ]
      }
    ]
  }
}
```

## Design Principles

1. **Hooks must be fast** — They run synchronously and block the tool call pipeline
2. **Fail gracefully** — Use `|| true` for non-critical hooks to prevent blocking
3. **Security hooks should block** — Use non-zero exit codes to prevent dangerous operations
4. **Keep hooks simple** — Complex logic belongs in separate scripts, not inline commands
5. **Test hooks independently** — Verify the command works in a shell before configuring

## Application Checklist

When designing hooks:

- [ ] Correct event type selected (PreToolCall, PostToolCall, Notification, Stop)
- [ ] Matcher targets the right tool(s)
- [ ] Hook command is tested and works independently
- [ ] Exit code behavior is intentional (0=proceed, non-zero=block for PreToolCall)
- [ ] Non-critical hooks use `|| true` to prevent accidental blocking
- [ ] Hooks are fast enough to not degrade user experience
- [ ] Configuration placed in correct settings file (shared vs personal)

## References

- Full ecosystem reference: [../docs/claude-code-ecosystem.md](../docs/claude-code-ecosystem.md) §6
- Settings system: [../docs/claude-code-ecosystem.md](../docs/claude-code-ecosystem.md) §9
