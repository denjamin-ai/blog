---
description: "Anti-pattern: Long context gets truncated, important content is lost"
enabled: true
---

# 5. Ignoring Context Window

**Problem**: Long context gets truncated, important content is lost.

**Anti-pattern**:
- All code in one prompt
- Beginning gets truncated, rules are lost

**Countermeasures**:
- Summarize-first pattern - summary first, then details
- Break into stages - not everything at once
- Critical content at beginning and end - protection from truncation
- RAG approach - only relevant parts of documentation
