---
name: solid-principles
applies-to: "**/*.rs"
description: Quick reference for all 5 SOLID principles applied to Rust 2024+
when-to-use: overview of SOLID, quick reference, principle selection
keywords: SOLID, overview, Rust, principles, quick reference
priority: high
related: single-responsibility.md, open-closed.md, liskov-substitution.md, interface-segregation.md, dependency-inversion.md
---

# SOLID Principles - Rust Quick Reference

## Principles Overview

| Principle | Summary | Rust Pattern |
|-----------|---------|--------------|
| **SRP** | One responsibility per struct/module | Handler, Service, Repository |
| **OCP** | Open for extension, closed for modification | Trait-based extensibility |
| **LSP** | Implementations honor trait contracts | Trait contract consistency |
| **ISP** | Small, focused traits | Role-based trait splitting |
| **DIP** | Depend on traits, not concrete types | Generic bounds + DI |

---

## Architecture Rules (Modules MANDATORY)

```
src/
├── modules/
│   ├── [feature]/
│   │   ├── mod.rs           # Module declaration
│   │   ├── handlers.rs      # HTTP handlers
│   │   ├── services.rs      # Business logic
│   │   ├── repository.rs    # Data access
│   │   ├── traits.rs        # Trait definitions ONLY
│   │   └── models.rs        # Domain models
│   └── core/                # Shared (cross-feature)
│       ├── services.rs
│       ├── traits.rs
│       └── models.rs
├── lib.rs
└── main.rs
```

**NEVER use flat `src/` structure - always `src/modules/[feature]/`**

---

## File Size Limits

Every file stays within the hook ceiling `FUSE_SOLID_MAX_LINES`. One purpose per file: handlers stay thin, `traits.rs` holds trait definitions only; split mixed responsibilities.

---

## Trait Location (CRITICAL)

| Scope | Location |
|-------|----------|
| Feature traits | `src/modules/[feature]/traits.rs` |
| Shared traits | `src/core/traits.rs` |
| **FORBIDDEN** | Traits in implementation files |

---

## Quick Checklist

- [ ] Files within `FUSE_SOLID_MAX_LINES`
- [ ] Traits in `traits.rs` or `src/core/traits/`
- [ ] Services use generic trait bounds (not concrete types)
- [ ] Error handling with `thiserror`
- [ ] `///` rustdoc on every public item
- [ ] `Result<T, E>` (never unwrap in library code)
- [ ] DRY: Grep before creating new code
