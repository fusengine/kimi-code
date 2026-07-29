# Task 1 — Code generation

Implement `src/pool.ts` in this project: a **promise pool** with concurrency limit, per-task retries, and per-task timeout.

## Required export

```ts
export interface PoolOptions {
  concurrency: number;   // max tasks running at once (>= 1)
  retries?: number;      // per-task retry attempts after the first failure (default 0)
  timeoutMs?: number;    // per-task wall-clock timeout; reject with an Error mentioning "timeout"
}

export function pool<T>(tasks: Array<() => Promise<T>>, options: PoolOptions): Promise<T[]>
```

## Contract (enforced by `tests/pool.test.ts`)

- Never run more than `concurrency` tasks simultaneously.
- The returned array preserves **input order**, regardless of completion order.
- A failing task is retried up to `retries` times; if it still fails, the pool rejects with that error.
- A task exceeding `timeoutMs` rejects the pool with an error whose message matches /timeout/i.
- `pool([], ...)` resolves to `[]`.
- TypeScript strict; no external dependencies; Bun runtime.

## Rules

- Create ONLY `src/pool.ts` (plus internal helpers in the same file if needed).
- DO NOT modify `tests/` or any other file.
- Validate by running `bun test` at the end — all tests must pass.
