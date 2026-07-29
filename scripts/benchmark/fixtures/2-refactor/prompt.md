# Task 2 — Refactoring without behavior change

`src/cart.ts` is a god-object: the `Cart` class mixes line storage with all pricing computation (subtotal, discount, tax prorating, totals). All tests in `tests/cart.test.ts` are currently GREEN.

## Task

Extract every pricing computation into a new module `src/pricing.ts` as **pure functions** operating on plain data (lines array + discount), e.g. `subtotalCents(lines)`, `discountCents(lines, discount)`, `taxCents(lines, discount)`, `totalCents(lines, discount)`. `Cart` keeps storage and delegates; its **public API stays exactly the same** (same method names, same signatures, same return values — including rounding behavior).

## Rules

- `tests/` MUST NOT be modified — they are the non-regression proof.
- Public behavior identical: prorated-tax rounding and discount capping must not drift.
- Create `src/pricing.ts`; shrink `src/cart.ts` to storage + delegation. No new dependencies.
- Tax rates live in one obvious place after the refactor.
- Validate by running `bun test` — all green at the end.
