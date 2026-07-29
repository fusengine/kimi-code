/**
 * Integration tests for the TTL cache. DO NOT MODIFY.
 * Some tests are RED on the current codebase — that is the task (see prompt.md).
 */
import { describe, expect, test } from "bun:test";
import { TtlCache } from "../src/cache";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("keys", () => {
  test("keys are case- AND whitespace-insensitive (t1)", () => {
    const cache = new TtlCache();
    cache.set(" Foo ", 42);
    expect(cache.get("foo")).toBe(42);
    expect(cache.get("FOO")).toBe(42);
    expect(cache.get(" foo ")).toBe(42);
  });

  test("case-insensitive delete works", () => {
    const cache = new TtlCache();
    cache.set("Bar", 1);
    expect(cache.delete("bar")).toBe(true);
    expect(cache.get("Bar")).toBeNull();
  });
});

describe("ttl", () => {
  test("value is returned within its TTL (t2)", () => {
    const cache = new TtlCache();
    cache.set("k", "v", { ttlSeconds: 60 });
    expect(cache.get("k")).toBe("v");
  });

  test("entry expires after its TTL (t3)", async () => {
    const cache = new TtlCache();
    cache.set("k", "v", { ttlSeconds: 1 });
    await sleep(1200);
    expect(cache.get("k")).toBeNull();
  }, 5000);

  test("entry without TTL never expires", async () => {
    const cache = new TtlCache();
    cache.set("k", "v");
    await sleep(50);
    expect(cache.get("k")).toBe("v");
  });
});

describe("values", () => {
  test("object values round-trip with identical shape", () => {
    const cache = new TtlCache();
    cache.set("obj", { a: 1, nested: { b: [2, 3] } });
    expect(cache.get("obj")).toEqual({ a: 1, nested: { b: [2, 3] } });
  });

  test("missing key returns null", () => {
    const cache = new TtlCache();
    expect(cache.get("nope")).toBeNull();
    expect(cache.has("nope")).toBe(false);
  });

  test("overwrite replaces the value and tracks size", () => {
    const cache = new TtlCache();
    cache.set("a", 1);
    cache.set("a", 2);
    expect(cache.get("a")).toBe(2);
    expect(cache.size).toBe(1);
  });
});
