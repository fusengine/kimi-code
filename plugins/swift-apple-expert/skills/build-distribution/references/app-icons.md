---
name: app-icons
description: Layered app icons with Icon Composer (Liquid Glass), appearance variants, SF Symbols, launch screens and asset catalogs for all Apple platforms
when-to-use: creating or updating app icons, using SF Symbols, configuring launch screens, managing assets
keywords: app icon, Icon Composer, layered icon, Liquid Glass, dark icon, clear icon, tinted icon, SF Symbols, launch screen, asset catalog
priority: medium
related: code-signing.md, app-store.md
---

# App Icons & Assets

Source: https://developer.apple.com/design/human-interface-guidelines/app-icons

## Layered Icons (Liquid Glass)

- iOS, iPadOS, macOS and watchOS icons are a **background layer + one or more foreground layers**. The system applies Liquid Glass effects (specular highlights, refraction, translucency), adapting per size and system version.
- A flattened image is still accepted, but layers give the most control.
- tvOS: 2-5 layers (parallax). visionOS: background + 1-2 layers (3D, embossed).

## Icon Composer Workflow (iOS, iPadOS, macOS, watchOS)

1. Draw foreground layers in your design tool - prefer **vector (SVG/PDF)**; PNG for raster or mesh gradients. Outline text.
2. Import layers into **Icon Composer** (included with Xcode).
3. Define the background there (solid color or gradient - no custom background image needed in most cases; if imported: full-bleed, opaque).
4. Adjust layer placement, opacity, effects; group layers to apply effects at group level.
5. Annotate appearance variants, preview across system versions, export for Xcode.

tvOS/visionOS: add layers directly to an image stack in Xcode (Parallax Previewer/Exporter for tvOS).

## Layer Rules

- Provide **square, unmasked layers** (tvOS: rectangular). The system masks corners (iOS/iPadOS/macOS rounded rect; watchOS/visionOS circle). Pre-masked layers break highlights and edges.
- Crisp edges on foreground shapes (no feathering). Vary opacity across foreground layers for depth.
- **Don't bake effects**: no specular highlights, drop shadows, bevels, blurs or glows - the system adds dynamic ones.
- Keep primary content centered (masking, watchOS/visionOS circles). Use the production template grids (Apple Design Resources).
- Simple concept, few shapes, simple background; no photos, no UI replicas, no Apple hardware, no text unless essential to the brand.
- tvOS: keep a safe zone (focus scaling crops edges); avoid black backgrounds.

## Appearances (iOS, iPadOS, macOS)

People pick **default, dark, clear, or tinted** Home Screen icons. Layouts per platform:

| Platform | Layout | Mask | Size | Appearances |
|----------|--------|------|------|-------------|
| iOS, iPadOS, macOS | Square | Rounded rectangle | 1024x1024 px | Default, dark, clear light, clear dark, tinted light, tinted dark |
| tvOS | Rectangle (landscape) | Rounded rectangle | 800x480 px | N/A (parallax) |
| visionOS | Square | Circle | 1024x1024 px | N/A (3D) |
| watchOS | Square | Circle | 1088x1088 px | N/A |

- Keep core features identical across appearances; don't swap elements per variant.
- Base the dark icon on the light one; dark is more subdued, clear/tinted even more. The system generates any variant you don't provide.
- **Alternate icons** (iOS/iPadOS) need their own dark, clear and tinted variants; all are subject to App Review.
- Color spaces: sRGB, Gray Gamma 2.2, Display P3 (not visionOS).

## SF Symbols

Source: https://developer.apple.com/design/human-interface-guidelines/sf-symbols

- Thousands of symbols aligned with San Francisco at every weight and size; availability depends on the OS version targeted.
- Four rendering modes: monochrome, hierarchical, palette, multicolor. Gradients (SF Symbols 7+) and variable color work across modes.
- Animations (incl. Draw On/Off, SF Symbols 7+): use judiciously, honour Reduce Motion.
- Icon-only symbols need an accessibility label; symbols get RTL variants automatically.

## Launch Screen (iOS/iPadOS)

`UILaunchScreen` dictionary in Info.plist (`UIColorName`, `UIImageName`, iOS 14+).
HIG (https://developer.apple.com/design/human-interface-guidelines/launching): nearly identical to the first screen, no text, no logo/branding, matches orientation and appearance.

## Best Practices

- ✅ Layered icon built in Icon Composer, square unmasked layers
- ✅ Check every appearance (default/dark/clear/tinted) in Icon Composer or Device Hub
- ✅ SF Symbols for interface icons, with labels
- ❌ Don't pre-round corners or bake highlights/shadows
- ❌ Don't put text, photos or UI screenshots in the icon
- ❌ Don't put branding on the launch screen
