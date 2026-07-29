# Kimi Statusline (terminal daemon)

Port of the Claude Code statusline to Kimi Code — adapted to Kimi's reality: the CLI has an internal status renderer but no user-configurable statusline surface (`tui.toml` exposes none), so the daemon renders **outside** the TUI: terminal title (OSC escape) + a plain-text file any bar can read (tmux, SketchyBar, …).

## Usage

```bash
bun run plugins/core-guards/statusline/src/daemon.ts start    # detached loop (5s; STATUSLINE_MS to tune)
bun run plugins/core-guards/statusline/src/daemon.ts stop
bun run plugins/core-guards/statusline/src/daemon.ts status   # one-shot print
```

- Terminal/tab title shows: `⎇ main*3 · kimi-code/k3 · max · ctx 37% · edits 12 · 2h05 · Kimi`
- The same line lands in `~/.kimi-code/statusline.txt` — tmux: `set -g status-right '#(cat ~/.kimi-code/statusline.txt)'`

## Segments (data sources, all local)

| Segment | Source |
|---|---|
| `⎇ branch*dirty` | `git` in the session's `workDir` |
| model | `modelAlias` in `wire.jsonl` |
| thinking effort | `thinkingEffort` in `wire.jsonl` |
| `ctx N%` | latest `usage.record` total input / 1 048 576 (K3 window) |
| `edits N` | `Write`/`Edit` tool calls in `wire.jsonl` |
| age | `state.json` `createdAt` |
| directory | `state.json` `workDir` |

The active session is the newest `state.json` under `~/.kimi-code/sessions/`. Everything is read-only; the daemon never touches session data.

## What is NOT ported (and why)

- **Quota segments** (5h/weekly/daily spend): the Claude version reads Anthropic's OAuth usage API. Kimi exposes no documented local quota feed; adding a fake number would be worse than none. If a quota endpoint becomes available, a segment plugs into `wire.ts`/`render.ts`.
- **Cost in $**: same reason.
- **In-TUI line**: no user surface in Kimi 0.29.x — hence the terminal-title approach.
