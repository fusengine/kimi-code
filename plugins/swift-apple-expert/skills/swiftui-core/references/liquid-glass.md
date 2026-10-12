---
name: liquid-glass
description: Liquid Glass material (iOS/iPadOS/macOS/tvOS/watchOS 26+) - HIG usage rules and SwiftUI API mapping
when-to-use: styling custom controls with glass, adopting the system design language, reviewing glass usage against the HIG
keywords: Liquid Glass, glassEffect, GlassEffectContainer, materials, regular, clear, Reduce Transparency
priority: high
related: views-modifiers.md, hig-accessibility.md, navigation.md
---

# Liquid Glass

Visual rules come from the HIG (design-ios handoff is the design source); this file maps them to SwiftUI.
Source: https://developer.apple.com/design/human-interface-guidelines/materials

## Concept (HIG)

- Liquid Glass is a **functional layer for controls and navigation** (tab bars, sidebars, toolbars) floating above the content layer.
- **Regular** variant: blurs and adjusts the luminosity of background content to keep text legible. Most system components use it. Use for text-heavy components (alerts, sidebars, popovers).
- **Clear** variant: highly translucent; only for components floating over visually rich media (photos, video).
- Over bright content under clear glass, consider a dark dimming layer of 35% opacity; not needed over dark content or AVKit standard controls (they dim themselves).
- Appearance changes with system settings: the person's preferred Liquid Glass look, Reduce Transparency, Increase Contrast.

## HIG Rules

- **Never use Liquid Glass in the content layer** (app backgrounds, cards, lists). Use standard materials (`.ultraThinMaterial` ... `.thickMaterial`) there. Exception: transient controls (sliders, toggles) take on glass while active - the system does this.
- **Let standard components adopt it automatically.** Tab bars, toolbars, sidebars, sheets, popovers, menus, alerts and search get glass from the system - do not add `glassEffect` to them.
- **Use custom glass sparingly** - only the most important custom functional controls.
- **tvOS**: buttons and image views adopt glass when they gain focus - never add it manually.
- **visionOS**: windows use the system glass material (`glassBackgroundEffect`), not `glassEffect`.
- Color on glass: tint only to convey meaning (e.g. primary action), not decoration. Source: https://developer.apple.com/design/human-interface-guidelines/color

## API Reference (verified on developer.apple.com, iOS 26.0+)

```swift
MyControl()
    .glassEffect()                              // Glass.regular in a capsule (default)
    .glassEffect(.regular.interactive())        // reacts to touch/pointer
    .glassEffect(.clear, in: .rect(cornerRadius: 16)) // over media only
    .glassEffect(.regular.tint(.accentColor))   // meaning-bearing tint only

Glass.identity   // no glass - toggle conditionally instead of removing the modifier
```

```swift
// Group custom glass shapes so they blend and morph together
GlassEffectContainer {
    HStack {
        ForEach(tools) { tool in
            ToolButton(tool).glassEffect(.regular.interactive())
        }
    }
}
```

```swift
Button("Save") { }.buttonStyle(.glass)            // secondary
Button("Continue") { }.buttonStyle(.glassProminent) // primary action only
// UIKit: UIButton(configuration: .glass())
```

## Accessibility Fallbacks

```swift
@Environment(\.accessibilityReduceTransparency) private var reduceTransparency

var body: some View {
    ToolCluster()
        .glassEffect(reduceTransparency ? .identity : .regular)
        .background(reduceTransparency ? Color(.secondarySystemBackground) : .clear)
}
```

System components already handle Reduce Transparency and Increase Contrast; only custom glass needs this.

## Related System APIs

| API | Use |
|-----|-----|
| `tabBarMinimizeBehavior(_:)` | Let the tab bar minimize on scroll (iOS 26+) |
| `tabViewBottomAccessory(content:)` | Accessory above the tab bar (iOS 26+) |
| `scrollEdgeEffectStyle(_:for:)` | Scroll edge effect under bars (iOS 26+) |
| `backgroundExtensionEffect()` | Extend content under sidebars/inspectors (iOS 26+) |
| `glassBackgroundEffect(displayMode:)` | visionOS window/ornament glass |

## Checklist

- [ ] No `glassEffect` on content-layer views, standard bars, sidebars, sheets
- [ ] Clear variant only over media; 35% dim over bright media
- [ ] No stacked glass on glass
- [ ] Legible in light, dark, Increase Contrast, Reduce Transparency
- [ ] `.glassProminent` / tint reserved for the primary action
