---
name: touch-targets
description: "Control sizes for every Apple platform and spacing between targets — from the HIG Accessibility control-size table (iOS 44/28, macOS 28/20, tvOS 66/56, visionOS 60/28, watchOS 44/28)."
when-to-use: "Sizing any tappable/clickable/focusable control in an Apple-platform mockup."
keywords: ios, ipados, macos, tvos, visionos, watchos, touch-target, control-size, accessibility, hig
priority: high
related: ../SKILL.md, watch-tv-vision.md
---

# Control Sizes and Spacing

Source: https://developer.apple.com/design/human-interface-guidelines/accessibility
(control-size table, fetched 2026-10-12).

| Platform | Default control size | Minimum control size |
|---|---|---|
| iOS, iPadOS | 44×44 pt | 28×28 pt |
| macOS | 28×28 pt | 20×20 pt |
| tvOS | 66×66 pt | 56×56 pt |
| visionOS | 60×60 pt | 28×28 pt |
| watchOS | 44×44 pt | 28×28 pt |

Design to the default; the minimum is a floor, not a target.

## Spacing between targets (same page)
- About **12 pt** of padding around elements that have a bezel.
- About **24 pt** around the visible edges of elements without a bezel.
- visionOS: place button centers at least **60 pt** apart so the hover effect doesn't
  obscure neighbors (HIG Layout > visionOS).

## Rule
Every interactive control in the mockup — buttons, list rows, icon-only controls — meets
the platform default, even when the visible glyph is smaller (pad the hit area). Flag any
control under the default in the handoff spec.
