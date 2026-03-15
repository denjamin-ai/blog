---
name: review
description: "Run a security and quality code review on changed files. Use this skill whenever code has been written, modified, or refactored — even small changes. Also use when the user says 'check my code', 'review this', 'is this safe', 'look for bugs', or before committing. Catches security vulnerabilities, type errors, edge-cases, and pattern violations specific to this Next.js/Drizzle/MDX blog project."
---

# Code Review

Perform a thorough code review on recently changed files, focusing on issues that are easy to miss but costly in production.

## Why this matters

This project has had 30 issues caught in past reviews (Phase 5), including auth bypass risks, XSS vectors in MDX iframes, memory leaks in useEffect, and bcrypt hash corruption from dotenv-expand. A quick review after each change prevents these from recurring.

## Steps

1. **Find what changed**

   Run `git diff --name-only` and `git diff --cached --name-only` to identify modified and staged files. If nothing shows up, check `git status` for untracked files. If the user specified particular files, use those instead.

   If there are no changes at all, say "No changes to review" and stop.

2. **Delegate to code-reviewer agent**

   Launch the `code-reviewer` agent with the file list. The agent is read-only and specializes in this project's patterns:

   ```
   Agent(subagent_type="code-reviewer", prompt="Review these files: [list]. Check each for: (1) security — secret exposure, XSS, input validation, auth bypass; (2) correctness — JSON.parse without try-catch, missing await, null edge-cases; (3) consistency — unnecessary 'use client', wrong ID generation, Tailwind inconsistencies.")
   ```

3. **Present the report**

   Show findings grouped by severity (critical → medium → low). Include file paths and line numbers for each finding. If everything passes, confirm with a short "All checks passed" message — don't pad with unnecessary detail.

## Example output

```
## Code Review: 3 files

- Critical: 1 | Medium: 2 | Low: 0

### Critical
1. **XSS** — src/components/mdx/run-code.tsx:45 — User content embedded in iframe without escaping `</script>`

### Medium
1. **Missing try-catch** — src/app/blog/[slug]/page.tsx:23 — JSON.parse(article.tags) can throw on corrupt data
2. **Cleanup** — src/components/mdx/copy-button.tsx:18 — useEffect adds DOM nodes but cleanup doesn't remove them
```
