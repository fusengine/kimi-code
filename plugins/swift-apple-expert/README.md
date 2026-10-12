# Swift Apple Expert Plugin

Swift and SwiftUI development for every Apple platform (iOS, iPadOS, macOS, watchOS, tvOS, visionOS), with build/test automation through XcodeBuildMCP, official API research through Apple Docs MCP, and a HIG verification gate before any UI change is reported done.

Installed as part of the Fusengine Kimi Code plugin suite (`~/.kimi-code/plugins/managed/fusengine/`).

## Agent

### `swift-expert`

Triggers on `Package.swift` / `*.xcodeproj` projects, SwiftUI views, Swift concurrency and XcodeBuildMCP automation. Not for web frontend, PHP or non-Apple platforms.

Verification gate: `build_sim` + `test_sim`, then for UI changes a 10-item HIG gate on the simulator (Dynamic Type AX5, dark mode + Increase Contrast, VoiceOver labels, hit targets, RTL, Reduce Motion/Transparency, Liquid Glass usage, screen sizes, modality/order), each reported `pass` / `fail` / `not verified`, then `sniper`.

## Skills

| Skill | Use when |
|-------|----------|
| `swift-core` | Swift 6 fundamentals: concurrency, architecture, testing, i18n, performance |
| `swiftui-core` | SwiftUI views, navigation, SwiftData, state, Liquid Glass, App Intents, and HIG rules (accessibility, RTL, modality, widgets/Live Activities/notifications/Siri, iPhone Duo) |
| `solid-swift` | SOLID/DRY for Swift: feature-modular layout, protocol separation, @Observable, actors |
| `ios` | iPhone apps: simulator/device testing, UI automation, debugging with XcodeBuildMCP |
| `ipados` | iPad: split views, keyboard, multitasking, Stage Manager |
| `macos` | Mac: menu bar extras, windows, AppKit integration, notarization |
| `watchos` | Apple Watch: complications (WidgetKit), workouts, HealthKit, connectivity |
| `tvos` | Apple TV: focus system, Siri Remote, media playback |
| `visionos` | Vision Pro: spatial computing, RealityKit, ornaments, immersive spaces |
| `build-distribution` | Signing, TestFlight, App Store, Icon Composer app icons, StoreKit 2 |
| `mcp-tools` | XcodeBuildMCP and Apple Docs MCP usage, UI verification on simulator |

## Usage Examples

```
"Create a SwiftUI settings screen with @Observable"   -> swiftui-core, solid-swift
"Fix this Swift 6 data-race error"                    -> swift-core
"Make this list work at the largest text size"        -> swiftui-core (hig-accessibility)
"Add a Live Activity for order tracking"              -> swiftui-core (hig-system-surfaces)
"Support iPhone Duo in our toolbar layout"            -> swiftui-core (hig-iphone-duo)
"Build a menu bar app for macOS"                      -> macos
"Prepare the dark and tinted app icon"                -> build-distribution
```

## MCP Servers

- **XcodeBuildMCP** (https://www.xcodebuildmcp.com): build, run, test, `screenshot`, `snapshot_ui`; optional workflows for appearance and taps.
- **Apple Docs MCP** (https://github.com/kimsungwhee/apple-docs-mcp): documentation, availability, sample code, bundled WWDC 2014-2025.

Version specifics (Swift, OS SDKs) live in each skill's frontmatter `versions:`.

## Author

Bruno Azoulay

## License

MIT
