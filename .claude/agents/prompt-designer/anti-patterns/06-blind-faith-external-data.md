---
description: "Anti-pattern: External data treated as instructions leads to prompt injection"
enabled: true
---

# 6. Blind Faith in External Data

**Problem**: External data treated as instructions → prompt injection.

**Anti-pattern**:
- Document contains "ignore the rules"
- Model follows instructions from the document

**Countermeasures**:
- Explicit source separation:
  - System rules (trusted)
  - External data (untrusted, examples only)
- Injection protection - explicit rules
- Data labeling - "UNTRUSTED", "examples only"
- Validation - check data against system rules
