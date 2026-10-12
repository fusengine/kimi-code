---
name: xcodebuild-mcp-ui-verification
description: Running the HIG UI verification gate on a simulator with XcodeBuildMCP screenshots, UI snapshots and simctl settings
when-to-use: before reporting any UI change done, checking Dynamic Type AX5, dark mode, Increase Contrast, RTL, hit targets, labels
keywords: screenshot, snapshot_ui, set_sim_appearance, simctl ui, content_size, increase_contrast, RTL, accessibility verification
priority: high
related: xcodebuild-mcp.md, ../../swiftui-core/references/hig-accessibility.md, ../../swiftui-core/references/hig-rtl.md
---

# UI Verification on Simulator

Rules being checked: `swiftui-core/references/hig-accessibility.md`, `hig-rtl.md`, `liquid-glass.md`, `hig-modality.md`.

## Tools (verified in xcodebuildmcp 2.7.0)

| Tool | Workflow | Notes |
|------|----------|-------|
| `screenshot` | simulator (default) | `returnFormat`: `path` or `base64` |
| `snapshot_ui` | simulator (default) | Semantic runtime UI tree with `elementRef` targets, labels, frames |
| `set_sim_appearance` | simulator-management | `mode`: `dark` or `light` |
| `tap`, `batch`, `type_text`, `long_press` | ui-automation | Target an `elementRef` from the latest `snapshot_ui` (not coordinates) |
| `swipe` | ui-automation | `direction` up/down/left/right, optional `withinElementRef` |
| `gesture` | ui-automation | Presets: `scroll-up/down/left/right`, `swipe-from-{top,bottom,left,right}-edge` |
| `launch_app_sim` | simulator (default) | `args` = launch arguments |

Refresh `snapshot_ui` after navigation, scrolling, sheet changes or layout changes - old `elementRef`s go stale.

## Simulator Settings Without a Tool

`xcrun simctl ui <udid> <option>` (Xcode simctl):
- `appearance dark|light`
- `increase_contrast enabled|disabled`
- `content_size accessibility-extra-extra-extra-large` (= AX5) / `large` (default) / `increment` / `decrement`

Reduce Motion and Reduce Transparency have no simctl option: toggle them in the simulator's Settings app (Accessibility), via `ui-automation` taps if enabled, or report **not verified**. In code, confirm `accessibilityReduceMotion` / `accessibilityReduceTransparency` are honoured where custom animation or glass exists.

## Gate Procedure

1. `build_run_sim` + `test_sim` green -> `screenshot` (light, default size).
2. `simctl ui <udid> content_size accessibility-extra-extra-extra-large` -> `screenshot`: no clipped/overlapping text, no truncation in scrollable content, rows stacked. Reset with `content_size large`.
3. `set_sim_appearance dark` (or simctl) + `increase_contrast enabled` -> `screenshot`: text >= 4.5:1 (target 7:1 small text), custom colors adapt.
4. `snapshot_ui`: every interactive element has a label; frames >= 44x44 pt (iOS/iPadOS/watchOS), 60 (visionOS), 66 (tvOS), 28 (macOS). Below the platform minimum (28 iOS) = fail; between minimum and default = warning.
5. RTL: `launch_app_sim` with `args: ["-AppleTextDirection", "YES"]` (add `"-AppleLanguages", "(ar)"` if localized) -> `screenshot`: chevrons/sliders mirrored, logos/checkmarks not.
6. Reduce Motion / Reduce Transparency: see above.
7. Liquid Glass: no `glassEffect` on content-layer views or standard bars (code read + screenshot).
8. Sizes: compact iPhone + iPad regular (and iPhone Duo in Device Hub if available); no fixed widths.
9. `snapshot_ui` order = VoiceOver reading order; sheet buttons Cancel leading / Done trailing.
10. Record evidence (screenshot paths, snapshot findings, settings used) per item.

Report each item as `pass`, `fail`, or `not verified` (with the reason). Never report `pass` without the screenshot or snapshot that shows it.
