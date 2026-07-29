/** Cache domain types. */
export interface CacheOptions {
  /** Time-to-live in SECONDS. Undefined = never expires. */
  ttlSeconds?: number;
}

export interface CacheEntry {
  v: unknown;
  /** Absolute expiry timestamp in ms (Date.now() based), null = never expires. */
  _expiresAt: number | null;
}
