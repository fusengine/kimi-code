---
name: complications
description: watchOS complications for watch faces with WidgetKit, timelines, and data updates
when-to-use: creating watch face complications, displaying glanceable data, updating complication content
keywords: complication, WidgetKit, AppIntentTimelineProvider, accessory widget, watch face, Smart Stack
priority: high
related: workouts.md, watch-connectivity.md
---

# watchOS Complications

## When to Use

- Displaying data on watch face
- Glanceable information
- Quick app launch
- Real-time data updates

## Key Concepts

### WidgetKit Complications (watchOS 9+)
Complications are WidgetKit accessory widgets; ClockKit complications are legacy - migrate them
(https://developer.apple.com/documentation/widgetkit/converting-a-clockkit-app).

**Key Points:**
- Same API as iOS widgets
- TimelineProvider for updates
- Multiple families supported
- SwiftUI for rendering

### Complication Families

| Family | Where (HIG /widgets) |
|--------|----------------------|
| accessoryCircular | Complications and Smart Stack |
| accessoryRectangular | Complications and Smart Stack |
| accessoryInline | Complications (single tap target) |
| accessoryCorner | Complications (watchOS only) |

On Apple Watch, accessory widgets render in full-color or accented (tinted) mode - mark accent views with `widgetAccentable(_:)`.

### AppIntentTimelineProvider (watchOS 10+, configurable)
Async provider; prefer it over the completion-based `TimelineProvider`.

**Methods:**
- `placeholder(in:)` - Redacted loading state
- `snapshot(for:in:) async` - Quick preview
- `timeline(for:in:) async` - Future entries

### Timeline Entries
Data snapshots at specific times.

**Key Points:**
- Date determines when shown
- System schedules updates
- Budget for background updates

---

## Update Strategies

| Strategy | Use Case |
|----------|----------|
| Timeline | Predictable changes (weather) |
| Push | Server-triggered updates |
| Background refresh | Periodic data fetch |
| App update | When app runs |

---

## Placement

Available slots depend on the watch face; each face exposes only some accessory families. Support several families and test on multiple faces and in the Smart Stack.
Source: https://developer.apple.com/design/human-interface-guidelines/widgets

---

## Best Practices

- ✅ Support multiple families
- ✅ Provide meaningful placeholder
- ✅ Update efficiently (battery)
- ✅ Use timeline for predictions
- ✅ Test on actual watch face
- ❌ Don't update too frequently
- ❌ Don't show stale data
- ❌ Don't require app launch for info
