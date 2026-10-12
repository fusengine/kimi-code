---
name: solid-principles
description: Overview of all 5 SOLID principles for generic TypeScript/Bun/Node.js
when-to-use: architecture decisions, code review, refactoring
keywords: SOLID, principles, overview, TypeScript, Bun, Node
priority: high
related: single-responsibility.md, open-closed.md, liskov-substitution.md, interface-segregation.md, dependency-inversion.md
applies-to: "**/*.ts, **/*.js"
trigger-on-edit: "src/"
level: principle
---

# SOLID Principles Overview - Generic TypeScript

## Quick Reference

| Principle | Rule | Violation Signal |
|-----------|------|------------------|
| **S** - Single Responsibility | One file = one reason to change | File mixing concerns, 15+ imports |
| **O** - Open/Closed | Extend via composition | Adding feature = modifying existing code |
| **L** - Liskov Substitution | Implementations honor contracts | Override changes behavior/throws unexpected |
| **I** - Interface Segregation | Small focused interfaces | Interface has 10+ methods |
| **D** - Dependency Inversion | Depend on abstractions | Direct `new Class()` or `fetch()` in services |

---

## Decision Matrix

| Situation | Principle | Action |
|-----------|-----------|--------|
| File too long | **S** | Split into modules (see [single-responsibility.md](single-responsibility.md)) |
| Need new variant | **O** | Strategy pattern (see [open-closed.md](open-closed.md)) |
| Swapping implementation | **L** | Verify contract (see [liskov-substitution.md](liskov-substitution.md)) |
| Interface too large | **I** | Split by role (see [interface-segregation.md](interface-segregation.md)) |
| Hard to test/mock | **D** | Inject dependencies (see [dependency-inversion.md](dependency-inversion.md)) |

---

## File Size Limits

Every file (module, service, validator, constants, utility, test) stays within the hook ceiling `FUSE_SOLID_MAX_LINES`. Split well before it: one purpose per file.

---

## Architecture Rules

1. **Interfaces in `modules/[feature]/src/interfaces/`** - Shared in `modules/cores/interfaces/`
2. **Services accept injected deps** - Via factory functions
3. **Entry points are thin** - Wiring only, no business logic
4. **Modules are self-contained** - Clear public API via exports
5. **No circular dependencies** - Use interfaces to break cycles

---

## When to Apply SOLID?

### Always Apply
- New module or service creation
- Refactoring existing code
- Adding features to existing code
- Code review

### Can Skip
- Trivial one-off scripts
- Configuration files
- Type-only files (interfaces)
- Test fixtures/mocks

---

## SOLID Checklist

- [ ] Files within `FUSE_SOLID_MAX_LINES`
- [ ] Interfaces in `modules/[feature]/src/interfaces/` or `modules/cores/interfaces/`
- [ ] Services use dependency injection
- [ ] No concrete dependencies in business logic
- [ ] Each module has a single clear responsibility
- [ ] JSDoc on all exported functions
- [ ] No `any` types
- [ ] No barrel exports
