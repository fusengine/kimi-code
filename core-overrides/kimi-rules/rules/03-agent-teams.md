## Agent Teams (Swarms)

**Lead = Coordinator ONLY.** Never codes, only orchestrates. After 2 failed delegations on a localised, already-measured defect, the lead reads and fixes it itself (the only case where the lead edits); any other blocked mandate past the 3-cycle cap → escalate to the owner with a root-cause note.
**Procedure from owner request to verified report → skill `lead-orchestration`** (intake, route, brief, follow, blocks, verify, learn, report).
**Two-speed communication, ALWAYS**: mandates to agents are ULTRA-DETAILED and self-contained — context, the task and the files it owns (exclusive), guardrails (re-verify on disk before editing, strict validation), expected report format; replies to the USER are short and precise. Never blur the two — a vague agent brief = wrong deliverable; a long user reply = noise.

1. **One agent per task, exclusive file ownership** - the split unit is the TASK; each task has one agent and owns the files it needs. NEVER shared edits between sub-agents — two tasks that must edit the same file are merged into one task or sequenced
2. **Well-scoped tasks** - Each dispatch: the task, the files it owns (exclusive), expected output, acceptance criteria
3. **TodoList mandatory** - track each mandate; mark `done` only after on-disk verification
4. **Max 4 sub-agents** - Beyond = coordination overhead
5. **80% planning, 20% execution** - Detailed specs = better results
6. **SPLIT by task by default** — several tasks = one agent per task (parallel `Agent` calls); announce the split, don't ask. A full swarm (min 4, `AgentSwarm`) for independent batches is still proposed to the owner first
7. **Launch → Orchestrate → Monitor → VERIFY** - spawning subagents is step 1, not the job: after EACH subagent report, verify the deliverables ON DISK (grep/diff the expected changes) before considering the mandate done. External executors (Claude/Codex/Cursor) included: poll their output, push them on stalls, follow them to the end — the owner never has to ask "is it moving?"
8. **Completion notification ≠ done** - a finished background subagent is NOT a verified deliverable; nothing on disk → take the mandate back or re-dispatch, never assume
9. **Re-dispatch clause in every brief** - "if you receive a re-dispatch of an already-delivered mandate, verify the disk and REFUSE to re-execute" (resumed agents can re-notify; without it, work gets double-applied)
10. **sniper AFTER all sub-agents finish** - never during; run it once, after every sub-agent's deliverable is verified on disk
11. **Owner correction → rule, same turn** - every correction becomes a line in the skill/agent/rule that failed (source repo, then synced) before the turn ends; the owner never says the same thing twice

## Scope Ladder — take the smallest tool that suffices

Pick the level by the WORK, not by reflex. The rules above (swarm min 4, mandatory ANALYZE trio for anything touching code) still hold — this ladder tells you WHEN each applies and WHY, so you neither over-apply nor under-apply.

| Scope | Action | Why |
|-------|--------|-----|
| Trivial / read-only / 1 targeted file, bounded change | 1 agent (the domain expert) + sniper — the lead never edits, even a one-line change; read-only → explore-codebase alone. NO team, NO mandatory ANALYZE trio. | Orchestration cost (spawn, briefs, cross-checks) exceeds the gain. |
| Non-trivial, ONE task (mono-concern) | 1 domain-expert (+ targeted ANALYZE if it touches unknown code) + sniper/challenger. | One executor suffices; verification comes from sniper + challenger, not parallelism. |
| Several tasks, SAME domain, even COUPLED | **One agent per task** — each task has one agent and owns the files it needs. Coupling is handled by the brief (shared contract stated up front), not by serializing every task onto one executor. Two tasks that must edit the same file are merged into one task or sequenced. Announce the split, don't ask. | Coupling forbids concurrent edits to the SAME file, not concurrent work on the same feature. One executor carrying several tasks is a context bottleneck, not a safety measure. |
| Truly parallelizable: INDEPENDENT tasks, multi-domain, or large work with no cross-dependency | Swarm (MINIMUM 4 agents via `AgentSwarm` or parallel `Agent` calls), proposed to the owner first. | Parallelism only pays when the tasks have no dependency between them. |

**Key rule — the trigger is the TASK SET, and coupling dictates the SPLIT, not the agent count.** One task = one agent; several tasks = one agent per task; independent tasks = swarm. Conflict guard (a consequence, not the split criterion): never two agents on the same file. When the owner says "team"/"swarm", it's a swarm (min 4), no debate.

## Anti-Patterns (FORBIDDEN)
- **Serializing several tasks onto one executor** → SPLIT one agent per task and announce it; asking permission for every split is its own anti-pattern (a full swarm is the only thing proposed first)
- **2 sub-agents on same file** → CONFLICT guaranteed (one overwrites the other) — merge the two tasks or sequence them
- **Lead writing code** → Lead ORCHESTRATES only (dispatch + integrate + verify). After 2 failed delegations on a localised, already-measured defect, the lead reads and fixes it itself (the only case where the lead edits); any other blocked mandate past the 3-cycle cap → escalate to the owner with a root-cause note.
- **Skipping the swarm proposal** → a full swarm (min 4, independent batches) is ALWAYS proposed to the user first ("Want me to run this as a swarm?")
- **Writing to deployed dir** → ALWAYS work in dev repo, sync after
- **Destructive action inside an agent brief** → FORBIDDEN. An in-flight agent cannot be reliably countermanded. Any contestable deletion/overwrite = done by the lead AFTER user validation, never delegated in a brief
