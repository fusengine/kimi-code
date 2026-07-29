# Recommended Workflows for Agents

## APEX Workflow (Kimi Code)

```
A - Analyze    : Understand the problem
P - Plan       : Plan the approach
E - Execute    : Implement the solution
X - eXamine    : Validate the result
```

### Workflow Detail

```
┌─────────────────────────────────────────────────────┐
│                    A - ANALYZE                       │
├─────────────────────────────────────────────────────┤
│ 1. Launch explore-codebase (architecture)           │
│ 2. Launch research-expert (documentation)           │
│ 3. Launch specialized-expert (framework)            │
│    → Execute in PARALLEL                            │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                     P - PLAN                         │
├─────────────────────────────────────────────────────┤
│ 1. Use TaskCreate to decompose                       │
│ 2. Estimate file sizes (<100 lines)                 │
│ 3. Identify necessary modifications                 │
│ 4. Validate plan (optional: EnterPlanMode)          │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                    E - EXECUTE                       │
├─────────────────────────────────────────────────────┤
│ 1. Use the appropriate expert agent                 │
│ 2. Follow SOLID rules                               │
│ 3. Split files at 90 lines                          │
│ 4. Document each function (JSDoc/PHPDoc)            │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                    X - EXAMINE                       │
├─────────────────────────────────────────────────────┤
│ 1. Launch sniper (6 validation phases)              │
│ 2. Fix linter errors                                │
│ 3. Verify 0 errors                                  │
│ 4. Re-run if corrections applied                    │
└─────────────────────────────────────────────────────┘
```

## TDD Workflow with Agents

```
┌─────────────────────────────────────────────────────┐
│            1. WRITE TESTS FIRST                      │
├─────────────────────────────────────────────────────┤
│ - Define expected inputs/outputs                    │
│ - Create test files                                 │
│ - DO NOT implement yet                              │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│            2. VERIFY TESTS FAIL                      │
├─────────────────────────────────────────────────────┤
│ - Execute tests                                     │
│ - Confirm they fail                                 │
│ - This is expected at this stage                    │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│            3. COMMIT TESTS                           │
├─────────────────────────────────────────────────────┤
│ - Commit tests BEFORE the code                      │
│ - Message: "test: add tests for [feature]"          │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│            4. IMPLEMENT                              │
├─────────────────────────────────────────────────────┤
│ - Code until tests pass                             │
│ - Minimum viable to pass tests                      │
│ - Refactor if necessary                             │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│            5. VERIFY WITH SUBAGENT                   │
├─────────────────────────────────────────────────────┤
│ - Launch a subagent for review                      │
│ - Isolated context (Fresh Eyes)                     │
│ - Avoids overfitting to tests                       │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│            6. COMMIT CODE                            │
├─────────────────────────────────────────────────────┤
│ - Commit the implementation                         │
│ - Message: "feat: implement [feature]"              │
└─────────────────────────────────────────────────────┘
```

## Explore-Plan-Code Workflow

Simplified workflow for development tasks:

```
┌─────────────────┐
│     EXPLORE     │
├─────────────────┤
│ - Read files    │
│ - Understand    │
│   the context   │
│ - DO NOT code   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      PLAN       │
├─────────────────┤
│ - Create a plan │
│ - "think hard"  │
│ - Validate      │
│   before exec   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      CODE       │
├─────────────────┤
│ - Implement     │
│ - Follow plan   │
│ - Tests after   │
└─────────────────┘
```

## Code Review Workflow

```
┌─────────────────────────────────────────────────────┐
│                 1. CONTEXT LOADING                   │
├─────────────────────────────────────────────────────┤
│ - Read the code to review                           │
│ - Understand the change objective                   │
│ - Identify impacted files                           │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                 2. ANALYSIS                          │
├─────────────────────────────────────────────────────┤
│ Check:                                              │
│ - Correct logic?                                    │
│ - Edge cases handled?                               │
│ - Conventions respected?                            │
│ - Security OK?                                      │
│ - Acceptable performance?                           │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                 3. FEEDBACK                          │
├─────────────────────────────────────────────────────┤
│ Format:                                             │
│ - 🔴 BLOCKING: [critical issue]                     │
│ - 🟡 SUGGESTION: [improvement]                      │
│ - 🟢 NITPICK: [minor detail]                        │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                 4. VERDICT                           │
├─────────────────────────────────────────────────────┤
│ - ✅ APPROVED (0 blocking)                          │
│ - 🔄 REQUEST CHANGES (blocking present)             │
│ - 💬 COMMENT (questions/discussions)                │
└─────────────────────────────────────────────────────┘
```

## Debugging Workflow

```
┌─────────────────────────────────────────────────────┐
│              1. REPRODUCE                            │
├─────────────────────────────────────────────────────┤
│ - Confirm the bug                                   │
│ - Identify reproduction steps                       │
│ - Document expected vs actual behavior              │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              2. ISOLATE                              │
├─────────────────────────────────────────────────────┤
│ - Reduce scope                                      │
│ - Identify problematic file/function                │
│ - Eliminate false leads                             │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              3. HYPOTHESIZE                          │
├─────────────────────────────────────────────────────┤
│ - Formulate hypotheses                              │
│ - Prioritize by probability                         │
│ - Plan tests                                        │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              4. TEST                                 │
├─────────────────────────────────────────────────────┤
│ - Validate/invalidate each hypothesis               │
│ - Add logs if necessary                             │
│ - Use debugger if complex                           │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              5. FIX                                  │
├─────────────────────────────────────────────────────┤
│ - Apply minimal fix                                 │
│ - Verify bug is resolved                            │
│ - Verify no regression                              │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              6. PREVENT                              │
├─────────────────────────────────────────────────────┤
│ - Add regression test                               │
│ - Document if necessary                             │
│ - Improve guardrails if recurring pattern           │
└─────────────────────────────────────────────────────┘
```

## General Best Practices

### Parallelization

```
✅ Independent tasks → Parallel
   Agent 1 ──┐
   Agent 2 ──┼──► Synthesis
   Agent 3 ──┘

❌ Dependent tasks → Sequential
   Agent 1 ──► Agent 2 ──► Agent 3
```

### Contextual Isolation

```
✅ Good: Each subagent receives only what it needs
   Orchestrator extracts relevant context

❌ Bad: Pass all history to all agents
   Contextual pollution, confusion
```

### Checkpoints

```
✅ Good: Validate at each important step
   Plan OK? ──► Implement ──► Tests OK? ──► Commit

❌ Bad: Execute everything at once without verification
   Plan ──► Implement ──► Commit ──► 💥 Bugs
```
