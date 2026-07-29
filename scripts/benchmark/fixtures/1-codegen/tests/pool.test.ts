/**
 * Tests for the promise pool — the contract. DO NOT MODIFY.
 * Implementation target: src/pool.ts (see prompt.md / spec in README).
 */
import { describe, expect, test } from "bun:test";
import { pool } from "../src/pool";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("pool: concurrency cap", () => {
  test("never exceeds the concurrency limit", async () => {
    let running = 0;
    let peak = 0;
    const tasks = Array.from({ length: 10 }, (_, i) => async () => {
      running++;
      peak = Math.max(peak, running);
      await sleep(20);
      running--;
      return i;
    });
    const results = await pool(tasks, { concurrency: 3 });
    expect(peak).toBeLessThanOrEqual(3);
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test("results preserve input order even when tasks finish out of order", async () => {
    const tasks = [
      async () => { await sleep(30); return "slow-first"; },
      async () => { await sleep(5); return "fast-second"; },
    ];
    const results = await pool(tasks, { concurrency: 2 });
    expect(results).toEqual(["slow-first", "fast-second"]);
  });
});

describe("pool: retries", () => {
  test("retries a failing task up to `retries` times, then resolves", async () => {
    let attempts = 0;
    const tasks = [
      async () => {
        attempts++;
        if (attempts < 3) throw new Error(`boom ${attempts}`);
        return "ok";
      },
    ];
    const results = await pool(tasks, { concurrency: 1, retries: 3 });
    expect(results).toEqual(["ok"]);
    expect(attempts).toBe(3);
  });

  test("rejects when a task exhausts its retries", async () => {
    const tasks = [async () => { throw new Error("always"); }];
    await expect(pool(tasks, { concurrency: 1, retries: 2 })).rejects.toThrow("always");
  });
});

describe("pool: timeout", () => {
  test("rejects a task that exceeds its timeout", async () => {
    const tasks = [async () => { await sleep(200); return "late"; }];
    await expect(pool(tasks, { concurrency: 1, timeoutMs: 30 })).rejects.toThrow(/timeout/i);
  });

  test("does not affect tasks within their timeout", async () => {
    const tasks = [async () => { await sleep(10); return "in-time"; }];
    const results = await pool(tasks, { concurrency: 1, timeoutMs: 1000 });
    expect(results).toEqual(["in-time"]);
  });
});

describe("pool: edge cases", () => {
  test("empty input resolves to an empty array", async () => {
    expect(await pool([], { concurrency: 4 })).toEqual([]);
  });

  test("concurrency larger than task count works", async () => {
    const tasks = [async () => 1, async () => 2];
    expect(await pool(tasks, { concurrency: 99 })).toEqual([1, 2]);
  });
});
