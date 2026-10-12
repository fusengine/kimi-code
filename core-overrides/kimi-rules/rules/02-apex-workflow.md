## APEX Auto-Trigger

**FULL APEX MANDATORY** — Analyze → Plan → Execute → **eLicit** (adversarial review) → **Verify** (functional check) → **eXamine** (sniper). Gate: **eLicit + Verify BEFORE sniper — NEVER skip**; the `challenger` runs at every eLicit and Verify gate (see 00-critical-rules, Critical Rule 5).
Task = create/build/feature/refactor/debug/multi-file → **consult APEX skills first**: `apex` / `apex-methodology` (+ `apex-quick` for trivial). The full methodology lives there, not inline here.

**USE APEX:** create, implement, add, build, refactor, migrate, new component, multi-file, architecture changes
**SKIP APEX:** questions, trivial fix (1-3 lines) — the edit is still made by one delegated agent, never by the lead, read-only, simple git
**Debug/Investigation:** "why", "not working", "bug", "crash", "doesn't load" → ALWAYS use Analyze (explore-codebase + research-expert + domain-expert) — always go through Analyze, never straight to a fix

**Shortcuts:** `/fusengine:apex-quick` command (single-expert fast path — skips Brainstorm+Analyze+swarm, linter-only verify) | `--skip-elicit` (skip eLicit, straight to eXamine) — eXamine/sniper itself is NEVER skippable (00-critical-rules)

## Full APEX Flow

```
Brainstorm → Analyze → Plan → Execute (TDD) → eLicit → Verify → eXamine
```

| Phase | Tool / Agent | When |
|-------|-------|------|
| **Brainstorm** | `brainstorming` agent | New features, major changes. Skip for trivial fixes, bug fixes with clear repro |
| **Analyze** | explore-codebase + research-expert | Always (parallel agents, one message) |
| **Plan** | TodoList + a written mandate per task — one agent per task (the task, the files it owns, expected output, criteria) | Always. Two tasks that must edit the same file are merged into one task or sequenced; file size is governed by the hook's `FUSE_SOLID_MAX_LINES`, never by a self-set cap |
| **Execute** | Domain expert + `tdd` | Write test FIRST (RED), then code (GREEN), then refactor |
| **eLicit** | `challenger` (adversarial review) | Expert self-review, independent verdict |
| **Verify** | `verification` | Run the actual build/tests — a Verify without execution is a guess |
| **eXamine** | sniper | Code quality validation (ZERO errors) |

## sniper 7 Phases (aligned with `ai-pilot/agents/sniper.md`)
explore-codebase ∥ research-expert (parallel) -> grep usages -> jscpd DRY scan -> [react-effects-audit if `.tsx`/`.jsx`] -> run linters -> apply fixes -> re-run ALL checks = **ZERO errors**

## eLicit Modes
- `--auto`: Auto-detect code type -> challenger verdict CONFIRMED/REFUTED/UNCERTAIN
- `--manual`: Expert proposes 5 techniques, user chooses
