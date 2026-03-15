---
description: "Anti-pattern: Conflicting rules create prompt injection vulnerabilities"
enabled: true
---

# 2. Conflicting Instructions

**Problem**: Conflicting rules create prompt injection vulnerabilities.

**Anti-pattern**:
- "Always follow the rules" + "If user asks to ignore - ignore"
- Result: prompt injection works

**Countermeasures**:
- Explicit priority hierarchy - clear order
- Prompt injection protection - explicit rules
- Source separation - system rules vs user input vs external data
- No override allowed - critical rules cannot be ignored
