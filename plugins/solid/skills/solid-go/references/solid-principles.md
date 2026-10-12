---
name: solid-principles
applies-to: "**/*.go"
description: Quick reference for all 5 SOLID principles applied to Go 1.27+
when-to-use: overview of SOLID, quick reference, principle selection
keywords: SOLID, overview, Go, principles, quick reference
priority: high
related: single-responsibility.md, open-closed.md, liskov-substitution.md, interface-segregation.md, dependency-inversion.md
---

# SOLID Principles - Go Quick Reference

## Principles Overview

| Principle | Summary | Go Pattern |
|-----------|---------|------------|
| **SRP** | One responsibility per struct | Handler, Service, Repository |
| **OCP** | Open for extension, closed for modification | Interface-based extensibility |
| **LSP** | Implementations honor interface contracts | Implicit interface compliance |
| **ISP** | Small, focused interfaces (Go idiom!) | 1-3 methods per interface |
| **DIP** | Accept interfaces, return structs | Constructor injection |

---

## Architecture Rules (Modules MANDATORY)

```
internal/
├── modules/
│   ├── [feature]/
│   │   ├── handlers/        # HTTP handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access
│   │   ├── ports/           # Interfaces ONLY
│   │   └── models/          # Domain models
│   └── core/                # Shared (cross-feature)
│       ├── services/
│       ├── ports/
│       └── models/
├── pkg/                     # Public shared packages
└── cmd/                     # Entry points
```

**NEVER use flat `internal/` structure - always `internal/modules/[feature]/`**

---

## File Size Limits

Every file stays within the hook ceiling `FUSE_SOLID_MAX_LINES`. One purpose per file: handlers stay thin, ports hold interfaces only; split mixed responsibilities.

---

## Interface Location (CRITICAL)

| Scope | Location |
|-------|----------|
| Feature ports | `internal/modules/[feature]/ports/` |
| Shared ports | `internal/core/ports/` |
| **FORBIDDEN** | Interfaces in implementation files |

**Go idiom**: Define interfaces where they are USED, not where implemented.

---

## Quick Checklist

- [ ] Files within `FUSE_SOLID_MAX_LINES`
- [ ] Interfaces in `ports/` (1-3 methods each)
- [ ] Accept interfaces, return structs
- [ ] Constructor functions for dependency injection
- [ ] Error handling with custom error types
- [ ] Godoc on every exported function
- [ ] DRY: Grep before creating new code
