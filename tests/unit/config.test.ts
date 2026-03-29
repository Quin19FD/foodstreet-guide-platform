import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Config enforcement tests — isolated from the auth test suite.
 * No mocks, no pre-loaded modules. Tests the real guard logic.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("config enforcement", () => {
  it("throws when JWT_SECRET is missing", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/test");
    // JWT_SECRET is not set

    await expect(import("@/shared/config")).rejects.toThrow(
      /JWT_SECRET environment variable is required but not set/
    );
  });

  it("throws when JWT_SECRET is the default placeholder", async () => {
    vi.stubEnv("JWT_SECRET", "change-me-in-production");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/test");

    await expect(import("@/shared/config")).rejects.toThrow(
      /JWT_SECRET is still set to the default placeholder/
    );
  });

  it("throws when DATABASE_URL is missing", async () => {
    vi.stubEnv("JWT_SECRET", "a-valid-secret");
    // DATABASE_URL is not set

    await expect(import("@/shared/config")).rejects.toThrow(
      /DATABASE_URL environment variable is required but not set/
    );
  });

  it("exports config when both env vars are valid", async () => {
    vi.stubEnv("JWT_SECRET", "a-valid-secret");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/test");

    const mod = await import("@/shared/config");
    expect(mod.config.auth.jwtSecret).toBe("a-valid-secret");
  });
});
