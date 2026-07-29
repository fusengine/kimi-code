# Framework Integration Rules (MANDATORY)

After generating UI (direct HTML/CSS by default, or via the optional Gemini Design MCP
path — see `skills/design-web/references/gemini/`), ALWAYS delegate to the matching
framework expert for wiring into the codebase.

## Detection → Delegation

| Project Files | Framework | UI Approach | Delegate To | Skills to Validate |
|---------------|-----------|-------------|-------------|-------------------|
| `next.config.*`, `app/layout.tsx` | Next.js | Direct HTML/CSS + shadcn | `nextjs-expert` | solid-nextjs, nextjs-16 |
| `astro.config.*`, `src/pages/*.astro` | Astro | Direct HTML/CSS + shadcn (React islands) | `astro-expert` | solid-astro |
| `@tanstack/react-start` + `tanstackStart()` in vite.config.* | TanStack Start | Direct HTML/CSS + shadcn | `tanstack-start-expert` | solid-tanstack-start, start-core |
| `package.json` + React (no Next) | React SPA | Direct HTML/CSS + shadcn | `react-expert` | solid-react, react-19 |
| `composer.json` + `artisan` + Inertia + React | Laravel+Inertia | Direct HTML/CSS + shadcn | `laravel-expert` | solid-php |
| `composer.json` + `artisan` (no Inertia) | Laravel Blade | Visual specs → Livewire Flux | `laravel-expert` | solid-php |
| `Package.swift`, `*.xcodeproj` | Swift/Apple | `design-ios` mockup + handoff spec → SwiftUI | `swift-expert` | swift-apple |
| Android project (Gradle/Compose) | Android | `design-android` mockup + handoff spec → Compose | (Android developer, no dedicated plugin agent yet) | — |
| `tailwind.config.*` only | Tailwind only | CSS specs | `tailwindcss-expert` | tailwindcss-v4 |

## Integration Workflow

```
1. design-expert generates UI (direct HTML/CSS by default)
   ↓
2. Check project framework (next.config.*, package.json, etc.)
   ↓
3. Launch framework expert Task for:
   - SOLID validation (file size < 100 lines, interfaces location)
   - Framework patterns (App Router, Server Components, hooks)
   - Integration (Better Auth, Prisma, TanStack Form)
   ↓
4. sniper validates final code
```

## Delegation Command

```
Task: nextjs-expert
Prompt: "Validate this generated component for:
1. solid-nextjs compliance (file size, interfaces)
2. Next.js 16 patterns (App Router, Server Components)
3. Integration patterns (imports, data fetching)"
```

## Non-React Stacks: Visual Spec Workflow

For non-React projects, design-expert produces `design-system.md` + visual specs (layout, components, animations, tokens) then delegates implementation to domain expert.

## Laravel Blade → Livewire Flux Components

| shadcn Component | Livewire Flux Equivalent |
|---|---|
| Button | `flux:button` |
| Card | `flux:card` |
| Input | `flux:input` |
| Dialog | `flux:modal` |
| Select | `flux:select` |
| Table | `flux:table` |
| Tabs | `flux:tabs` |
| Dropdown | `flux:dropdown` |

## Swift → SwiftUI Components

| Web Concept | SwiftUI Equivalent |
|---|---|
| Card | `GroupBox` / custom `View` |
| Button | `Button` with `.buttonStyle` |
| Navigation | `NavigationSplitView` |
| Modal | `.sheet` / `.fullScreenCover` |
| Toast | `.alert` / custom overlay |
| Form | `Form` with `Section` |
| List/Table | `List` / `Table` |
| Tabs | `TabView` |

## Web → Astro Islands Mapping

| Component | Implementation | Directive |
|---|---|---|
| Button (static), Card, Badge | `.astro` import | None |
| Button (onClick), Dialog, Select, Toast | React `.tsx` | `client:load` |
| Accordion, Tabs, Form (TanStack) | React `.tsx` | `client:visible` |

> Wrap interdependent components in one `.tsx` — React Context is isolated per island.
> Astro delegation: `astro-expert` — validate solid-astro, directives, View Transitions.

## Responsibility Split

| Phase | design-expert | framework-expert |
|-------|---------------|------------------|
| UI Generation | ✅ Direct HTML/CSS (Gemini optional) | - |
| Anti-AI-Slop | ✅ Rules applied | - |
| Framer Motion | ✅ Animations | - |
| SOLID compliance | - | ✅ File splitting |
| Framework patterns | - | ✅ App Router, hooks |
| Data integration | - | ✅ Prisma, Auth |
| Final validation | - | ✅ sniper |
