# Task 3 — Multi-file debugging

`bun test` currently FAILS on this project (a small in-memory TTL cache). The failing behavior involves key normalization, TTL expiry, and the serialization layer — the defects live somewhere across `src/keys.ts`, `src/cache.ts`, `src/serde.ts`.

## Task

1. Run `bun test` and identify every failing test.
2. Find the ROOT CAUSE of each failure (there is more than one defect, in more than one file).
3. Fix them. Beware: fixing one defect may reveal another that it was masking — re-run the full suite after each fix until everything is green.
4. Report each root cause precisely (file + mechanism), not just the patches.

## Rules

- Modify ONLY files under `src/`. NEVER touch `tests/` — the tests define the intended behavior.
- No new dependencies. Bun runtime, TypeScript strict.
- Done = `bun test` fully green, with a root-cause note per defect.
