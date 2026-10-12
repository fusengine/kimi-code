---
name: hig-modality
description: HIG rules for modality, sheets, alerts, action sheets, onboarding, launch screens and permission prompts, mapped to SwiftUI
when-to-use: presenting sheets/alerts/full-screen covers, designing first-run onboarding, launch screen, permission requests
keywords: modality, sheet, alert, confirmationDialog, presentationDetents, onboarding, launch screen, TipKit, purpose string
priority: high
related: hig-accessibility.md, navigation.md, views-modifiers.md
---

# HIG Modality, Alerts & First Run

Sources:
- https://developer.apple.com/design/human-interface-guidelines/modality
- https://developer.apple.com/design/human-interface-guidelines/sheets
- https://developer.apple.com/design/human-interface-guidelines/alerts
- https://developer.apple.com/design/human-interface-guidelines/onboarding
- https://developer.apple.com/design/human-interface-guidelines/launching
- https://developer.apple.com/design/human-interface-guidelines/privacy

## Modality

- Present modally only with a clear benefit; keep the task short and simple.
- No "app within the app": if a modal has subviews, one single path, no buttons that look like the dismiss button.
- Always an obvious dismiss (iOS/iPadOS/watchOS: top toolbar button or swipe down).
- Confirm before dismissing if user content would be lost - offer a save option (action sheet).
- Title the modal with its task. One modal at a time; never two alerts at once.
- Complex/multistep or media: full-screen modal (`fullScreenCover`) rather than a sheet.

## Sheets (iOS/iPadOS)

- One sheet at a time from the main interface; close the first before showing another.
- Single-view sheet: **Cancel leading, Done trailing**. Multistep: Cancel on first step, Back replaces it after; Done trailing, inactive until the task can complete.
- Done is always paired with Cancel (or Back). **Never show Cancel + Done + Back together.**
- Support swipe-to-dismiss; with unsaved changes, confirm through an action sheet.
- Resizable sheets: include a grabber; consider `.medium` for progressive disclosure, skip it for compose-style content.

```swift
.sheet(isPresented: $isEditing) {
    NavigationStack {
        EditForm(draft: $draft)
            .navigationTitle("Edit Profile")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel", role: .cancel) { discard() } }
                ToolbarItem(placement: .confirmationAction) { Button("Done") { save() }.disabled(!draft.isValid) }
            }
    }
    .presentationDetents([.medium, .large])
    .presentationDragIndicator(.visible)
    .interactiveDismissDisabled(draft.hasChanges)   // then confirm via confirmationDialog
}
```

## Alerts

- Sparingly: only essential, actionable information. Not for common undoable actions; never at app launch.
- Title: specific, max two lines, no "Error 329347". Message only if it adds value.
- Up to three buttons; one- or two-word verb titles ("Delete", "Erase"). "OK" only for purely informational alerts; avoid Yes/No.
- Always title the cancel button **"Cancel"**; never make Cancel the default. Default button trailing (row) or top (stack).
- Destructive style only for destructive actions the person didn't deliberately choose.
- Choices related to an intentional action (e.g. discard/save draft) -> action sheet (`confirmationDialog`), not alert.
- Use an alert, not a notification, for errors.

```swift
.alert("Delete Project?", isPresented: $confirmDelete) {
    Button("Delete", role: .destructive) { delete() }
    Button("Cancel", role: .cancel) { }
} message: {
    Text("This removes the project from all your devices.")
}
```

## Launch Screen (iOS/iPadOS/tvOS)

- Nearly identical to the first screen; no text (not localized), no logo/branding, not a splash screen. Match orientation and appearance.
- Restore previous state on relaunch (`SceneStorage`), launch instantly.

## Onboarding

- Ideally none. If needed: fast, fun, **optional**, after launch completes, interactive rather than slides.
- Prefer contextual tips near the relevant UI (TipKit `TipView`, `popoverTip(_:arrowEdge:action:)`).
- Skipped tutorial never re-appears automatically, but stays reachable (help/settings).
- No licensing text, no large downloads, postpone nonessential setup; ask ratings/purchases only after engagement.

## Permission Requests

- Ask when the person first uses the feature that needs it (or in onboarding with the benefit explained).
- Purpose string: brief complete sentence, specific, sentence case, active voice, ends with a period.
  Good: "The app records during the night to detect snoring sounds."
  Bad: "Microphone access is needed for a better experience."
