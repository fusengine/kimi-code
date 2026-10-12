---
name: hig-rtl
description: HIG right-to-left rules (Arabic, Hebrew) - what flips, what never flips, numerals, and how to test in SwiftUI
when-to-use: localizing for Arabic/Hebrew, reviewing layout mirroring, custom directional icons or controls
keywords: RTL, right-to-left, Arabic, Hebrew, layoutDirection, flipsForRightToLeftLayoutDirection, mirroring
priority: medium
related: hig-accessibility.md, views-modifiers.md
---

# HIG Right-to-Left

Source: https://developer.apple.com/design/human-interface-guidelines/right-to-left

System frameworks flip standard components automatically. Fine-tune only what the system cannot know.

## Text

- Align text to match the interface direction when the system doesn't (SwiftUI `.leading`/`.trailing` mirror automatically; avoid absolute x offsets or UIKit `NSTextAlignment.left`).
- **Paragraphs (3+ lines) align to their own language**, not the UI direction; 1-2 line blocks follow the UI direction.
- All items of a list use the same alignment, even items in another script.
- Next to all-caps Latin text, Arabic/Hebrew often needs **~+2 pt** to look balanced.

## Numerals

- Never reverse the digits inside a number (phone, card, "541").
- Reverse the **order** of numerals that express progress or sequence (slider scales, ratings).
- Arabic may use Western or Eastern Arabic numerals depending on region; let the system format numbers unless your app is number-centric.

## Controls

| Flip | Never flip |
|------|-----------|
| Back/forward, next/previous navigation | Controls meaning a real direction ("to the right") |
| Progress bars, sliders + their end glyphs | Logos (even with text) |
| Ordered image sequences (chronological, ranked) | Universal marks (checkmark), clocks |
| Icons depicting text or reading direction | Photos, illustrations, general artwork |
| Icons showing forward/backward motion (speaker waves) | Right-handed tools (keep tool orientation) |

- SF Symbols provide RTL variants and localized glyphs automatically; for custom symbols specify directionality.
- Custom icons with a badge or slash: decide per component; don't blindly mirror the whole image.

## SwiftUI

```swift
@Environment(\.layoutDirection) private var direction   // .leftToRight / .rightToLeft

Image("custom-forward-arrow")
    .flipsForRightToLeftLayoutDirection(true)   // only directional custom images

#Preview("RTL") {
    ContentView()
        .environment(\.layoutDirection, .rightToLeft)
        .environment(\.locale, Locale(identifier: "ar"))
}
```

## Runtime Test

- Scheme > Options > App Language > **Right-to-Left Pseudolanguage** (no Arabic localization needed). Source: WWDC22 "Get it right (to left)".
- Or launch arguments on iOS: `-AppleTextDirection YES` (plus `-AppleLanguages (ar)` for a real localization). With XcodeBuildMCP pass them via `launch_app_sim` `args`.

## Pass Criteria

- [ ] Back chevron points right; navigation order mirrored
- [ ] Sliders/progress fill from the right; end glyphs swapped
- [ ] Logos, checkmarks, photos unchanged
- [ ] No hard-coded left/right offsets or alignment in custom views (UIKit `.left`, absolute x)
- [ ] Multi-line paragraphs aligned to their language
