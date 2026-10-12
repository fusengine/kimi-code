---
name: step-04-self-correct
description: Expert self-corrects identified issues from review findings
prev_step: steps/step-03-apply-review.md
next_step: steps/step-05-report.md
---

# Step 4: Self-Correct

## MANDATORY EXECUTION RULES:

- 🔴 NEVER skip Critical or High severity issues
- ✅ ALWAYS fix in order: Critical → High → Medium
- ✅ ALWAYS document each correction
- 🔍 FOCUS on minimal, precise fixes

---

## Context Boundaries

**Input from Step 3:**
- `{findings}`: issues discovered
- `{severity_map}`: prioritized issues
- `{correction_plan}`: what to fix

**Output for Step 5:**
- `{corrections_made}`: list of fixes applied
- `{remaining_issues}`: issues deferred (Low only)
- `{files_modified}`: updated file list

---

## YOUR TASK:

### 1. Prioritize Corrections

```
Order of fixing:
1. 🔴 Critical (MANDATORY)
2. 🟠 High (MANDATORY)
3. 🟡 Medium (RECOMMENDED)
4. 🟢 Low (OPTIONAL - defer to sniper)
```

### 2. Apply Minimal Fixes

**Principle: Smallest change that solves the issue**

```
❌ DON'T:
- Refactor unrelated code
- Add features while fixing
- Change style of working code

✅ DO:
- Fix only the identified issue
- Preserve existing patterns
- Add minimal necessary code
```

### 3. Correction Protocols

#### For Security Issues (SEC-*)
```typescript
// Finding: Missing input validation
// Before
function login(email, password) {
  return auth.signIn(email, password)
}

// After (minimal fix)
function login(email: string, password: string) {
  if (!email || !password) throw new Error('Missing credentials')
  if (!isValidEmail(email)) throw new Error('Invalid email')
  return auth.signIn(email, password)
}
```

#### For SOLID Issues (ARCH-01)
```typescript
// Finding: File over FUSE_SOLID_MAX_LINES
// Action: Split into focused files
// utils.ts (over the ceiling) →
//   utils/validation.ts (validation)
//   utils/formatting.ts (formatting)
//   utils/index.ts (barrel)
```

#### For N+1 Issues (PERF-01)
```typescript
// Finding: Query in loop
// Before
const users = await getUsers()
for (const user of users) {
  user.posts = await getPosts(user.id) // N+1!
}

// After (minimal fix)
const users = await getUsers()
const userIds = users.map(u => u.id)
const posts = await getPostsByUserIds(userIds) // Single query
users.forEach(u => u.posts = posts.filter(p => p.userId === u.id))
```

#### For Edge Case Issues (TEST-01)
```typescript
// Finding: No null check
// Before
function processData(data) {
  return data.items.map(i => i.name)
}

// After (minimal fix)
function processData(data) {
  if (!data?.items) return []
  return data.items.map(i => i.name)
}
```

### 4. Document Each Correction

```markdown
### Correction #{n}

**Issue**: {finding_description}
**Severity**: {severity}
**Location**: {file}:{line}
**Fix Applied**: {description}

```diff
- old code
+ new code
```
```

---

## Correction Checklist

For each finding:
- [ ] Read the issue and location
- [ ] Understand root cause
- [ ] Design minimal fix
- [ ] Apply correction
- [ ] Verify fix compiles/runs
- [ ] Document the change

---

## Output Format

```markdown
## 🔧 Self-Corrections Applied

### Corrections Made

#### 1. {issue_title}
- **Severity**: 🔴/🟠/🟡
- **File**: {file_path}
- **Fix**: {description}

#### 2. {issue_title}
- **Severity**: 🔴/🟠/🟡
- **File**: {file_path}
- **Fix**: {description}

### Summary
- ✅ Fixed: {count} issues
- ⏳ Deferred: {count} low-severity issues (for sniper)

### Files Modified
- {file_1}
- {file_2}

→ Proceeding to Step 5: Report
```

---

## Next Step

→ `step-05-report.md`: Generate elicitation summary report
