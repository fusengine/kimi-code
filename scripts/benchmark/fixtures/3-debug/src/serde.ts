/**
 * Serialization layer for cache entries.
 * Entries are stored as JSON strings in an envelope: `{ "v": <value>, "_expiresAt": <ms|null> }`.
 * Underscore-prefixed fields are internal metadata.
 */
import type { CacheEntry } from "./interfaces/cache";

/** Serializes an entry to its JSON string form. */
export function serialize(entry: CacheEntry): string {
  // Internal fields (underscore-prefixed) are runtime-only: keep the stored payload clean.
  return JSON.stringify(entry, (key, value) => (key.startsWith("_") ? undefined : value));
}

/** Deserializes a stored JSON string back to the full entry. */
export function deserialize(raw: string): CacheEntry {
  return JSON.parse(raw);
}
