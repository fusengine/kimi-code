---
name: macos
description: "macOS mockup rules from the HIG — system window frame, fixed text styles (no Dynamic Type), desktop tinting under the graphite accent, pointer styles, window layout and sidebar rules."
when-to-use: "Designing a macOS window, sidebar or toolbar mockup and its handoff spec."
keywords: macos, window, desktop-tinting, graphite, pointer, sidebar, typography
priority: high
related: ../SKILL.md, type-scales-other.md, semantic-colors.md, liquid-glass.md
---

# macOS

All rules fetched 2026-10-12. A `/slug` on a line means
`https://developer.apple.com/design/human-interface-guidelines/<slug>`.

## Window frame — system-drawn
- Avoid custom window frames or controls and never imitate the system appearance; the
  mockup frames content inside a standard window (frame with window controls and toolbar
  above a body area). — /windows
- Windows are user-resizable: the mockup canvas is a convenience, not a spec size; say so
  in the handoff.
- Don't put controls or critical information at the bottom of a window (people drag
  windows below the screen edge); keep content clear of the camera housing at the top
  edge. — /layout (macOS)

## Typography — no Dynamic Type
macOS doesn't support Dynamic Type. Use the fixed built-in text styles (Body 13 pt …
Large Title 26 pt, full table in `type-scales-other.md`) and, inside standard controls,
the dynamic system font variants (control content, menu, tool tips, …). — /typography

## Desktop tinting — only under the graphite accent
When people choose the **graphite** accent color, macOS tints window backgrounds with the
desktop picture. Add transparency only to custom components that have a visible background
or bezel, and only in a neutral (non-colored) state — colored states stay opaque so their
color doesn't drift. Show it in the mockup as a variant, not as the default. — /dark-mode

## Color and materials
- Use macOS dynamic system colors (`semantic-colors.md`) and vibrant colors on materials;
  choose materials by purpose, not by the color they appear to give. — /materials
- Sidebar icons use the accent color by default and must follow the accent the user picks;
  fixed colors only sparingly to carry meaning (e.g. Mail's yellow VIP). — /sidebars

## Pointer, not touch
- macOS communicates interactivity through **standard pointer styles** and shows a
  **tooltip** after hovering a button; secondary click reveals context menus.
  — /pointing-devices, /buttons
- The highlight / lift / hover *content effects* are **iPadOS** pointer effects, not
  macOS — don't spec them for a Mac window. A custom hover visual is a project choice,
  labeled as such.
- Default control size 28×28 pt, minimum 20×20 pt (`touch-targets.md`).

## Sidebars (also iPadOS) — /sidebars
- Show **no more than two levels** of hierarchy. Deeper data → a **split view with a
  content list between the sidebar and the detail view**, not a third disclosure level.
- With two levels, title each group with a short descriptive label.
- Let people hide the sidebar (View menu Show/Hide Sidebar or a button); don't hide it by
  default. Sidebars float in the Liquid Glass layer; content can extend beneath them.
