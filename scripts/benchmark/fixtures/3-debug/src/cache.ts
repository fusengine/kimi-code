/**
 * In-memory TTL cache with normalized keys and serialized storage.
 * Storage: Map<normalizedKey, jsonString> via keys.ts + serde.ts.
 */
import type { CacheOptions, CacheEntry } from "./interfaces/cache";
import { normalizeKey } from "./keys";
import { serialize, deserialize } from "./serde";

export class TtlCache {
  private store = new Map<string, string>();

  set(key: string, value: unknown, options: CacheOptions = {}): void {
    const expiresAt = options.ttlSeconds !== undefined ? Date.now() + options.ttlSeconds : null;
    const entry: CacheEntry = { v: value, _expiresAt: expiresAt };
    this.store.set(normalizeKey(key), serialize(entry));
  }

  get(key: string): unknown | null {
    const raw = this.store.get(normalizeKey(key));
    if (raw === undefined) return null;
    const entry = deserialize(raw);
    if (entry._expiresAt != null && Date.now() > entry._expiresAt) {
      this.store.delete(normalizeKey(key));
      return null;
    }
    return entry.v ?? null;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.store.delete(normalizeKey(key));
  }

  get size(): number {
    return this.store.size;
  }
}
