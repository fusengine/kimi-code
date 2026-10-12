---
name: single-responsibility
applies-to: "**/*.tsx, **/*.jsx"
description: SRP Guide - When and how to split files, size ceiling, modular paths for React
when-to-use: file too long, component doing too much, refactoring, code organization
keywords: single responsibility, SRP, splitting, lines, refactoring, modular
priority: high
related: architecture-patterns.md, templates/service.md, templates/hook.md
---

# Single Responsibility Principle (SRP)

**One file = One reason to change**

---

## When to Apply SRP?

### Symptoms of Violation

1. **File approaches `FUSE_SOLID_MAX_LINES`** → Split by responsibility
2. **Cannot describe file in one sentence** → Too many responsibilities
3. **File has more than 15 imports** → Doing too much
4. **File has more than 5 exports** → Mixed responsibilities

### Size Ceiling

All source-file types (component, hook, service, store, other) use `FUSE_SOLID_MAX_LINES` as the only size ceiling. Split by responsibility when cohesion drops. Exception: Zustand stores keep the owner rule of max 40 lines (`07-state-management.md`).

---

## How to Split? - MODULAR PATHS

When file approaches limit, split using this structure:

```
modules/[feature]/src/
├── interfaces/           # Types ONLY
│   └── xxx.interface.ts
├── services/             # Business logic
│   └── xxx.service.ts
├── hooks/                # State/Effects
│   └── useXxx.ts
├── stores/               # Zustand stores
│   └── xxx.store.ts
├── validators/           # Zod schemas
│   └── xxx.validator.ts
└── constants/            # Constants
    └── xxx.constants.ts
```

### Split Example

Before (1 file mixing five responsibilities):
```
components/UserDashboard.tsx → Types, API calls, State, Validation, UI
```

After (split into modular structure):
```
modules/users/src/interfaces/user.interface.ts    → Types
modules/users/src/services/user.service.ts        → API calls
modules/users/src/hooks/useUser.ts                → State
modules/users/src/validators/user.validator.ts    → Validation
modules/users/components/UserDashboard.tsx        → UI only
```

---

## File Location Rules

| Content Type | Location |
|--------------|----------|
| Types/Interfaces | `modules/[feature]/src/interfaces/` |
| Business logic | `modules/[feature]/src/services/` |
| React hooks | `modules/[feature]/src/hooks/` |
| Zustand stores | `modules/[feature]/src/stores/` |
| Validation | `modules/[feature]/src/validators/` |
| UI Components | `modules/[feature]/components/` |
| Routes | `routes/` (TanStack Router) |

---

## Decision Criteria

### Should This File Be Split?

1. **Can you describe its responsibility in 5 words?**
   - No → Split it

2. **Does it mix types, logic, and UI?**
   - Yes → Split into `interfaces/`, `services/`, `components/`

3. **Is business logic in a component?**
   - Yes → Extract to `services/` or `hooks/`

4. **Are types defined in a service or component?**
   - Yes → Move to `interfaces/`

---

## React Specific Rules

### Components Should ONLY:
- Import from own `src/` or `cores/`
- Use hooks for logic
- Render UI
- Handle events

### Components Should NEVER:
- Define types (→ `interfaces/`)
- Contain business logic (→ `services/`)
- Fetch data directly (→ use TanStack Query hooks)

---

## Where to Find Code Templates?

→ `templates/component.md` - Component template
→ `templates/service.md` - Service template
→ `templates/hook.md` - Hook template
→ `templates/store.md` - Store < 40 lines
→ `templates/interface.md` - Interface definitions

---

## SRP Checklist

- [ ] Source file stays within `FUSE_SOLID_MAX_LINES`
- [ ] Types in `interfaces/` only
- [ ] Services in `services/`
- [ ] Hooks in `hooks/`
- [ ] Stores in `stores/`
- [ ] Validators in `validators/`
- [ ] Components only render UI
