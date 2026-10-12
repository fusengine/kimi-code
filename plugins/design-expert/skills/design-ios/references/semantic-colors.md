---
name: semantic-colors
description: "Canonical Apple semantic color roles, contrast targets (4.5:1 minimum, 7:1 target, 3:1 large/bold), increased-contrast variants and Dark Mode base/elevated backgrounds — from the HIG Color, Dark Mode and Accessibility pages."
when-to-use: "Mapping design-system.md OKLCH tokens to Apple semantic color roles, or checking contrast in light, dark and Increase Contrast."
keywords: ios, macos, colors, semantic, hig, dark-mode, contrast, increase-contrast
priority: critical
related: ../SKILL.md, dynamic-type.md, liquid-glass.md
---

# Semantic Colors and Contrast

Sources (fetched 2026-10-12):
- https://developer.apple.com/design/human-interface-guidelines/color
- https://developer.apple.com/design/human-interface-guidelines/dark-mode
- https://developer.apple.com/design/human-interface-guidelines/accessibility

## iOS / iPadOS roles
- Backgrounds: `systemBackground`, `secondarySystemBackground`,
  `tertiarySystemBackground`; grouped: `systemGroupedBackground`,
  `secondarySystemGroupedBackground`, `tertiarySystemGroupedBackground`.
- Labels: `label`, `secondaryLabel`, `tertiaryLabel`, `quaternaryLabel`.
- Also: `placeholderText`, `separator`, `opaqueSeparator`, `link`.

## macOS roles (named on the HIG Color page)
`labelColor` (+ secondary/tertiary/quaternary), `windowBackgroundColor`,
`controlBackgroundColor`, `textBackgroundColor`, `underPageBackgroundColor`,
`separatorColor`, `placeholderTextColor`, `linkColor`, `selectedContentBackgroundColor`,
`unemphasizedSelectedContentBackgroundColor`, `alternatingContentBackgroundColors`.

## Contrast targets
| Text | Minimum ratio |
|---|---|
| Up to 17 pt, any weight | 4.5:1 |
| 18 pt and up, any weight | 3:1 |
| Bold, any size | 3:1 |

- **Target 7:1** for custom foreground/background pairs, especially small text (Dark Mode
  page). 4.5:1 is the floor, not the goal.
- Check light **and** dark **and** Increase Contrast. If the default scheme misses the
  minimum, the app must at least provide a higher-contrast scheme under Increase Contrast.

## Custom colors
Supply a light and a dark variant, **plus an increased-contrast option for each** with
significantly more differentiation (Color page). System colors already ship accessible
variants. Never hard-code a value that doesn't adapt.

## Dark Mode depth: base vs elevated
Dark Mode uses two background sets: **base** (dimmer, recedes) and **elevated** (brighter,
for foreground interfaces like popovers and sheets, and multitasking separation). Prefer
system backgrounds so the switch happens automatically; a custom background hides it.
Dark palettes are not plain inversions. Slightly darken white-background images.

## Rule
Every color in the mockup and handoff spec references one of these roles (or a project
token mapped onto one) — never a raw RGB/hex. Report measured ratios per mode in the spec.
