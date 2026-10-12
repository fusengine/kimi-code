---
name: hig-iphone-duo
description: Designing for iPhone Duo (foldable, two displays) - HIG layout rules, reserved regions, vertical controls, and the SwiftUI types involved
when-to-use: supporting iPhone Duo, adaptive layouts across folded/unfolded poses, toolbar overflow and visibility priority
keywords: iPhone Duo, foldable, ArrangementView, ReservedRegion, size class, ToolbarItemVisibilityPriority, ToolbarOverflowMenu, vertical toolbar
priority: medium
related: views-modifiers.md, navigation.md, hig-accessibility.md
---

# Designing for iPhone Duo

Source: https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo (added 2026-09-09)
Developer: https://developer.apple.com/documentation/technologyoverviews/preparing-your-app-for-iphone-duo

iPhone Duo has an outer display (closed) and an inner display (open) with a center hinge; poses include partially folded like a book, flat, or standing. It is still an iPhone: iOS patterns apply.

## Layout Rules

- **Use size classes, not devices**: compact width = outer display, regular width = inner display. No custom layout per pose.
- **Build to resize**: size classes, layout margins, safe area insets. **No fixed widths, no display-specific code.**
- Keep functionality and element state identical across displays and poses; the inner display may add one hierarchy level (e.g. list + detail side by side).
- Avoid extreme layout changes while folding: small adjustments over rearrangement. In grids prefer an even column count so content splits at the fold.
- Games: fill the screen in every pose; prefer changing aspect ratio over letter/pillarboxing.
- Preview poses with Device Hub in Xcode.

## Reserved Regions

Areas content must avoid or adapt to: outer front camera (always; grows into the Dynamic Island for Live Activities), inner camera (only while active), and the folding region (when partially open).
- Alerts, menus, sheets and split views adapt automatically.
- Custom components: use `ReservedRegion` (SwiftUI) / `UIView.ReservedRegion` (UIKit) to keep important content clear of them.

## Arrangement Views

`ArrangementView` (iOS 27.1+, `init(primary:secondary:)`) holds a primary and a secondary view and arranges them by size, orientation and reserved regions.
- **Split**: divides the area (horizontal when wider than tall, vertical otherwise).
- **Overlay**: stacks views; separates them on each side of the fold when partially folded.
- Use it where the layout already resembles HStack/VStack (split) or ZStack (overlay).
- **Keep navigation outside** arrangement views: wrap them in `NavigationSplitView` / `TabView`, never the reverse.
- UIKit: `UIArrangementViewController`.

## Vertical Controls

- Toolbars, tab bars and navigation controls move to the **side** (except inner display in portrait). They stay on the same hardware side in RTL.
- Don't override the default bar placement. Account for asymmetric content area via safe areas.
- Order: primary navigation (Back/Close) at top of the vertical axis, then prominent actions (Done); keep original groupings - use `ToolbarItemGroup`, not manual spacers.
- Give every non-text toolbar item **both a title and a symbol** (`Label`); the title is used in overflow. Minimize text-only buttons.
- Items overflow bottom-to-top: set `visibilityPriority(_:)` with `ToolbarItemVisibilityPriority` (`.high`, `.low`, relative inits) to keep frequent actions and badged items visible.
- Use the system overflow menu (`ToolbarOverflowMenu`); reserve the ellipsis symbol for overflow only.
- Space conflict: navigation-focused views keep the tab bar (toolbar items overflow, default); task-focused views minimize the tab bar. Type: `ToolbarVerticalCompressionBehavior` (`.prefersTabBar`, `.prefersToolbarItems`).
- Full-width layouts allowed for non-scrolling immersive UI that avoids the Dynamic Island and status bar.

## Checklist

- [ ] No fixed widths / device checks; compact and regular size classes both tested
- [ ] Same features reachable in every pose (via overflow if needed)
- [ ] Custom content clear of reserved regions (fold, cameras)
- [ ] Every toolbar item has title + symbol; priorities set for key actions
- [ ] Navigation containers wrap arrangement views, not inside them
