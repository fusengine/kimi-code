---
name: viewports
description: "How to size an Apple-platform mockup canvas — size classes, safe areas and layout margins from the HIG Layout page; per-device point sizes are no longer published there, so take them from Xcode Device Hub."
when-to-use: "Choosing the canvas size(s) for a device-framed mockup and deciding which size classes to show."
keywords: ios, ipados, viewport, device, points, size-classes, safe-area, iphone, ipad
priority: critical
related: ../SKILL.md, mockup.md, ipados-iphone-duo.md
---

# Viewports — Size Classes First, Device Sizes Second

Source: https://developer.apple.com/design/human-interface-guidelines/layout
(updated 2026-09-09, fetched 2026-10-12).

## What the HIG says
- **Lay out by size class, not by device type or orientation.** Each axis is compact or
  regular; apps can appear in every combination (full screen, Split View, Slide Over,
  iPhone Mirroring on Mac, resized iPad window).
- Keep functionality identical across size classes; only the amount shown changes
  (e.g. tab bar → sidebar, overflow menu → exposed actions at regular width).
- Respect safe areas (Dynamic Island, status bar, toolbars, tab bars) and system layout
  margins / readable-width guides.
- Test the **largest and smallest** layouts first; preview with Xcode **Device Hub**
  (also for resized iPad windows and iPhone Mirroring).

## Device point sizes — not published by the HIG
The current Layout page carries **no per-device dimension table** (the 2026-09-09 revision
has none; earlier revisions listed iPhone/iPad specs). The previous table in this file came
from a third-party site and was removed.

To get a canvas size: open the target device in Xcode Device Hub / Simulator and record
the logical size in points and the scale factor in the handoff spec, with that source.
Never quote a device size from memory or a third-party site as "the" spec.

## Minimum mockup set
1. iPhone, compact width (portrait).
2. iPad or a regular-width window (or iPhone Duo inner display — `ipados-iphone-duo.md`).
3. The same key screen at AX5 text size (`dynamic-type.md`).

## Rule
Mock up at 1 pt = 1 CSS px on a canvas whose size and source are stated in the spec; no
arbitrary "mobile breakpoint" and no fixed-width layout the developer would have to copy.
