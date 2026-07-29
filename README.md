# Fusengine Kimi Code Plugins

Port of the [Fusengine Claude Code plugins](../claude-plugins/) to **Kimi Code CLI**, re-architected for **K3** (1M-token context, native reasoning, native vision) — not a literal translation.

- **24 plugins** · 196 skills · 37 agents · 34 commands · 68 hook rules
- Same agentic core as the Claude version: APEX methodology, sniper/challenger verification, domain experts, SOLID/DRY guards — wired through the same `@fusengine/harness` binary
- Measured parity with Claude Code on the benchmark suite: **3/3 tasks, 3.6–6.3× lower latency** — see [`docs/BENCHMARK.md`](docs/BENCHMARK.md)

## Layout

```
kimi-code/
├── KIMI.template.md          # Global system-prompt template (K3-optimized)
├── AGENTS.md                 # Operational global rules (installed to ~/.kimi-code/AGENTS.md)
├── marketplace.json          # Plugin catalog for /plugins marketplace
├── plugins/                  # 24 plugins (kimi.plugin.json manifests)
│   ├── kimi-rules/           # Core rules corpus 00-08 + template
│   ├── ai-pilot/             # sniper, challenger, explore-codebase, research-expert, …
│   └── …                     # domain experts (nextjs, laravel, react, rust, go, …)
├── scripts/
│   ├── migrate.ts            # Claude→Kimi migration pipeline (6 steps, JSON report)
│   ├── install-kimi.ts       # Installer → $KIMI_CODE_HOME
│   ├── validate.ts           # Conformance checks (24/24 green)
│   ├── hooks/kimi-hook-shim.mjs   # Env bridge → @fusengine/harness
│   └── benchmark/            # 3-task comparative benchmark (kimi vs claude)
└── docs/
    ├── MIGRATION.md          # Architectural analysis Claude→K3
    └── BENCHMARK.md          # Protocol + measured results
```

## Install

```bash
cd kimi-code
bun run scripts/install-kimi.ts          # dry-run: prints the plan
bun run scripts/install-kimi.ts --yes    # applies to ~/.kimi-code
```

The installer: backs up existing config, installs the harness runtime, copies `AGENTS.md`, merges the rules corpus between idempotent fences, merges MCP servers into `~/.kimi-code/mcp.json`, materializes agents into `~/.kimi-code/agents/`, and writes `marketplace.json`. It then prints the two interactive commands to finish plugin activation:

```
/plugins marketplace <absolute path to kimi-code/marketplace.json>
/plugins install <plugin id>     # per plugin, then /reload
```

## Requirements

- Bun ≥ 1.1 · Kimi Code CLI ≥ 0.29
- Le harness `@fusengine/harness` est installé depuis **npm** (registre officiel) par l'installateur — aucune dépendance envers une autre CLI

## Regenerating

```bash
bun run scripts/migrate.ts              # claude-plugins/plugins → plugins/ (24/24, JSON report)
bun run scripts/scrub-claude-refs.ts
bun run scripts/apply-core-overrides.ts # re-applies the hand-written K3 core (kimi-rules, ai-pilot agents, shims)
bun run scripts/validate.ts
bun run scripts/benchmark/run.ts --cli=both
```

The hand-written core lives in `core-overrides/` (`kimi-rules/` plugin + the 8 ai-pilot agents) so a full mechanical regeneration never loses it.

## Known accepted regressions

- One `type:"prompt"` hook (core-guards Stop) dropped — Kimi hooks are command-only; noted in `plugins/migration-report.json`.
- Agent `model:` routing (sonnet/opus) removed — all subagents run on the main model (K3).
- See `docs/MIGRATION.md` §5 for the full list and rationales.
