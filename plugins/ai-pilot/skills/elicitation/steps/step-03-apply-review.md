---
name: step-03-apply-review
description: Execute each selected technique on the code, document findings
prev_step: steps/step-02-select-techniques.md
next_step: steps/step-04-self-correct.md
---

# Step 3: Apply Review Techniques

## MANDATORY EXECUTION RULES:

- 🔴 NEVER skip a selected technique
- ✅ ALWAYS document findings for each technique
- ✅ ALWAYS rate severity of issues found
- 🔍 FOCUS on actionable findings, not nitpicks

---

## Context Boundaries

**Input from Step 2:**
- `{selected_techniques}`: techniques to apply
- `{code_files}`: files to review
- `{code_categories}`: context for review

**Output for Step 4:**
- `{findings}`: issues discovered
- `{severity_map}`: critical/high/medium/low
- `{correction_plan}`: what to fix

---

## YOUR TASK:

### For Each Selected Technique:

#### 1. Execute Technique Protocol

Each technique has specific checks:

**SEC-01: OWASP Top 10 Check**
```
□ SQL Injection: Parameterized queries?
□ XSS: Output encoding?
□ CSRF: Token validation?
□ Auth Bypass: Session handling?
□ Sensitive Data: Encryption?
```

**PERF-01: N+1 Query Detection**
```
□ Loop + DB call pattern?
□ Missing includes/eager loading?
□ Query in render/template?
```

**ARCH-01: SOLID Compliance**
```
□ S: One responsibility per file?
□ O: Extensible without modification?
□ L: Subtypes substitutable?
□ I: Small focused interfaces?
□ D: Depends on abstractions?
```

**TEST-01: Edge Case Analysis**
```
□ Null/undefined inputs?
□ Empty arrays/strings?
□ Boundary values (0, -1, MAX)?
□ Invalid types?
□ Concurrent access?
```

**UX-01: Accessibility Audit**
```
□ ARIA labels present?
□ Keyboard navigation?
□ Color contrast?
□ Screen reader compatible?
□ Focus management?
```

#### 2. Document Each Finding

```markdown
| ID | Technique | Finding | File:Line | Severity |
|----|-----------|---------|-----------|----------|
| F1 | SEC-01    | Missing CSRF token | auth.ts:45 | 🔴 Critical |
| F2 | ARCH-01   | File over `FUSE_SOLID_MAX_LINES` | utils.ts | 🟡 Medium |
| F3 | TEST-01   | No null check | handler.ts:23 | 🟡 Medium |
```

#### 3. Rate Severity

| Severity | Criteria | Action |
|----------|----------|--------|
| 🔴 **Critical** | Security, data loss, crash | MUST fix |
| 🟠 **High** | Logic error, SOLID violation | SHOULD fix |
| 🟡 **Medium** | Performance, maintainability | RECOMMENDED |
| 🟢 **Low** | Style, minor improvement | OPTIONAL |

---

## Technique Execution Checklist

### Security Techniques
- [ ] `SEC-01`: OWASP Top 10 - Check all 10 categories
- [ ] `SEC-02`: Input Validation - All user inputs validated?
- [ ] `SEC-03`: Auth Flow - Proper session/token handling?
- [ ] `SEC-04`: Authorization - Role/permission checks?
- [ ] `SEC-05`: Secrets - No hardcoded credentials?

### Performance Techniques
- [ ] `PERF-01`: N+1 - No queries in loops?
- [ ] `PERF-02`: Memory - No leaks, proper cleanup?
- [ ] `PERF-03`: Complexity - O(n²) or worse flagged?
- [ ] `PERF-04`: Bundle - No unnecessary imports?

### Architecture Techniques
- [ ] `ARCH-01`: SOLID - All 5 principles checked?
- [ ] `ARCH-02`: Dependencies - Proper injection?
- [ ] `ARCH-03`: Coupling - Loose coupling?
- [ ] `ARCH-04`: File Size - All files within `FUSE_SOLID_MAX_LINES`?

### Testing Techniques
- [ ] `TEST-01`: Edge Cases - All identified?
- [ ] `TEST-02`: Error Paths - All handled?
- [ ] `TEST-03`: Boundaries - All tested?

### UX Techniques
- [ ] `UX-01`: Accessibility - a11y audit passed?
- [ ] `UX-02`: Error Messages - User-friendly?
- [ ] `UX-03`: Loading States - Proper feedback?

---

## Output Format

```markdown
## 🔍 Review Findings

### Techniques Applied
- ✅ {technique_1}: {summary}
- ✅ {technique_2}: {summary}
- ✅ {technique_3}: {summary}

### Issues Found

| # | Technique | Finding | Location | Severity |
|---|-----------|---------|----------|----------|
| 1 | {tech_id} | {issue} | {file:line} | 🔴/🟠/🟡/🟢 |

### Summary
- 🔴 Critical: {count}
- 🟠 High: {count}
- 🟡 Medium: {count}
- 🟢 Low: {count}

→ Proceeding to Step 4: Self-Correct
```

---

## Next Step

→ `step-04-self-correct.md`: Fix identified issues
