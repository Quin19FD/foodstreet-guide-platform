/**
 * Unified Auth Module
 *
 * Single source of truth for all auth operations across admin, vendor, and customer roles.
 * Every auth flow in the codebase routes through this module.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  parseDurationToSeconds,
  signJwtHs256,
  verifyJwtHs256,
  type JwtPayload,
} from "@/infrastructure/security/jwt";
import { config } from "@/shared/config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = "ADMIN" | "VENDOR" | "USER";

export type RoleAuthCookies = {
  access: string;
  refresh: string;
  remember: string;
};

export type AuthenticatedUser = {
  userId: string;
  email: string;
  name: string;
};

export type AccessTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  role: UserRole;
};

// ---------------------------------------------------------------------------
// Cookie config per role
// ---------------------------------------------------------------------------

export const AUTH_COOKIES: Record<UserRole, RoleAuthCookies> = {
  ADMIN: {
    access: "fs_admin_access_token",
    refresh: "fs_admin_refresh_token",
    remember: "fs_admin_remember_me",
  },
  VENDOR: {
    access: "fs_vendor_access_token",
    refresh: "fs_vendor_refresh_token",
    remember: "fs_vendor_remember_me",
  },
  USER: {
    access: "fs_customer_access_token",
    refresh: "fs_customer_refresh_token",
    remember: "fs_customer_remember_me",
  },
} as const;

// ---------------------------------------------------------------------------
// JWT creation & verification (role-parameterized)
// ---------------------------------------------------------------------------

export function createAccessToken(
  role: UserRole,
  input: { userId: string; email: string }
): string {
  const expiresInSeconds = parseDurationToSeconds(config.auth.jwtExpiresIn);
  return signJwtHs256({
    payload: {
      sub: input.userId,
      email: input.email,
      role,
    },
    secret: config.auth.jwtSecret,
    expiresInSeconds,
  });
}

export function verifyAccessToken(
  role: UserRole,
  token: string
): AccessTokenPayload {
  const result = verifyJwtHs256<AccessTokenPayload>({
    token,
    secret: config.auth.jwtSecret,
  });
  if (result.payload.role !== role) {
    throw new Error(`Invalid role: expected ${role}, got ${result.payload.role}`);
  }
  return result.payload;
}

// ---------------------------------------------------------------------------
// Cookie helpers (role-parameterized)
// ---------------------------------------------------------------------------

export function setAuthCookies(
  role: UserRole,
  response: NextResponse,
  input: { accessToken: string; refreshToken: string; rememberMe: boolean }
): void {
  const cookies = AUTH_COOKIES[role];
  const isProduction = process.env.NODE_ENV === "production";

  const accessMaxAge = parseDurationToSeconds(config.auth.jwtExpiresIn);
  const refreshMaxAge = parseDurationToSeconds(config.auth.refreshTokenExpiresIn);

  response.cookies.set(cookies.access, input.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });

  response.cookies.set(cookies.refresh, input.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    ...(input.rememberMe ? { maxAge: refreshMaxAge } : {}),
  });

  if (input.rememberMe) {
    response.cookies.set(cookies.remember, "1", {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: refreshMaxAge,
    });
  } else {
    response.cookies.delete(cookies.remember);
  }
}

export function clearAuthCookies(role: UserRole, response: NextResponse): void {
  const cookies = AUTH_COOKIES[role];
  response.cookies.delete(cookies.access);
  response.cookies.delete(cookies.refresh);
  response.cookies.delete(cookies.remember);
}

// ---------------------------------------------------------------------------
// Bearer token extraction (single correct implementation)
// ---------------------------------------------------------------------------

export function getBearerToken(request: NextRequest): string | null {
  const raw = request.headers.get("authorization");
  if (!raw) return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Generic auth guard — replaces requireAdmin / requireVendor / etc.
//
// Checks cookie first, then Bearer header. Verifies JWT and queries DB
// for active/approved status. Returns user info or an error response.
// ---------------------------------------------------------------------------

export async function requireAuth(
  request: NextRequest,
  role: UserRole
): Promise<AuthenticatedUser | NextResponse> {
  const cookies = AUTH_COOKIES[role];
  const cookieToken = request.cookies.get(cookies.access)?.value ?? null;
  const token = cookieToken ?? getBearerToken(request);

  if (!token) {
    return jsonError(401, "Chưa đăng nhập");
  }

  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(role, token);
  } catch {
    return jsonError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
  }

  // Lazy-import prisma to keep this module importable in non-server contexts
  // (e.g. tests) without triggering the prisma client.
  const { prisma } = await import("@/infrastructure/database/prisma/client");

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive || user.role !== role || user.status !== "APPROVED") {
    return jsonError(401, "Phiên đăng nhập không hợp lệ");
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}

// ---------------------------------------------------------------------------
// jsonError — single implementation
// ---------------------------------------------------------------------------

export function jsonError(
  status: number,
  message: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: message,
      ...extra,
    },
    { status }
  );
}

// ---------------------------------------------------------------------------
// Convenience aliases — let existing _shared.ts files re-export without
// changing downstream imports during migration.
// ---------------------------------------------------------------------------

export const createAdminAccessToken = (input: { userId: string; email: string }) =>
  createAccessToken("ADMIN", input);

export const createVendorAccessToken = (input: { userId: string; email: string }) =>
  createAccessToken("VENDOR", input);

export const createCustomerAccessToken = (input: { userId: string; email: string }) =>
  createAccessToken("USER", input);

export const verifyAdminAccessToken = (token: string) =>
  verifyAccessToken("ADMIN", token);

export const verifyVendorAccessToken = (token: string) =>
  verifyAccessToken("VENDOR", token);

export const verifyCustomerAccessToken = (token: string) =>
  verifyAccessToken("USER", token);

export const ADMIN_AUTH_COOKIES = AUTH_COOKIES.ADMIN;
export const VENDOR_AUTH_COOKIES = AUTH_COOKIES.VENDOR;
export const CUSTOMER_AUTH_COOKIES = AUTH_COOKIES.USER;
