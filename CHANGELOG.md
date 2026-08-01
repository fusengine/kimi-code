# Changelog

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).

## [1.0.20] - 2026-08-01

### Fixed
- Hook shim: `compactPromptInjection` now covers the `lessons` scope too — the TUI shows only "lessons injected" while the full lessons corpus still reaches the model at SessionStart/SubagentStart — and prepends "AGENTS.md injected" unconditionally on the rules scope, for both output shapes (harness-short notice and shim-trimmed corpus). All 24 bundled plugin copies synced.
- Hook shim: new `normalizeToolInput` aliases Kimi's `tool_input.path` to Claude's `tool_input.file_path` before forwarding to the harness — repairs the lessons Stop write-tracker, which reads `file_path` and was silently dead under Kimi (PostToolUse on a source file now arms the reminder and Stop emits it, proven end-to-end live). All 24 bundled plugin copies synced.
- mcp: magic env var renamed `MAGIC_API_KEY` → `TWENTY_FIRST_API_KEY` in `plugins/ai-pilot/mcp.json.bak` — the 21st MCP shim v0.2.2 reads only `API_KEY` / `TWENTY_FIRST_API_KEY` / `API_KEY_21ST` (verified in its dist code) and the old Magic keys were reset server-side by 21st.dev (ai-pilot 1.2.40).
- statusline: exact agent detection — foreground = `Agent` tool.calls without a matching `tool.result` across all session wires (main + nested agent-*), background = task JSONs with kind=agent and status running, plus a 2h timeout cap so dangling calls from killed/lost agents stop counting (was stuck at ⚙ 1 with zero active agents) (core-guards 1.1.40).

### Documentation
- .env.example: same `MAGIC_API_KEY` → `TWENTY_FIRST_API_KEY` rename, with a note that the old keys were reset and that the shim reads only the three variables above.

## [1.0.19] - 2026-07-31

### Fixed
- readme: install section now uses `/plugins reload` instead of `/reload` (the correct command for plugin changes, per the official docs), and the hook count is corrected from 68 to 63 (actual count after the core-guards dedup, confirmed by `bun run build:manifest`).

## [1.0.18] - 2026-07-31

### Fixed
- statusline: the branch name is now read live from `git branch --show-current` instead of the payload's `gitBranch` field — that field comes from a slowly-refreshed TUI cache and showed a stale branch name after switching branches. The payload value is kept as a fallback outside git repos (core-guards 1.1.39).

## [1.0.17] - 2026-07-31

### Added
- Custom TUI statusline: `plugins/core-guards/statusline/native/statusline-native.mjs` renders one colored line from the CLI's JSON snapshot (time, git +staged/~unstaged/?untracked, truncated path, ± line stats parsed from the session wire, 5h/7D quota windows via the managed usage API with 5-min cache and NaN→0% rollover guard, ⚙ fg|bg agent counts, model+thinking effort from config.toml, permission mode, version, session age; <300ms, exit 0 always).
- install: `installStatusline(ctx)` copies the script to `$KIMI_HOME/bin/statusline-native.mjs` (chmod 755) and surgically upserts `[status_line].command` in `$KIMI_HOME/tui.toml` — preserves all other content, idempotent, dryRun plans only, skips when the source is absent. Registered in the install runner after configureExperimentalFlag (core-guards 1.1.38).
- tests: 8 install-statusline tests (deploy to bin/, content preservation, idempotence, header-with-comment TOML edge case).

### Changed
- gitignore: project-local `.kimi-code/` state is never tracked.

## [1.0.16] - 2026-07-31

### Documentation
- git-flow Step 8: the GitHub Release object is now MANDATORY for all repos — a pushed tag alone is invisible to anything resolving "latest release" (Kimi `/plugins install <github-url>` reads Releases, not tags); Step 8 runs `gh release create vX.Y.Z --latest` with CHANGELOG notes and verifies `releases/latest` (commit-pro 1.2.24). Skill frontmatter restored (`user-invocable: false`, `related-skills`).

