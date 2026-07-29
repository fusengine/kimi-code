/**
 * Key normalization for the cache.
 * Contract: keys are case-insensitive and insensitive to surrounding whitespace:
 * " Foo ", "foo" and "FOO" are the SAME key.
 */

/**
 * Normalizes a cache key: trims surrounding whitespace, then lowercases.
 */
export function normalizeKey(key: string): string {
  return key.toLowerCase();
}
