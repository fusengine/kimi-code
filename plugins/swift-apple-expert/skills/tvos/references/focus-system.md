---
name: focus-system
description: tvOS focus system with @FocusState, focus guides, and focus-aware styling
when-to-use: implementing TV navigation, focus states, focus guides, focusable views
keywords: focus, FocusState, focusable, focus guide, tvOS, navigation
priority: high
related: remote-control.md, media-playback.md
---

# tvOS Focus System

## When to Use

- Navigating with Siri Remote
- Custom focus behaviors
- Focus-aware animations
- Focus guides for layout

## Key Concepts

### @FocusState

Track and control focus programmatically.

```swift
struct ContentView: View {
    @FocusState private var buttonFocused: Bool

    var body: some View {
        Button("Play") { }
            .focused($buttonFocused)
            .onChange(of: buttonFocused) { _, isFocused in
                // React to focus changes
            }
    }
}
```

### Focus-Aware Styling

```swift
Button("Item") { }
    .buttonStyle(.card)  // Automatic focus styling
    .hoverEffect(.lift)  // Lift on focus

// Custom focus style: there is no `.onFocusChange` modifier - observe @FocusState
@FocusState private var isFocused: Bool

PosterView()
    .focusable()
    .focused($isFocused)
    .scaleEffect(isFocused ? 1.1 : 1.0)
    .animation(.easeOut, value: isFocused)

// Inside a focusable view's subtree: @Environment(\.isFocused) private var isFocused
```

### Focus Sections

`focusSection()` is a View modifier (tvOS 15+, macOS 13+) - not a container view. It uses the view's frame to guide focus movement toward its focusable descendants.

```swift
VStack {
    HStack { /* Top row */ }
        .focusSection()
    HStack { /* Bottom row */ }
        .focusSection()
}
```

### focusScope + prefersDefaultFocus

`focusScope(_:)` limits **default focus preferences** to a namespace; it does not trap focus inside the view.

```swift
@Namespace private var shelf

VStack {
    Button("Resume") { }
        .prefersDefaultFocus(in: shelf)
    Button("Start Over") { }
}
.focusScope(shelf)
```

---

## Best Practices

- ✅ Use `@FocusState` for programmatic focus
- ✅ Provide clear focus indicators
- ✅ Use `.focusSection()` to guide focus across uneven rows
- ✅ Animate focus transitions (fade instead when Reduce Motion is on)
- ✅ Let buttons/images adopt Liquid Glass on focus automatically - no manual `glassEffect`
- ❌ Don't make unfocusable interactive elements
- ❌ Don't use targets under 66x66 pt (minimum 56x56 pt, HIG /accessibility)

Source: https://developer.apple.com/design/human-interface-guidelines/focus-and-selection
