---
description: "Checklist for verifying rules against patterns and anti-patterns"
alwaysApply: true
---

# Rules Verification Checklist

When verifying rules for correctness, compile a list of violations in enumeration format without countermeasures.

## Violation Report Format

```
## Pattern Violations

1. [Pattern Name] - [Description of violation]
   - File: [path to file]
   - Line: [line number or section]
   - Details: [specific problem description]

2. [Pattern Name] - [Description of violation]
   ...

## Anti-Pattern Usage

1. [Anti-Pattern Name] - [Description of usage]
   - File: [path to file]
   - Line: [line number or section]
   - Details: [specific problem description]

2. [Anti-Pattern Name] - [Description of usage]
   ...
```

## Patterns to Verify

### 1. Persona / Role Pattern
**Check**: Is role and specialization explicitly defined?
- ❌ Violation: Role not specified or too abstract
- ❌ Violation: Specialization not defined
- ❌ Violation: Responsibility boundaries not outlined

### 2. Goal & Constraints Pattern
**Check**: Are goal and constraints explicitly stated?
- ❌ Violation: Task goal not defined
- ❌ Violation: Constraints not specified
- ❌ Violation: Prohibitions stated abstractly

### 3. Delimiters / Sections Pattern
**Check**: Is structure clearly divided into sections?
- ❌ Violation: Missing explicit delimiters (XML/markdown tags)
- ❌ Violation: Sections not structured
- ❌ Violation: Important information drowns in text

### 4. Chain-of-Thought Pattern
**Check**: Is model asked to "think" first?
- ❌ Violation: Missing thinking phase before action
- ❌ Violation: No step-by-step reasoning

### 5. Decomposition Pattern
**Check**: Is large task broken into subtasks?
- ❌ Violation: Task not decomposed
- ❌ Violation: Subtasks not structured

### 6. Question Refinement Pattern
**Check**: Does agent help clarify the task?
- ❌ Violation: Missing mechanism for clarifying unclear tasks

### 7. Critic / Self-Review Pattern
**Check**: Does model verify its own response?
- ❌ Violation: Missing self-review phase
- ❌ Violation: No verification checklist

### 8. Strict Format Pattern
**Check**: Is output format strictly defined?
- ❌ Violation: Output format not specified
- ❌ Violation: Format described unclearly
- ❌ Violation: Missing format examples

### 9. Uncertainty / Honesty Pattern
**Check**: Is there an "I don't know" policy?
- ❌ Violation: Missing permission to admit uncertainty
- ❌ Violation: No instructions to request sources

### 10. Tool Usage Pattern
**Check**: Is it clearly described when and how to use tools?
- ❌ Violation: Tool usage not regulated
- ❌ Violation: Tool selection criteria not specified

### 11. Priority Governance Pattern
**Check**: Is there explicit instruction priority hierarchy?
- ❌ Violation: Priority hierarchy not defined
- ❌ Violation: Conflicts resolved implicitly

### 12. Summarize-Then-Answer Pattern
**Check**: Is there summarize-first for long contexts?
- ❌ Violation: Missing context compression phase
- ❌ Violation: Long context used directly

### 13. Blend Pattern
**Check**: Is pattern combination applied correctly?
- ❌ Violation: Patterns conflict with each other
- ❌ Violation: Patterns applied incorrectly

## Anti-Patterns to Verify

### 1. Watery Novel
**Check**: Are rules concrete, not abstract?
- ❌ Anti-pattern: Abstract formulations instead of concrete rules
- ❌ Anti-pattern: Using phrases like "do well", "be careful"
- ❌ Anti-pattern: Missing operational instructions

### 2. Conflicting Instructions
**Check**: No contradictions in rules?
- ❌ Anti-pattern: Contradictory rules in one document
- ❌ Anti-pattern: Rules that can be interpreted differently
- ❌ Anti-pattern: Missing prompt injection protection

### 3. Bible Without Structure
**Check**: Is long prompt structured?
- ❌ Anti-pattern: Long text without section division
- ❌ Anti-pattern: Important information lost in text mass
- ❌ Anti-pattern: Missing explicit delimiters

### 4. Free Formatting
**Check**: Is output format clearly defined?
- ❌ Anti-pattern: Output format not defined
- ❌ Anti-pattern: Format described vaguely, allows interpretations
- ❌ Anti-pattern: Missing examples

### 5. Ignoring Context Window
**Check**: Are context limits considered?
- ❌ Anti-pattern: Long context without compression
- ❌ Anti-pattern: Important information at end of long context
- ❌ Anti-pattern: Missing summarize-first for long contexts

### 6. Blind Faith in External Data
**Check**: Is external data marked as UNTRUSTED?
- ❌ Anti-pattern: External data perceived as instructions
- ❌ Anti-pattern: Missing explicit UNTRUSTED label
- ❌ Anti-pattern: Vulnerability to prompt injection through external data

### 7. No Uncertainty Policy
**Check**: Is there permission to say "I don't know"?
- ❌ Anti-pattern: Model forced to hallucinate instead of admitting uncertainty
- ❌ Anti-pattern: Missing uncertainty policy
- ❌ Anti-pattern: No instructions to request sources

### 8. Magical Thinking
**Check**: Are all instructions explicit?
- ❌ Anti-pattern: Hoping model will figure it out without explicit rules
- ❌ Anti-pattern: Implicit expectations from model
- ❌ Anti-pattern: Missing specific instructions

