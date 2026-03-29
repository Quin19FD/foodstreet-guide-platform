/**
 * Generic sliding-window rate limiter.
 *
 * Reusable across any endpoint — registration, login, password reset, etc.
 * Each caller provides a unique store key (e.g. "register:192.168.1.1")
 * so different endpoints have independent limits.
 *
 * In-memory store (suitable for dev / single instance).
 * Production should use Redis or a DB table to survive restarts.
 */

type Entry = {
  windowStartMs: number;
  count: number;
};

export interface RateLimitConfig {
  /** Sliding window duration in milliseconds */
  windowMs: number;
  /** Maximum allowed hits within the window */
  maxHits: number;
}

export type RateLimitStatus =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/**
 * Create a rate-limited check function bound to a specific globalThis store.
 *
 * Each call site gets its own factory with an isolated store, so registration
 * limits don't interfere with login limits, etc.
 */
export function createRateLimiter(
  storeKey: string,
  config: RateLimitConfig
) {
  // eslint-disable-next-line no-var
  let store: Map<string, Entry> | undefined;

  const getStore = (): Map<string, Entry> => {
    if (!store) {
      store = new Map<string, Entry>();
      // Expose on globalThis in non-production so tests can inspect/reset
      if (process.env.NODE_ENV !== "production") {
        (globalThis as Record<string, unknown>)[storeKey] = store;
      }
    }
    return store;
  };

  /**
   * Check if a key (e.g. IP address or email) is within rate limits,
   * and record the hit atomically.
   */
  const check = (key: string, now = new Date()): RateLimitStatus => {
    const s = getStore();
    const normalizedKey = key.trim().toLowerCase();
    const nowMs = now.getTime();

    const current = s.get(normalizedKey);
    if (!current) {
      s.set(normalizedKey, { windowStartMs: nowMs, count: 1 });
      return { ok: true };
    }

    const inWindow = nowMs - current.windowStartMs <= config.windowMs;
    const count = inWindow ? current.count + 1 : 1;
    const windowStartMs = inWindow ? current.windowStartMs : nowMs;

    s.set(normalizedKey, { windowStartMs, count });

    if (count > config.maxHits) {
      const retryAfterMs = config.windowMs - (nowMs - windowStartMs);
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }

    return { ok: true };
  };

  /**
   * Reset the rate limit for a specific key.
   */
  const reset = (key: string): void => {
    getStore().delete(key.trim().toLowerCase());
  };

  /**
   * Clear the entire store. Useful for testing.
   */
  const clearAll = (): void => {
    const s = getStore();
    s.clear();
  };

  return { check, reset, clearAll };
}

// ---------------------------------------------------------------------------
// Pre-built limiters for common use-cases
// ---------------------------------------------------------------------------

/** 5 registration attempts per IP per 15 minutes */
export const registrationLimiter = createRateLimiter("__registrationRateLimitStore", {
  windowMs: 15 * 60_000,
  maxHits: 5,
});
