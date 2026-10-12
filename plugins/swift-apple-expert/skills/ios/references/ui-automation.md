---
name: ui-automation
description: XcodeBuildMCP UI automation tools - snapshot_ui, tap, batch, swipe, gesture, type_text, screenshot (elementRef-based)
when-to-use: automating user interactions, capturing screenshots, testing UI flows, accessibility checks on simulator
keywords: tap, swipe, screenshot, type_text, snapshot_ui, elementRef, batch, gesture, UI automation
priority: medium
requires: simulator-tools.md
related: debugging.md, ../../mcp-tools/references/xcodebuild-mcp-ui-verification.md
---

# iOS UI Automation

Tool names and parameters read from `xcodebuildmcp@2.7.0` manifests.

## Prerequisites

- `screenshot` and `snapshot_ui` are in the default **simulator** workflow.
- `tap`, `batch`, `long_press`, `swipe`, `gesture`, `type_text`, `button`, `key_press`, `wait_for_ui` need the **ui-automation** workflow (`XCODEBUILDMCP_ENABLED_WORKFLOWS` or `.xcodebuildmcp/config.yaml` `enabledWorkflows`).
- The AXe automation binary ships bundled with the npm package.

## Model: observe, then act by elementRef

1. `snapshot_ui` returns a semantic runtime UI tree; actionable nodes carry an `elementRef` (e.g. `e8`) and list their actions.
2. Act on an `elementRef` - not raw coordinates.
3. Refresh `snapshot_ui` after navigation, scrolling, sheet changes or layout changes; old refs go stale.

## Tools

| Tool | Key parameters | Use |
|------|----------------|-----|
| `snapshot_ui` | `simulatorId`, optional `sinceScreenHash` | Element tree, labels, frames, refs |
| `wait_for_ui` | - | Wait for an element/state before acting |
| `tap` | `elementRef`, optional `preDelay`/`postDelay` | One tap on a ref listing the tap action |
| `batch` | `steps: [{"action":"tap","elementRef":"e1"}, ...]` | Several same-screen taps (e.g. toggles) |
| `long_press` | `elementRef`, `duration` (ms) | Context menus |
| `swipe` | `direction` up/down/left/right, optional `withinElementRef`, `distance`, `duration` | Scrolling, dismissing |
| `gesture` | preset `scroll-up/down/left/right`, `swipe-from-{top,bottom,left,right}-edge` | Standard system gestures |
| `type_text` | `elementRef`, `text`, optional `replaceExisting` | Form input |
| `screenshot` | `returnFormat`: `path` or `base64` | Visual evidence |

## Workflow

```text
1. snapshot_ui                       -> find elementRef + check labels/frames
2. tap / type_text / batch           -> act
3. snapshot_ui (refresh)             -> assert new state
4. screenshot                        -> evidence
```

## Accessibility Use

`snapshot_ui` doubles as an accessibility check: unlabeled interactive nodes and frames under 44x44 pt are HIG violations (https://developer.apple.com/design/human-interface-guidelines/accessibility). Full gate: `mcp-tools/references/xcodebuild-mcp-ui-verification.md`.

## Best Practices

- ✅ Always act on refs from the latest `snapshot_ui`
- ✅ Give controls accessibility labels/identifiers - they make refs stable and VoiceOver usable
- ✅ Screenshot before and after key actions
- ✅ Use `batch` for multiple same-screen taps
- ❌ Don't reuse refs after navigation or scrolling
- ❌ Don't pass text-only rows to `tap`
