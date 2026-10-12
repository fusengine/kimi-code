---
name: ornaments
description: visionOS ornaments and attachments for connecting 2D UI to 3D content
when-to-use: adding controls to 3D content, creating contextual UI, attaching SwiftUI to entities
keywords: ornament, attachment, attachmentAnchor, RealityView attachment, UI overlay
priority: medium
requires: spatial-computing.md, realitykit.md
related: views-modifiers.md
---

# visionOS Ornaments & Attachments

## When to Use

- Adding 2D controls to 3D content
- Contextual menus on objects
- Floating UI near volumes
- Labels for 3D entities
- Toolbars in immersive spaces

## Key Concepts

### Ornaments
2D SwiftUI attached to windows/scenes.

**Key Points:**
- `.ornament()` modifier on views
- Position with `attachmentAnchor`
- Standard SwiftUI content
- Glass background by default (visionOS window glass)

### Attachments (RealityView)
2D SwiftUI attached to 3D entities.

**Key Points:**
- Define in RealityView `attachments:`
- Position relative to entities
- Update with SwiftUI state
- Great for labels/controls

### Attachment Anchors

| Anchor | Position |
|--------|----------|
| `.scene(.bottom)` | Below scene |
| `.scene(.top)` | Above scene |
| `.scene(.leading)` | Left of scene |
| `.scene(.trailing)` | Right of scene |

---

## Ornament Usage

`ornament(visibility:attachmentAnchor:contentAlignment:ornament:)` is a **View** modifier (visionOS 1.0+) - apply it to the window's root view, not to the `WindowGroup` scene.

```swift
WindowGroup {
    ContentView()
        .ornament(attachmentAnchor: .scene(.bottom)) {
            HStack {
                Button("Play", systemImage: "play.fill") { }
                Button("Settings", systemImage: "gearshape") { }
            }
            .padding()
            .glassBackgroundEffect()
        }
}
```

HIG (https://developer.apple.com/design/human-interface-guidelines/ornaments):
- Use ornaments for frequently needed, window-related controls; system toolbars and tab bars already appear as ornaments - don't rebuild them.
- Keep ornaments visible (hide only during immersive content like video), few in number, no wider than the window.
- Borderless buttons work well: the ornament background is already glass.

---

## RealityView Attachments

```swift
RealityView { content, attachments in
    // Add attachment to entity
    if let label = attachments.entity(for: "label") {
        entity.addChild(label)
    }
} attachments: {
    Attachment(id: "label") {
        Text("Hello")
            .padding()
            .glassBackgroundEffect()
    }
}
```

---

## Glass Styling

visionOS windows use an unmodifiable system **glass** material that lets surroundings show through and adapts to their luminance (HIG /materials, visionOS):
- `.glassBackgroundEffect()` for custom window/ornament/attachment surfaces
- Prefer translucency to opaque colors in windows
- visionOS has no Dark Mode setting; glass adapts automatically
- `glassEffect(_:in:)` (Liquid Glass) is not available on visionOS - see `swiftui-core/references/liquid-glass.md`

---

## Best Practices

- ✅ Use ornaments for app-specific, window-related controls
- ✅ Use attachments for entity UI
- ✅ Keep ornaments minimal and no wider than the window
- ✅ Rely on the default glass background (borderless buttons)
- ✅ Hit targets >= 60x60 pt (HIG /accessibility, visionOS)
- ❌ Don't overcrowd with UI
- ❌ Don't block 3D content
- ❌ Don't ignore depth perception
