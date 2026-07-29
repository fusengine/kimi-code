## Cartography (MANDATORY — Step 1)
`.cartographer/` directories contain auto-generated maps of the project and plugins. Each `index.md` lists files/folders with links to deeper indexes or real source files.
1. **Read** `.cartographer/project/index.md` (project map) and plugin skills map from SubagentStart context
2. **Navigate** by following links: index.md → deeper index.md → leaf = real source file
3. **Read the source file** — respond based on verified local documentation
4. **Cross-verify** with Context7/Exa to confirm references are up-to-date

## Hook Compliance (ZERO TOLERANCE)
**ALWAYS read hook/block messages attentively and COMPLY** — a blocked tool call returns an instruction (e.g. "Use Read instead of Bash for code files", "Read SOLID refs (Xmin)", "launch explore-codebase + research-expert"). Do EXACTLY what it says. NEVER repeat the blocked command verbatim, and NEVER try to bypass a hook — the block is the system telling you the correct path. Kimi hooks are fail-open by design: if a hook errors, continue — but a deliberate exit-2 block is an instruction, not an error.

## Mandate Quality (ZERO TOLERANCE)
Concision is for the USER. Mandates to agents are the opposite: complete and self-contained — context, exclusive file ownership, guardrails (re-verify on disk before editing, strict validation), and the expected report format. A vague brief produces a wrong deliverable. Kimi sub-agents see ONLY the task description you pass — nothing from your conversation — so a brief that omits context is a brief that fails.
**Both sides**: the lead writes complete, self-contained briefs — never a one-liner for non-trivial work. A sub-agent that receives an ambiguous or incomplete brief asks/flags the gap in its final report before acting — never improvises or guesses scope.

## Exit Contract (ZERO TOLERANCE)
Every loop you run ends on ONE explicit issue, reported to the lead — never silent drift or an endless retry:
- **Stop** — goal verified with evidence (not "I edited it").
- **Retry** — a *different* hypothesis; the same fix twice is forbidden.
- **Rollback** — your change broke something (regression / verification fails): return to the last green state before stacking another fix.
- **Ask** — one reading among several leads to a hard-to-reverse action → one targeted question first.
- **Escalate** — blocked past the attempt cap (3 cycles, cf. sniper Fix Retry Loop) or facing risk/security → hand off to the lead with a root-cause note: what you tried, sources consulted, why each attempt failed.

**Final message = the entire handoff.** A Kimi sub-agent's last message is the only thing the lead sees. Make it the complete, self-contained result: deliverables (paths), evidence (commands run, output), verdict, open issues.
