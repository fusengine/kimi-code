---
name: ipados-iphone-duo
description: "iPadOS and iPhone Duo (folding iPhone, HIG page 2026-09-09) mockup rules — size classes, sidebars, pointer effects, poses, reserved regions, arrangement views, vertical controls."
when-to-use: "Mocking up an iPad screen, a resizable window, or any iPhone screen that must also work on iPhone Duo."
keywords: ipados, ipad, iphone-duo, foldable, size-classes, sidebar, split-view, pointer, reserved-region
priority: high
related: ../SKILL.md, viewports.md, macos.md
---

# iPadOS and iPhone Duo

Fetched 2026-10-12. `/slug` = `https://developer.apple.com/design/human-interface-guidelines/<slug>`.

## iPadOS
- Large display, often several apps open at once; inputs combine Multi-Touch, Apple
  Pencil, keyboard, trackpad/mouse. Minimize modal and full-screen transitions; place
  controls within reach but out of the way. — /designing-for-ipados
- Adapt to orientation, multitasking, resized windows, Dark Mode, Dynamic Type; lay out
  by size class, not device. — /designing-for-ipados, /layout
- Use extra width to expose more (tab bar → sidebar, overflow → visible actions) while
  keeping functionality identical. — /layout
- **Consider a tab bar first**; the tab bar's sidebar-style appearance covers areas that
  don't fit. Sidebar ≤ 2 levels, deeper → split view with a content list. — /sidebars
- Pointer content effects: **highlight** (default on bar buttons, tab bars, segmented
  controls, edit menus), **lift**, **hover** — spec which one each custom control uses.
  — /pointing-devices
- Focus is shown by a ring or highlight (keyboard navigation). — /focus-and-selection

## iPhone Duo — /designing-for-iphone-duo
Two displays (outer used closed, inner used open) with a center hinge; you are still
designing for iPhone, so iOS rules apply.

- **Poses**: don't design one layout per pose. Compact width = outer display, regular
  width = inner display; let the existing layout expand. Preview in Xcode Device Hub.
- **Build to resize**: size classes, layout margins, safe area insets; no fixed widths,
  no display-specific dependencies.
- **Consistency**: same functionality and element state on both displays; the inner
  display may show one more hierarchy level (Mail: list or message closed, both open).
- **Reserved regions** (in addition to safe areas): outer camera (always, expands into the
  Dynamic Island), inner camera (only while active), **folding region** (when partially
  open, splits the inner display). Alerts, menus, sheets and split views adapt
  automatically; custom views use the `ReservedRegion` API. In grids prefer an **even
  column count**; favor small adjustments over rearrangement when folding.
- **Arrangement views**: split (side by side or stacked by aspect) or overlay (layered,
  moving to each side when folded). Use them when the layout already looks like one; keep
  navigation containers *outside* them.
- **Vertical controls**: toolbars, tab bars, navigation controls, status bar and Dynamic
  Island move to the **side** — except on the inner display in portrait. They stay on the
  same side in right-to-left languages; in Split View each app puts them on its outer edge.
  - Top of the vertical axis: Back/Close, then prominent actions (Done); keep groupings.
  - Give each toolbar item a visibility priority (overflow goes bottom to top); keep
    frequent and badged items visible longest.
  - Every non-text item gets a title **and** a symbol; minimize text-only buttons.
  - Don't override default bar placement; don't space items manually — group them.
  - Space-limited: navigation-focused → toolbar items overflow, tab bar stays;
    task-focused → minimize the tab bar, keep toolbar actions.
  - Use the system overflow menu; reserve the ellipsis symbol for it.
- Full-width layouts are allowed for bar-less, non-scrolling views (Calculator) if
  nothing collides with the Dynamic Island or status bar.
- Games: playable in every pose; prefer changing aspect ratio over letter/pillarboxing.

## Not published — do not invent
The HIG gives no point dimensions for either iPhone Duo display or the fold region. Take
canvas sizes from Xcode Device Hub (`viewports.md`) and state that source in the spec.