### 9. Caesar
**Check**: Does agent handle logically related functions?
- ❌ Anti-pattern: One agent performs multiple unrelated functions
- ❌ Anti-pattern: Mixing responsibilities of different roles
- ❌ Anti-pattern: Missing clear separation of duties

## Claude Code Subagent Verification

### 14. Subagent Design Pattern
**Check**: Does the subagent follow Claude Code format?

#### YAML Frontmatter
- [ ] `name` field present and valid (lowercase, hyphens only)
- [ ] `description` field present and descriptive
- [ ] `tools` field contains valid tool names (if present)
- [ ] `model` field contains valid value: opus/sonnet/haiku/inherit (if present)

**Violations:**
- ❌ Violation: Missing `name` field
- ❌ Violation: Missing `description` field
- ❌ Violation: Invalid `name` format (CamelCase, underscores, spaces)
- ❌ Violation: Invalid `tools` value (unknown tool name)
- ❌ Violation: Invalid `model` value

#### Tool Selection
- [ ] Only required tools are specified
- [ ] Read-only agents don't have Edit/Write/Bash
- [ ] Tool selection matches agent responsibilities

**Violations:**
- ❌ Violation: Unnecessary tools included
- ❌ Violation: Analysis agent has write permissions
- ❌ Violation: Tools don't match stated responsibilities

#### Model Selection
- [ ] Model matches task complexity
- [ ] `opus` used only for complex architectural decisions
- [ ] `sonnet` used for general tasks
- [ ] `haiku` used only for simple transformations

**Violations:**
- ❌ Violation: Simple task uses opus (overkill)
- ❌ Violation: Complex task uses haiku (insufficient)
- ❌ Violation: Model doesn't match task requirements

## Claude Code Ecosystem Verification

### 15. Rules System Pattern
**Check**: Are `.claude/rules/` files correctly structured?
- ❌ Violation: Missing `description` field in rule frontmatter
- ❌ Violation: Neither `alwaysApply` nor `globs` specified (and description is too vague for relevance matching)
- ❌ Violation: `globs` pattern doesn't match intended files
- ❌ Violation: Rule content belongs in CLAUDE.md (project-wide, not file-specific)
- ❌ Violation: Rule conflicts with existing rules or CLAUDE.md content

### 16. CLAUDE.md System Pattern
**Check**: Is CLAUDE.md correctly placed and populated?
- ❌ Violation: CLAUDE.md contains per-file rules that belong in `.claude/rules/`
- ❌ Violation: CLAUDE.md contains secrets or credentials
- ❌ Violation: CLAUDE.md is excessively long (wastes context window)
- ❌ Violation: Architecture overview is stale or missing
- ❌ Violation: Build/test commands are missing or incorrect

### 17. Memory System Pattern
**Check**: Are memory files correctly structured and used?
- ❌ Violation: Memory file missing required frontmatter (name, description, type)
- ❌ Violation: Memory type incorrect (e.g., user feedback stored as project memory)
- ❌ Violation: MEMORY.md index exceeds 200 lines
- ❌ Violation: Memory content duplicates CLAUDE.md or rules content
- ❌ Violation: Feedback memory missing **Why** and **How to apply** sections
- ❌ Violation: Project memory uses relative dates instead of absolute dates

### 18. Hooks System Pattern
**Check**: Are hooks correctly configured?
- ❌ Violation: Hook event type incorrect (e.g., PostToolCall for validation that should be PreToolCall)
- ❌ Violation: Hook matcher targets wrong tool
- ❌ Violation: Hook command not tested independently
- ❌ Violation: Non-critical hook missing `|| true` (may accidentally block operations)
- ❌ Violation: Hook in shared settings.json that should be in settings.local.json (personal)

### 19. Skills System Pattern
**Check**: Is the skill correctly designed?
- ❌ Violation: Skill file missing `name` or `description` in frontmatter
- ❌ Violation: Skill has multiple unrelated responsibilities (Caesar anti-pattern)
- ❌ Violation: Skill should be an agent (needs separate context or autonomous execution)
- ❌ Violation: Skill prompt lacks concrete output format
- ❌ Violation: Skill duplicates existing built-in skill functionality

### 20. Plan Mode Pattern
**Check**: Does the plan mode workflow follow the 5-phase pattern?
- ❌ Violation: Plan file missing Context section (no explanation of why)
- ❌ Violation: Implementation steps don't reference specific files
- ❌ Violation: Missing verification section (no way to test changes)
- ❌ Violation: Existing functions/utilities not referenced for reuse
- ❌ Violation: Turn ends without AskUserQuestion or ExitPlanMode
- ❌ Violation: Plan approval requested via text instead of ExitPlanMode

## Example Report

```
## Pattern Violations

1. Persona / Role Pattern - Role not explicitly defined
   - File: .cursor/rules/example.mdc
   - Section: <SYSTEM_RULES>
   - Details: Missing explicit agent role specification, only general phrases

2. Strict Format Pattern - Output format not defined
   - File: .cursor/rules/example.mdc
   - Section: <OUTPUT_FORMAT>
   - Details: Section empty, no required format description

## Anti-Pattern Usage

1. Watery Novel - Abstract formulations
   - File: .cursor/rules/example.mdc
   - Line: 15
   - Details: Using phrase "do quality work" without specific criteria

2. Conflicting Instructions - Contradictory rules
   - File: .cursor/rules/example.mdc
   - Sections: <CONSTRAINTS> and <WORKFLOW>
   - Details: Rule "always use TypeScript" conflicts with "use JavaScript for simple scripts"
```
