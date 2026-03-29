/**
 * Admin session auth — thin re-export layer over unified auth module.
 *
 * All admin session routes (login, register, refresh, logout, me, profile, avatar-upload)
 * import from here and get the unified implementation with ADMIN role baked in.
 */

import type { NextResponse } from "next/server";
import type { AccessTokenPayload } from "@/infrastructure/security/auth";
import {
  ADMIN_AUTH_COOKIES,
  createAccessToken,
  verifyAccessToken,
  setAuthCookies,
  clearAuthCookies,
  jsonError,
} from "@/infrastructure/security/auth";

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
