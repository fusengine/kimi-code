# Changelog

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).

## [1.0.10] - 2026-07-29

### Fixed
- `permission-mode`: TOML upsert/read scoped to the root table — a section-scoped `default_permission_mode` no longer swallows the write, and replacements preserve trailing comments (typescript-expert review finding, toml.io semantics).
- `experimental-flag`: `writeFlagBlock` self-idempotent and no leading blank line on fresh rc files.

### Added
- `assertInstalledState` guard: `FUSE_HARNESS_REFS` must be present in `.env` with all refs dirs on disk, else an explicit "rerun install-kimi.ts" failure (prevents silent SOLID-gate fallback to other harnesses).

## [1.0.9] - 2026-07-29

### Added
- Official custom-agent spec alignment: uniform `## Final Message = Handoff` section on all 37 agent profiles (the spec drops the built-in handoff framing for custom sub-agents) and `subagents` allowlists where bodies name explicit dispatches (sniper → explore-codebase + research-expert, security-expert → sniper).

## [1.0.8] - 2026-07-29

### Added
- `configurePermissionMode` step: TTY select (YOLO ON/OFF, seeded with the current value) persists `default_permission_mode` in `~/.kimi-code/config.toml` via a surgical line edit; `FUSENGINE_PERMISSION_MODE` env override for non-interactive runs.
- `configureExperimentalFlag` step: proposes `KIMI_CODE_EXPERIMENTAL_FLAG=1` in the detected shell rc (default YES, guarded idempotent block, zsh/bash/fish) so custom agents are discovered by the v2 engine while the v1 backport (upstream #2232) is unreleased.

### Changed
- MCP preselection parity with the Claude installer: explicit `default` wins, otherwise no-key servers plus key-required ones whose `apiKeyEnv` is already set; key-required entries are labelled ✓ / ⚠ key missing in the multiselect.







## [1.0.7] - 2026-07-29

### Added
- Clack UI for the installer (TTY): intro/notes/outro, per-key text prompts, multiselect MCP server selection; plain output preserved on non-TTY.
- `selectMcpServers` step: server selection first, key prompts filtered to the selection (Claude installer parity); `FUSENGINE_MCP_SERVERS` env allowlist for non-interactive runs.
- Agents materialize as SYMLINKS to the managed plugin copy (live-updated by /plugins install); copies from plain clones; dangling entries cleaned.
- Native statusline command for Kimi >= 0.30.0 (`[status_line]` in tui.toml) + terminal daemon kept for older CLIs.

### Changed
- Hook shim: confirmation-class denies ([CONFIRM]) are suppressed so Kimi's permission system prompts interactively; hard blocks ([BLOCKED], APEX, SOLID, COMMIT) are forwarded unchanged.
- Scrub maps TeamCreate -> AgentSwarm; solid-generic skill updated accordingly.

### Fixed
- bun-types pre-commit failure (repo now installs @clack/prompts).
- hooks-config.ts split under the 90-line rule (hooks-block.ts extracted).

## [1.0.6] - 2026-07-29

### Added
- Harness configuration step (`configureHarness`): FUSE_HARNESS_REFS wired to every solid-STAR references dir; opt-in interactive tuning knobs (SOLID max lines, enforcement TTL, cache TTLs) persisted to `~/.kimi-code/.env`.
- Global hook activation (`installHooks`): 5 bootstrap `[[hooks]]` in `~/.kimi-code/config.toml` (rules + core guards, TOML-literal commands) between idempotent markers — auto-removed once the managed plugin owns hooks.
- Shared non-TTY stdin buffer for piped prompts (fixes "Premature close" across prompt steps).

## [1.0.5] - 2026-07-29

### Added
- Kimi statusline port (`plugins/core-guards/statusline/`): terminal-title daemon + `~/.kimi-code/statusline.txt` (tmux-ready). Segments from the live session: git, model, thinking effort, context %, edits, age, workDir. 3 unit tests, live-verified.

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
