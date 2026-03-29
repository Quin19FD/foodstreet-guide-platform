/**
 * Admin session auth — thin re-export layer over unified auth module.
 *
 * All admin session routes (login, register, refresh, logout, me, profile, avatar-upload)
 * import from here and get the unified implementation with ADMIN role baked in.
 */

import type { AccessTokenPayload } from "@/infrastructure/security/auth";
import {
  ADMIN_AUTH_COOKIES,
  clearAuthCookies,
  createAccessToken,
  jsonError,
  requireAuth,
  setAuthCookies,
  verifyAccessToken,
} from "@/infrastructure/security/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export { ADMIN_AUTH_COOKIES, jsonError };

export type AdminAccessTokenPayload = {
  sub: string;
  email: string;
  role: "ADMIN";
  iat: number;
  exp: number;
};

export function setAdminAuthCookies(
  response: NextResponse,
  input: {
    accessToken: string;
    refreshToken: string;
    rememberMe: boolean;
  }
): void {
  setAuthCookies("ADMIN", response, input);
}

export function clearAdminAuthCookies(response: NextResponse): void {
  clearAuthCookies("ADMIN", response);
}

export function createAdminAccessToken(input: { userId: string; email: string }): string {
  return createAccessToken("ADMIN", input);
}

export function verifyAdminAccessToken(token: string): AdminAccessTokenPayload {
  return verifyAccessToken("ADMIN", token) as AdminAccessTokenPayload;
}

export async function requireAdmin(
  request: NextRequest
): Promise<{ adminId: string; email: string; name: string | null } | NextResponse> {
  const result = await requireAuth(request, "ADMIN");
  if (result instanceof NextResponse) return result;
  return { adminId: result.userId, email: result.email, name: result.name };
}
