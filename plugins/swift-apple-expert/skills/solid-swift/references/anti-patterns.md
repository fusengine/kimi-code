---
name: anti-patterns
applies-to: "**/*.swift"
description: Common SOLID violations in Swift with quick fixes
when-to-use: reviewing code quality, identifying anti-patterns, refactoring
keywords: anti-patterns, violations, refactoring, SOLID, Swift
priority: high
related: single-responsibility.md, open-closed.md, dependency-inversion.md
---

# Anti-Patterns - Quick Reference

## SRP Violations

| Anti-Pattern | Detection | Fix |
|--------------|-----------|-----|
| View does API calls | `URLSession` in View | Extract to Service + ViewModel |
| View body mixes several sections | Long `body` (~30+ lines) | Extract subviews |
| ViewModel with several roles | Validates + fetches + formats | Split into smaller ViewModels |
| Model has business logic | Methods in model | Extract to Service |
| File blocked by hook ceiling | `FUSE_SOLID_MAX_LINES` deny | Split by responsibility (never bypass) |

---

## OCP Violations

| Anti-Pattern | Detection | Fix |
|--------------|-----------|-----|
| `if/switch` for provider type | Inline conditionals | Protocol-based extensibility |
| Adding feature modifies existing | Change in 5+ files | Define protocol, add new impl |
| Hard-coded auth logic | `ASAuthorization` in View | `AuthProviderProtocol` |

---

## LSP Violations

| Anti-Pattern | Detection | Fix |
|--------------|-----------|-----|
| Implementation throws wrong error | Generic `Error` | Throw documented error types |
| Mock behaves differently | Test passes, prod fails | Contract tests for all impls |
| Swapping provider breaks app | Runtime crash | Ensure identical contracts |

---

## ISP Violations

| Anti-Pattern | Detection | Fix |
|--------------|-----------|-----|
| Protocol with 6+ methods | Method count | Split by role |
| No-op method implementations | Empty `func` body | Remove protocol conformance |
| Consumer uses 1 of 5 methods | Unused imports | Depend on focused protocol |

---

## DIP Violations

| Anti-Pattern | Detection | Fix |
|--------------|-----------|-----|
| `let service = UserService()` | Direct instantiation | Inject protocol |
| `URLSession.shared` in ViewModel | Direct dependency | Wrap in service protocol |
| Protocol in impl file | Same file location | Move to `Protocols/` directory |
| Singleton pattern | `static shared` | Constructor injection |

---

## Architecture Violations

| Anti-Pattern | Detection | Fix |
|--------------|-----------|-----|
| Protocols mixed with impl | Same file | Separate to `Protocols/` dir |
| Flat `Sources/` structure | No `Features/` dir | Migrate to `Features/[Feature]/` |
| Shared code in feature | Import from another feature | Move to `Core/` |
| Feature-to-feature import | Cross-feature dependency | Extract to `Core/` |

---

## Concurrency Violations

| Anti-Pattern | Detection | Fix |
|--------------|-----------|-----|
| Missing `@MainActor` on VM | No annotation | Add `@MainActor` |
| Non-Sendable in async | Compiler warning | Use `struct` with `let` |
| `DispatchQueue.main.async` | Legacy pattern | Use `@MainActor` |
| Completion handlers | Callback closures | Use `async/await` |
| `ObservableObject` | Legacy pattern | Use `@Observable` |

---

## File Size Violations

The only line limit is the hook ceiling (`FUSE_SOLID_MAX_LINES`). Split on responsibility, not on an invented count:

| Type | Split signal | Fix |
|------|--------------|-----|
| View | Body ~30+ lines | Extract subviews |
| ViewModel | Several roles | Split by responsibility |
| Service | Several domains | Split by domain |
| Model | Nested types pile up | Separate nested types |
| Any file | Near/over hook ceiling | Split by responsibility; report if a fix cannot fit |

---

## Detection Commands

```bash
# Find files over limit
find Sources/ -name "*.swift" | xargs wc -l | sort -rn | head -20

# Find protocols in wrong location
grep -rn "^protocol " Sources/Features/*/Services/
grep -rn "^protocol " Sources/Features/*/ViewModels/
grep -rn "^protocol " Sources/Features/*/Views/

# Find direct instantiation in ViewModels
grep -rn "= \w*Service()" Sources/Features/*/ViewModels/

# Find ObservableObject usage
grep -rn "ObservableObject" Sources/
```
