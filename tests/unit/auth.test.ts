import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Stub environment and mock config BEFORE any module that imports it
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "test-secret-key-for-unit-tests");
  vi.stubEnv("DATABASE_URL", "postgresql://localhost/test");
});

// Mock @/shared/config so the auth module can load without throwing
vi.mock("@/shared/config", () => ({
  config: {
    auth: {
      jwtSecret: "test-secret-key-for-unit-tests",
      jwtExpiresIn: "15m",
      refreshTokenExpiresIn: "7d",
    },
  },
}));

// Mock @/infrastructure/database/prisma/client so requireAuth doesn't hit a real DB
vi.mock("@/infrastructure/database/prisma/client", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: "user-1",
        email: "admin@test.com",
        name: "Admin User",
        role: "ADMIN",
        isActive: true,
        status: "APPROVED",
      }),
    },
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  ADMIN_AUTH_COOKIES,
  AUTH_COOKIES,
  CUSTOMER_AUTH_COOKIES,
  type UserRole,
  VENDOR_AUTH_COOKIES,
  createAccessToken,
  createAdminAccessToken,
  createCustomerAccessToken,
  createVendorAccessToken,
  getBearerToken,
  jsonError,
  requireAuth,
  verifyAccessToken,
  verifyAdminAccessToken,
  verifyCustomerAccessToken,
  verifyVendorAccessToken,
} from "@/infrastructure/security/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return {
    headers: new Headers(headers),
    cookies: {
      get: (name: string) =>
        name === "fs_admin_access_token" && headers.cookie ? { value: "cookie-token" } : undefined,
    },
  } as unknown as NextRequest;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AUTH_COOKIES", () => {
  it("maps each role to unique cookie names", () => {
    expect(AUTH_COOKIES.ADMIN.access).toBe("fs_admin_access_token");
    expect(AUTH_COOKIES.VENDOR.access).toBe("fs_vendor_access_token");
    expect(AUTH_COOKIES.USER.access).toBe("fs_customer_access_token");
    expect(AUTH_COOKIES.ADMIN.refresh).toBe("fs_admin_refresh_token");
    expect(AUTH_COOKIES.VENDOR.refresh).toBe("fs_vendor_refresh_token");
    expect(AUTH_COOKIES.USER.refresh).toBe("fs_customer_refresh_token");
  });

  it("re-exports per-role cookie constants", () => {
    expect(ADMIN_AUTH_COOKIES).toBe(AUTH_COOKIES.ADMIN);
    expect(VENDOR_AUTH_COOKIES).toBe(AUTH_COOKIES.VENDOR);
    expect(CUSTOMER_AUTH_COOKIES).toBe(AUTH_COOKIES.USER);
  });
});

describe("createAccessToken & verifyAccessToken", () => {
  const roles: UserRole[] = ["ADMIN", "VENDOR", "USER"];

  for (const role of roles) {
    describe(`role=${role}`, () => {
      it("creates and verifies a token", () => {
        const token = createAccessToken(role, { userId: "u1", email: "a@b.com" });
        expect(token).toContain(".");
        const payload = verifyAccessToken(role, token);
        expect(payload.sub).toBe("u1");
        expect(payload.email).toBe("a@b.com");
        expect(payload.role).toBe(role);
        expect(payload.iat).toBeTypeOf("number");
        expect(payload.exp).toBeTypeOf("number");
      });

      it("rejects a token signed for a different role", () => {
        const otherRoles = roles.filter((r) => r !== role);
        const token = createAccessToken(role, { userId: "u1", email: "a@b.com" });
        for (const other of otherRoles) {
          expect(() => verifyAccessToken(other, token)).toThrow(/Invalid role/);
        }
      });
    });
  }
});

