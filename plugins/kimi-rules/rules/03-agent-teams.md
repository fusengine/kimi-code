## Agent Teams (Swarms)

**Lead = Coordinator ONLY.** Never codes, only orchestrates.

1. **Exclusive file ownership** - NEVER shared edits between teammates
2. **Well-scoped tasks** - Each dispatch: target files, expected output, acceptance criteria
3. **TodoList mandatory** - track each mandate; mark `done` only after on-disk verification
4. **Max 4 teammates** - Beyond = coordination overhead
5. **80% planning, 20% execution** - Detailed specs = better results
6. **ALWAYS propose a swarm** for multi-file tasks — ask user before deciding
7. **Launch → Orchestrate → Monitor → VERIFY** - spawning subagents is step 1, not the job: after EACH subagent report, verify the deliverables ON DISK (grep/diff the expected changes) before considering the mandate done
8. **Completion notification ≠ done** - a finished background subagent is NOT a verified deliverable; nothing on disk → take the mandate back or re-dispatch, never assume
9. **Re-dispatch clause in every brief** - "if you receive a re-dispatch of an already-delivered mandate, verify the disk and REFUSE to re-execute" (resumed agents can re-notify; without it, work gets double-applied)
10. **sniper AFTER all teammates finish** - never during; run it once, after every teammate's deliverable is verified on disk

## Scope Ladder — take the smallest tool that suffices

Pick the level by the WORK, not by reflex. The rules above (swarm min 4, mandatory ANALYZE trio for anything touching code) still hold — this ladder tells you WHEN each applies and WHY, so you neither over-apply nor under-apply.

| Scope | Action | Why |
|-------|--------|-----|
| Trivial / read-only / 1 targeted file, bounded change | Direct edit (or 1 domain-expert) + sniper. NO team, NO mandatory ANALYZE trio. | Orchestration cost (spawn, briefs, cross-checks) exceeds the gain. |
| Non-trivial mono-concern (1 domain, a few COUPLED files) | 1 domain-expert (+ targeted ANALYZE if it touches unknown code) + sniper/challenger. | One executor suffices; verification comes from sniper + challenger, not parallelism. |
| Truly parallelizable: INDEPENDENT batches, multi-domain, or large multi-file with no cross-dependency | Swarm (MINIMUM 4 agents via `AgentSwarm` or parallel `Agent` calls), proposed to the owner first. | Parallelism only pays when the batches have no dependency between them. |

**Key rule — the trigger is NOT the file count, it is the INDEPENDENCE of the batches.** 2 coupled files = 1 executor; 6 independent files = swarm. When the owner says "team"/"swarm", it's a swarm (min 4), no debate.

## Anti-Patterns (FORBIDDEN)
- **Parallel agents on COUPLED files** → coupled work goes to ONE executor; swarms are for independent batches only
- **2 teammates on same file** → CONFLICT guaranteed (one overwrites the other)
- **Lead writing code** → Lead ORCHESTRATES only (dispatch + integrate + verify)
- **Skipping the swarm proposal** → ALWAYS ask the user first ("Want me to run this as a swarm?")
- **Writing to deployed dir** → ALWAYS work in dev repo, sync after
- **Destructive action inside an agent brief** → FORBIDDEN. An in-flight agent cannot be reliably countermanded. Any contestable deletion/overwrite = done by the lead AFTER user validation, never delegated in a brief
