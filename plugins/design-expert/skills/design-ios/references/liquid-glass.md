---
name: liquid-glass
description: "Canonical Liquid Glass rules (current Apple design language, iOS/iPadOS/macOS 27 kits) — functional layer only, regular vs clear, 35% dimming, color on primary-action backgrounds, per-platform behavior. No numeric corner radius is published."
when-to-use: "Deciding whether and how to apply Liquid Glass to navigation, controls, or icons in an Apple-platform mockup."
keywords: ios, macos, tvos, visionos, liquid-glass, material, navigation, controls
priority: high
related: ../SKILL.md, semantic-colors.md
---

# Liquid Glass

Sources (fetched 2026-10-12):
- https://developer.apple.com/design/human-interface-guidelines/materials (Liquid Glass
  section, last changed 2025-09-09)
- https://developer.apple.com/design/human-interface-guidelines/color (Liquid Glass color,
  updated 2025-12-16)
- https://developer.apple.com/design/whats-new/ — iOS and iPadOS 27 and macOS 27 design
  kits "include Liquid Glass": still the current language.

## Layering
- Liquid Glass is the **functional layer** for controls and navigation (tab bars, toolbars,
  sidebars) floating above content. **Never use it in the content layer** — use standard
  materials there (iOS: ultra-thin, thin, regular, thick). Exception: transient controls
  in content (sliders, toggles) take a glass look while being activated.
- **Sparingly**: system components adopt it automatically; on custom controls, limit it to
  the most important functional elements.

## Variants
- **Regular** (most system components): blurs and adjusts luminosity of what's behind.
  Use when legibility is at risk or the component holds a lot of text (alerts, sidebars,
  popovers). Scroll edge effects add blur/opacity reduction at edges.
- **Clear**: highly translucent — only over visually rich backgrounds (photos, video).
  Over bright content add a **dark dimming layer at 35% opacity**; none needed over dark
  content or AVKit's own playback controls.
- Appearance changes with the user's preferred glass look, Reduce Transparency and
  Increase Contrast — show the mockup's glass surfaces still legible in those modes.

## Color on glass
- Glass has no inherent color; it picks up the content behind it. Small bars adapt light
  ↔ dark with monochrome symbols; larger elements (sidebars) are more opaque.
- Color **sparingly**; to emphasize a primary action, tint the **background** (as
  prominent buttons do with the accent color), not the symbol/text. Never tint several
  controls' backgrounds.
- Colorful content behind bars → prefer monochrome bars or a well-differentiated accent;
  keep the resting state (top of scroll) legible.

## Per platform (Materials page)
- **tvOS**: glass on navigation and system surfaces; image views and buttons adopt it on
  focus — don't add it manually.
- **visionOS**: windows use the system **glass** material (unmodifiable, no separate Dark
  Mode); prefer translucency to opaque fills; vibrancy `label` / `secondaryLabel` /
  `tertiaryLabel` for text hierarchy.
- **watchOS**: keep the default material backgrounds of full-screen modal sheets.

## Not published — do not invent
No numeric corner radius exists for Liquid Glass shapes. The rule is concentricity:
standard buttons, fields, headers and footers in a bar have radii concentric with the bar
corners (https://developer.apple.com/design/human-interface-guidelines/toolbars). A radius
in the spec is a project choice, labeled as such.
