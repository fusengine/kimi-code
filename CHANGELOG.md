# Changelog

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).

## [1.0.1] - 2026-07-29

### Added
- Central MCP catalog (`scripts/mcp/mcp.json`, 23 servers) ported from the Claude installer; merged into `~/.kimi-code/mcp.json` with requiresApiKey-aware skips that point at each provider's key URL.
- `.env.example` (Kimi variant targeting `~/.kimi-code/.env`).
- `fusengine.harnessMinVersion` floor (0.1.85) in `package.json`; installer resolves npm spec as env pin > floor > latest.

### Changed
- MCP entries normalized to the Kimi schema: no `type` field (stdio inferred from `command`, HTTP from `url`), catalog metadata stripped before writing `mcp.json`.
- README: full Setup section (hooks + API keys + MCP servers) with plugin activation steps.

## [1.0.0] - 2026-07-28

### Added
- Initial port of the Fusengine Claude Code plugins to Kimi Code CLI (K3): 24 plugins, 196 skills, 37 agents, 34 commands, 68 hook rules.
- K3-optimized core: `KIMI.template.md`, `AGENTS.md`, rules 00-08, 8 hand-written ai-pilot agents (`core-overrides/`).
- Hook shim targeting the native kimi adapter of `@fusengine/harness` (npm-sourced); `install-kimi.ts` installer; migration pipeline with reproducible regen cycle.
- Benchmark suite with measured results: 3/3 Kimi vs 3/3 Claude, 3.6–6.3× lower latency (`docs/BENCHMARK.md`).