## [1.0.15] - 2026-07-31

### Fixed
- Hook shim: the payload `cwd` is forwarded to the harness child process — Kimi runs plugin hooks with the cwd set to the plugin root and the harness CLI passed `process.cwd()` to its gates, so cwd-sensitive gates (the pre-commit tsc sweep) evaluated the deployed suite root instead of the project and blocked every commit with phantom TS2688 errors. All 24 bundled plugin copies synced.
- Hook shim: UserPromptSubmit rules injection compacted to notice lines ("AGENTS.md injected" / "rules 00-08 injected") — the full 18KB corpus flooded the TUI on every prompt; the corpus still reaches the model at SessionStart/SubagentStart. All 24 bundled plugin copies synced.
- core-guards: duplicate SubagentStop/SessionStart hook registrations removed from the root and plugin manifests (core-guards 1.1.37).
- benchmark shell: `timedOut` defaults to `false` when `exitedDueToTimeout` is undefined.

### Added
- install: `plugins/kimi-rules/templates/KIMI.md.template` deployed as `$KIMI_HOME/AGENTS.md`, with fixture and test coverage.
- Rules: "User Confirmations (ZERO TOLERANCE)" section in 00-critical-rules; "teammates" renamed to "sub-agents" (Kimi vocabulary) across 03-agent-teams and both KIMI.md.template copies (kimi-rules 1.39.19).
- ai-pilot commit agent: "Scope Boundary (ZERO TOLERANCE)" section — never code, escalate on gate surprises (ai-pilot 1.2.39).
- MEMORY/LESSON.md: three lessons from the hook injection and design-expert migration work.

### Changed
- design-expert re-synced from the restructured claude-plugins via `scripts/migrate.ts` with the Kimi adaptations (bare agent names, KIMI_PLUGIN_ROOT, Agent/AgentSwarm, handoff section); the elysian reference site moved to the plugin-level `_artistic/` directory (design-expert 2.2.6).
- AGENTS.md slimmed to a thin entry doc; README resynced with the current suite.
- tsconfig excludes design-expert layout-check scripts, seo scripts and benchmark fixtures; layout-check gets its own tsconfig; bun-types devDependency added — repo-wide `tsc --noEmit` green.
- gitignore: `**/.harness/`, `**/.claude/` and generated migration reports are never tracked; cached harness state and `plugins/migration-report.json` untracked (kept on disk).

### Tests
- hooks-e2e corpus aligned with the SessionStart/UserPromptSubmit injection split (63-rule corpus at SessionStart/SubagentStart, notice lines at UserPromptSubmit).

## [1.0.14] - 2026-07-30

### Fixed
- Hook shim: `KIMI_PLUGIN_ROOT` is remapped to the `kimi-rules` sub-plugin for the `rules` scope — the harness reads its corpus from `<KIMI_PLUGIN_ROOT>/rules` but kimi sets the var to the suite root, so per-prompt rules injection came out empty and the kimi-rules block never reached prompts.

## [1.0.13] - 2026-07-29

### Fixed
- `installRuntimeDeps`: `bun update` runs after `bun add` — the lockfile no longer pins the harness to the first staged version (0.1.85 deployed while npm served 0.1.86).

## [1.0.12] - 2026-07-29

### Fixed
- Hook shim: `$KIMI_HOME/.env` is overlaid on top of the inherited environment when spawning the harness — cross-harness shell pollution (fish `conf.d/claude-env.fish` exporting `~/.claude/.env`) no longer wins over the kimi config (gates showed 2min TTL and `.claude` SOLID refs instead of 8min and kimi paths). All 24 bundled plugin copies synced.
- `permission-mode`: `VALUE_RE` gains `/m` so the root-table key matches anywhere in the head segment.

## [1.0.11] - 2026-07-29

### Fixed
- Plugin manifest version: `build:manifest` now runs as part of the release flow — the version shown by `/plugins` (from `.kimi-plugin/plugin.json`) matches the release (was stuck at 1.0.7 since 1.0.8).

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
