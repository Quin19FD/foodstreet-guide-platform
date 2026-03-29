import { createRateLimiter, registrationLimiter } from "@/infrastructure/security/rate-limit";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    registrationLimiter.clearAll();
  });

  it("allows requests within the limit", () => {
    const limiter = createRateLimiter("__testRateLimitStore", {
      windowMs: 60_000,
      maxHits: 3,
    });

    expect(limiter.check("user1").ok).toBe(true);
    expect(limiter.check("user1").ok).toBe(true);
    expect(limiter.check("user1").ok).toBe(true);
  });

  it("blocks requests beyond the limit", () => {
    const limiter = createRateLimiter("__testRateLimitStore2", {
      windowMs: 60_000,
      maxHits: 3,
    });

    limiter.check("user1");
    limiter.check("user1");
    limiter.check("user1");
    const result = limiter.check("user1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("returns retryAfterSeconds less than or equal to the window", () => {
    const limiter = createRateLimiter("__testRateLimitStore3", {
      windowMs: 60_000,
      maxHits: 1,
    });

    limiter.check("user1");
    const result = limiter.check("user1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
    }
  });

  it("resets the window after time expires", () => {
    const limiter = createRateLimiter("__testRateLimitStore4", {
      windowMs: 60_000,
      maxHits: 1,
    });

    limiter.check("user1");
    const blocked = limiter.check("user1");
    expect(blocked.ok).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(61_000);

    const afterWindow = limiter.check("user1");
    expect(afterWindow.ok).toBe(true);
  });

  it("isolates different keys", () => {
    const limiter = createRateLimiter("__testRateLimitStore5", {
      windowMs: 60_000,
      maxHits: 1,
    });

    limiter.check("user1");
    expect(limiter.check("user1").ok).toBe(false);
    expect(limiter.check("user2").ok).toBe(true);
  });

  it("normalizes keys to lowercase and trimmed", () => {
    const limiter = createRateLimiter("__testRateLimitStore6", {
      windowMs: 60_000,
      maxHits: 1,
    });

    limiter.check("User1");
    expect(limiter.check("user1").ok).toBe(false);
  });

  it("reset clears a specific key", () => {
    const limiter = createRateLimiter("__testRateLimitStore7", {
      windowMs: 60_000,
      maxHits: 1,
    });

    limiter.check("user1");
    expect(limiter.check("user1").ok).toBe(false);

    limiter.reset("user1");
    expect(limiter.check("user1").ok).toBe(true);
  });

  it("clearAll removes all entries", () => {
    const limiter = createRateLimiter("__testRateLimitStore8", {
      windowMs: 60_000,
      maxHits: 1,
    });

    limiter.check("user1");
    limiter.check("user2");
    expect(limiter.check("user1").ok).toBe(false);
    expect(limiter.check("user2").ok).toBe(false);

    limiter.clearAll();
    expect(limiter.check("user1").ok).toBe(true);
    expect(limiter.check("user2").ok).toBe(true);
  });
});

describe("registrationLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    registrationLimiter.clearAll();
  });

  it("uses a 15-minute window with 5 max hits", () => {
    for (let i = 0; i < 5; i++) {
      expect(registrationLimiter.check("192.168.1.1").ok).toBe(true);
    }
    const result = registrationLimiter.check("192.168.1.1");
    expect(result.ok).toBe(false);
  });

  it("allows different IPs independently", () => {
    for (let i = 0; i < 5; i++) {
      registrationLimiter.check("10.0.0.1");
    }
    expect(registrationLimiter.check("10.0.0.1").ok).toBe(false);
    expect(registrationLimiter.check("10.0.0.2").ok).toBe(true);
  });
});
