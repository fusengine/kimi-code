---
name: hig-system-surfaces
description: HIG rules for widgets, Live Activities, notifications, App Shortcuts, Siri and snippets, with the verified framework types to use
when-to-use: building a WidgetKit widget, Live Activity, notification, App Shortcut, Siri integration or App Intent snippet
keywords: widget, WidgetKit, Live Activity, ActivityKit, Dynamic Island, notification, interruption level, App Shortcuts, Siri, snippet, App Intents
priority: high
related: app-intents.md, hig-accessibility.md
---

# HIG System Surfaces

Code for intents lives in `app-intents.md`; this file holds the design rules.

## Widgets

Source: https://developer.apple.com/design/human-interface-guidelines/widgets

- One simple idea tied to the app's main purpose; timely, glanceable, dynamic content. Never a replica of the app icon.
- Offer multiple sizes only when each adds value; don't stretch small content to fill a large size.
- Brand lightly: no logo needed; if multi-source, a small logo top-right at most. Don't mirror the widget inside the app.
- Updates are budgeted, not real-time: show "last updated" when relevant; let the system render dates/times; animate changes (max 2 s).
- Tap opens the app **at the related location** (`widgetURL(_:)`); interactive buttons/toggles only for simple, relevant actions; inline accessory widgets have one tap target.
- Standard margins (16 pt for most widgets); use `ContainerRelativeShape` for concentric corners.
- Rendering modes: full color, **accented** (tinted / clear Liquid Glass Home Screen), **vibrant** (Lock Screen, StandBy low light). Mark accent views with `widgetAccentable(_:)`; read `widgetRenderingMode`; set backgrounds with `containerBackground(_:for:)`.
- watchOS complications are accessory widget families (`accessoryCircular`, `accessoryRectangular`, `accessoryInline`, `accessoryCorner`).

## Live Activities

Source: https://developer.apple.com/design/human-interface-guidelines/live-activities

- Only for tasks/events with a defined start and end, ideally under eight hours. No ads, no sensitive data (redact or summarize - `privacySensitive(_:)`).
- Must support compact, minimal, expanded (Dynamic Island) and Lock Screen presentations; also appear in StandBy, Mac menu bar, Apple Watch Smart Stack, CarPlay.
- Large, medium-or-heavier text; concentric margins; dynamic height; custom background only on Lock Screen (check contrast on Always-On, `isLuminanceReduced`).
- Logo mark without container, never the full app icon. Don't add app UI that points at the Dynamic Island.
- Animations max 2 s (none on reduced-luminance Always-On). Update only on new content; alert only for essential updates; never duplicate with push notifications.
- Max one interactive element ideally; tap deep-links to the related screen. Let people stop it from inside the app; offer an App Shortcut to start it.
- Types: `ActivityConfiguration`, `DynamicIsland`, `Activity.request(attributes:content:pushType:)`, `ActivityContent`.

## Notifications

Sources: https://developer.apple.com/design/human-interface-guidelines/notifications, https://developer.apple.com/design/human-interface-guidelines/managing-notifications

- Permission first (`requestAuthorization(options:completionHandler:)`), ideally when the benefit is clear.
- Pick an honest `interruptionLevel`: `.passive`, `.active` (default), `.timeSensitive` (happening now / within an hour), `.critical` (health & safety, entitlement required).
- **Never** Time Sensitive for marketing; marketing notifications need explicit opt-in plus an in-app setting to change it.
- Concise; no duplicates; no "go do X in the app"; no sensitive data; no app name/icon in content (system adds it).
- Title-style title without ending punctuation; body in sentence case with punctuation. Provide `hiddenPreviewsBodyPlaceholder` ("New comment").
- Up to four actions: short title-case verbs, SF Symbol icon, prefer nondestructive, no "Open app" action.
- In foreground, surface the info subtly (badge, inline insert) instead of an alert. Badges only for unread counts.
- Errors -> alert, not notification.

## App Shortcuts & Siri

Sources: https://developer.apple.com/design/human-interface-guidelines/app-shortcuts, https://developer.apple.com/design/human-interface-guidelines/siri

- Up to 10 App Shortcuts (`AppShortcutsProvider`) for the most common tasks; available right after install. Not supported on tvOS; on macOS only via the Shortcuts app.
- Prefer **app schemas** when the app fits a common domain (mail, photos, music...) so Siri AI understands it without custom shortcuts.
- Phrases: short, memorable, include the app name; one optional parameter max with predictable values; ask follow-ups for missing info.
- Full spoken dialogue must stand alone (audio-only devices); responses succinct, no humor or ads, inclusive wording ("Who should I send it to?").
- Annotate on-screen content with app entities and donate relevant actions so Siri understands context.
- Write "App Shortcuts" / "Shortcuts" in title case, plural.

## Snippets

Source: https://developer.apple.com/design/human-interface-guidelines/snippets

- Two types: **confirmation** (Cancel + primary button) and **result** (Done). iOS/iPadOS/macOS only.
- Custom view max **400 pt** tall, text sized for large Dynamic Type; deep-link for more detail.
- Primary button label descriptive ("Order"), never OK/Proceed (system default is "Continue").
- Convey meaning visually; don't rely on repeating the spoken dialogue. Check contrast in light and dark.
