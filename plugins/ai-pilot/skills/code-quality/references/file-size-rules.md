---
name: file-size-rules
description: File size limits, LoC calculation, and split strategies for code quality
when-to-use: Checking file sizes, splitting large files
keywords: file size, LoC, lines of code, split, refactor
priority: high
related: solid-validation.md, architecture-patterns.md
---

# File Size Rules

## Limits

`FUSE_SOLID_MAX_LINES` (the hook ceiling, tunable by the owner) is the only file-size authority. Never set your own cap.

| Metric | Limit | Action |
|--------|-------|--------|
| **File size** | within `FUSE_SOLID_MAX_LINES` | ✅ OK |
| **File size** | over `FUSE_SOLID_MAX_LINES` | ❌ SPLIT by responsibility (the hook blocks it) |

## LoC Calculation

```
LoC = Total lines - Comment lines - Blank lines

Comment patterns:
- JS/TS: //, /* */, /** */
- Python: #, """ """, ''' '''
- Go: //, /* */
- PHP: //, #, /* */
- Rust: //, /* */, ///
```

## Split Strategy

```
component.tsx (over the ceiling) → SPLIT INTO:
├── Component.tsx - orchestrator
├── ComponentHeader.tsx - header
├── ComponentContent.tsx - content
├── useComponentLogic.ts - hook
└── index.ts - barrel export
```