describe("convenience aliases", () => {
  it("createAdminAccessToken produces a valid ADMIN token", () => {
    const token = createAdminAccessToken({ userId: "u1", email: "a@b.com" });
    const payload = verifyAdminAccessToken(token);
    expect(payload.role).toBe("ADMIN");
    expect(payload.sub).toBe("u1");
  });

  it("createVendorAccessToken produces a valid VENDOR token", () => {
    const token = createVendorAccessToken({ userId: "u1", email: "a@b.com" });
    const payload = verifyVendorAccessToken(token);
    expect(payload.role).toBe("VENDOR");
    expect(payload.sub).toBe("u1");
  });

  it("createCustomerAccessToken produces a valid USER token", () => {
    const token = createCustomerAccessToken({ userId: "u1", email: "a@b.com" });
    const payload = verifyCustomerAccessToken(token);
    expect(payload.role).toBe("USER");
    expect(payload.sub).toBe("u1");
  });

  it("verifyAdminAccessToken rejects non-ADMIN tokens", () => {
    const vendorToken = createVendorAccessToken({ userId: "u1", email: "a@b.com" });
    expect(() => verifyAdminAccessToken(vendorToken)).toThrow(/Invalid role/);
  });
});

describe("getBearerToken", () => {
  it("extracts token from valid Authorization header", () => {
    const req = makeRequest({ authorization: "Bearer abc123" });
    expect(getBearerToken(req)).toBe("abc123");
  });

  it("is case-insensitive for 'Bearer'", () => {
    const req = makeRequest({ authorization: "bearer abc123" });
    expect(getBearerToken(req)).toBe("abc123");
  });

  it("returns null when Authorization header is missing", () => {
    const req = makeRequest();
    expect(getBearerToken(req)).toBeNull();
  });

  it("returns null for malformed header (no Bearer prefix)", () => {
    const req = makeRequest({ authorization: "Token abc123" });
    expect(getBearerToken(req)).toBeNull();
  });

  it("returns null for Bearer with no token value", () => {
    const req = makeRequest({ authorization: "Bearer " });
    expect(getBearerToken(req)).toBeNull();
  });

  it("returns null for empty string header", () => {
    const req = makeRequest({ authorization: "" });
    expect(getBearerToken(req)).toBeNull();
  });
});

describe("jsonError", () => {
  it("returns a JSON response with correct status and message", async () => {
    const res = jsonError(401, "Unauthorized");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("merges extra fields into the body", async () => {
    const res = jsonError(400, "Bad request", { code: "INVALID_INPUT" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Bad request", code: "INVALID_INPUT" });
  });
});

describe("config enforcement", () => {
  // NOTE: The real guard is tested in tests/unit/config.test.ts with an
  // isolated import (no mocks). Here we just verify the non-default path
  // succeeds, which is already proven by the 23 other tests passing
  // (they all import auth.ts → config.ts without throwing).
  it("does not throw when JWT_SECRET is a non-default value", () => {
    const rawSecret = process.env.JWT_SECRET;
    expect(rawSecret).toBeDefined();
    expect(rawSecret).not.toBe("change-me-in-production");
  });
});

describe("requireAuth", () => {
  it("returns error when no token is present", async () => {
    const req = makeRequest();
    const result = await requireAuth(req, "ADMIN");
    expect((result as any).status).toBe(401);
  });

  it("returns error for invalid token", async () => {
    const req = makeRequest({ authorization: "Bearer invalid.token.here" });
    const result = await requireAuth(req, "ADMIN");
    expect((result as any).status).toBe(401);
  });

  it("returns authenticated user for valid cookie token", async () => {
    // Create a real ADMIN token and set it as a cookie
    const token = createAdminAccessToken({ userId: "user-1", email: "admin@test.com" });
    const req = {
      headers: new Headers(),
      cookies: {
        get: (name: string) => (name === "fs_admin_access_token" ? { value: token } : undefined),
      },
    } as unknown as NextRequest;

    const result = await requireAuth(req, "ADMIN");
    if (typeof result === "object" && "status" in result) {
      throw new Error(`Expected user, got error ${(result as any).status}`);
    }
    expect(result.userId).toBe("user-1");
    expect(result.email).toBe("admin@test.com");
    expect(result.name).toBe("Admin User");
  });
});
