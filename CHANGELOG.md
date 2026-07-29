# Changelog

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).




## [1.0.4] - 2026-07-29

### Added
- Interactive MCP API-key prompting at install time (parity with the Claude installer): missing keys are asked, saved to `~/.kimi-code/.env`, and used for the same run's MCP merge. Piped stdin is supported (non-TTY safe).

### Fixed
- Installer summary no longer prints the obsolete 24-command granular flow; next steps adapt to where setup ran from (managed plugin copy vs repo clone).
- Silent exit when prompting with piped stdin (readline EOF mid-await).

## [1.0.3] - 2026-07-29

### Changed
- README: single install flow in the Claude block format — `/plugins install https://github.com/fusengine/kimi-code` then `~/.kimi-code/plugins/managed/fusengine/setup.sh`.

## [1.0.2] - 2026-07-29

### Added
- Root `.kimi-plugin/plugin.json`: the repo installs as ONE plugin (`fusengine` namespace) via `/plugins install https://github.com/fusengine/kimi-code` — 196 skills, 34 commands, 68 hook rules.
- `scripts/build-root-manifest.ts` regenerates the root manifest (version read from package.json).
- `setup.sh` / `setup.ps1` one-liner at repo root.

### Changed
- Slash-command references remapped to `/fusengine:*` across rules, agents, skills and docs.

### Removed
- Zip-based remote marketplace (superseded by the root manifest).

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
