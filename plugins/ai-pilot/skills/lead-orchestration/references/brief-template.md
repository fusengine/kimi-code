# Brief Template

## Why

A brief summarised from memory drifts from the owner's request: parts get dropped, negative constraints vanish, paths get invented. Kimi sub-agents see only the task description they are given, so the template forces the owner's exact words, the task with the files it owns, and the proof into the mandate, letting the agent be judged on disk instead of on its own summary.

## Template

```markdown
## Context
<what exists, why this mandate, what was already tried and failed>

## Owner request (verbatim)
> "<exact owner sentence(s), copied, not paraphrased>"

## Parts to deliver (acceptance criteria)
1. <part 1> -- proof: <screenshot path | test name + exit code | diff hunk>
2. <part 2> -- proof: <...>
N. Negative: <"do not touch X"> -- proof: `git diff --stat` shows no change under X

## Task and files (one agent per task)
- Task: <the single task this agent owns>
- Write: <absolute paths this task needs -- no concurrent task touches them>
- Read only: <paths you may read>
- Protected target (only if the owner named it): <path> -- owner's words: "<quote>"

## Skills to load (required)
- <SOLID skill from solid-detection>, <domain skills>, verification -- read them before editing

## Guardrails
- Re-read each file on disk right before editing; start from the on-disk state.
- No cap, timeout or limit not stated here or by the hook (FUSE_SOLID_MAX_LINES).
- Hook block -> do what it says; read the gate source before calling it a bug.
- No commit / push / tag / publish. No deletion outside your files.
- Decide every open point yourself from the measurement and the mandate's goal — never hand the owner a question or an option menu for something the goal already determines. A genuinely ambiguous IRREVERSIBLE step (rule 00 Clarify) gets ONE binary question, sent to the lead, never straight to the owner. Only a CAPTCHA, a password, or a code a hook requires the owner to type goes to the owner. A blocked hook = find another legitimate route, never a question.
- Re-dispatch of an already-delivered mandate -> verify the disk and refuse to re-execute.
- Long task: keep the TodoList current (done / blocked / next).

## Report (<= N lines; your final message is the entire handoff)
status: done | failed verification | blocked (Exit: Stop/Retry/Rollback/Ask/Escalate)
files: <path:line list>
proof: <per part: artifact path or command + exit code>
skills_consulted: <skill files actually read>
not done: <parts + why>
```

## Filling rules

| Field | Rule |
|-------|------|
| Owner request | Copy the sentence. If the owner sent a mockup/capture, give its path: it is the source of truth, not a hint. |
| Parts | One line per checklist part from intake; each has a proof the lead can open. |
| Protected target | Only when the owner named it in this session; quote him. Otherwise omit the line. |
| Report length | Pick N from the deliverable (5-15); the owner-facing reply is the lead's job. |
| External executor | Add: "write code only -- release goes through the commit agent". |
