---
name: type-scales-other
description: "HIG-published type scales for macOS, tvOS, watchOS and visionOS notes — replaces any guessed intermediate size."
when-to-use: "Mapping typography for a macOS, tvOS, watchOS or visionOS mockup/handoff spec."
keywords: macos, tvos, watchos, visionos, typography, text-styles
priority: high
related: ../SKILL.md, dynamic-type.md, macos.md, watch-tv-vision.md
---

# Type Scales — macOS, tvOS, watchOS, visionOS

Source: https://developer.apple.com/design/human-interface-guidelines/typography
(Specifications + Platform considerations). Fetched 2026-10-12.

## macOS built-in text styles (fixed — macOS doesn't support Dynamic Type)

| Text style | Weight | Size (pt) | Line height (pt) | Emphasized |
|---|---|---|---|---|
| Large Title | Regular | 26 | 32 | Bold |
| Title 1 | Regular | 22 | 26 | Bold |
| Title 2 | Regular | 17 | 22 | Bold |
| Title 3 | Regular | 15 | 20 | Semibold |
| Headline | Bold | 13 | 16 | Heavy |
| Body | Regular | 13 | 16 | Semibold |
| Callout | Regular | 12 | 15 | Semibold |
| Subheadline | Regular | 11 | 14 | Semibold |
| Footnote | Regular | 10 | 13 | Semibold |
| Caption 1 | Regular | 10 | 13 | Medium |
| Caption 2 | Medium | 10 | 13 | Semibold |

To match text inside standard controls, the HIG lists **dynamic system font variants**
(control content, label, menu, menu bar, message, palette, title, tool tips, document
text, monospaced document text, bold system font, system font) — name the variant in the
spec rather than a point size. SF Pro is the system font; NY only via Mac Catalyst.

## tvOS built-in text styles

| Text style | Weight | Size (pt) | Leading (pt) | Emphasized |
|---|---|---|---|---|
| Title 1 | Medium | 76 | 96 | Bold |
| Title 2 | Medium | 57 | 66 | Bold |
| Title 3 | Medium | 48 | 56 | Bold |
| Headline | Medium | 38 | 46 | Bold |
| Subtitle 1 | Regular | 38 | 46 | Medium |
| Callout | Medium | 31 | 38 | Bold |
| Body | Medium | 29 | 36 | Bold |
| Caption 1 | Medium | 25 | 32 | Bold |
| Caption 2 | Medium | 23 | 30 | Bold |

## watchOS Dynamic Type — Large (default 40/41/42 mm) and xLarge (default 44/45/49 mm)

| Style | Large size / leading | xLarge size / leading |
|---|---|---|
| Large Title | 36 / 38.5 | 40 / 42.5 |
| Title 1 | 34 / 36.5 | 38 / 40.5 |
| Title 2 | 28 / 30.5 | 30 / 32.5 |
| Title 3 | 19 / 21.5 | 20 / 22.5 |
| Headline (Semibold) | 16 / 18.5 | 17 / 19.5 |
| Body | 16 / 18.5 | 17 / 19.5 |
| Caption 1 | 15 / 17.5 | 16 / 18.5 |
| Caption 2 | 14 / 16.5 | 15 / 17.5 |
| Footnote 1 | 13 / 15.5 | 14 / 16.5 |
| Footnote 2 | 12 / 14.5 | 13 / 15.5 |

Other watchOS sizes (xSmall, Small = default 38 mm, xxLarge, xxxLarge, AX1–AX5) are on
the HIG page. SF Compact is the watchOS system font; complications use SF Compact Rounded.

## visionOS
No point table is flattened here — read the HIG page if a value is needed. Published
rules: SF Pro system font; bolder Dynamic Type body and title styles; extra **Extra Large
Title 1 / Extra Large Title 2** for wide editorial layouts; prefer 2D text; default text
is white for contrast on glass; text off a background → consider bold, avoid shadows;
billboard labels anchored in space so they keep facing the wearer.

## Rule
Name the platform's text style in the spec. A size not in these tables or on the HIG page
is marked "to reconfirm on developer.apple.com" — never interpolated.
