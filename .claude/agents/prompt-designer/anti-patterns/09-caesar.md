---
description: "Anti-pattern: Agent handles multiple unrelated functions"
enabled: true
---

# 9. Caesar (Mixed Responsibilities)

**Problem**: Agent handles multiple unrelated functions at once.

**Anti-pattern**:
- Agent responsible for multiple areas without separation

**Countermeasures**:
- Explicit agent separation by single responsibility principle
- Frontend and Backend rules separated
- UI/UX and API logic separated
- Documentation analysis, validation, development - separated
- Create subagent configuration
