/**
 * Customer auth — thin re-export layer over unified auth module.
 *
 * All customer routes (login, register, refresh, logout, me, favorites, stats)
 * import from here and get the unified implementation with USER role baked in.
 */

import {
  CUSTOMER_AUTH_COOKIES,
  type RoleAuthCookies,
  type AccessTokenPayload as UnifiedAccessTokenPayload,
  createCustomerAccessToken,
  jsonError,
  clearAuthCookies as unifiedClearAuthCookies,
  setAuthCookies as unifiedSetAuthCookies,
  verifyCustomerAccessToken as verifyCustomerAccessTokenUnified,
} from "@/infrastructure/security/auth";
import type { NextResponse } from "next/server";

export const AUTH_COOKIES: RoleAuthCookies = CUSTOMER_AUTH_COOKIES;

/** Narrow role from UserRole union to literal "USER" for existing consumers. */
export type AccessTokenPayload = UnifiedAccessTokenPayload & { role: "USER" };

export function setAuthCookies(
  response: NextResponse,
  input: { accessToken: string; refreshToken: string; rememberMe: boolean }
): void {
  unifiedSetAuthCookies("USER", response, input);
}

export function clearAuthCookies(response: NextResponse): void {
  unifiedClearAuthCookies("USER", response);
}

export { createCustomerAccessToken, jsonError };

export function verifyCustomerAccessToken(token: string): AccessTokenPayload {
  return verifyCustomerAccessTokenUnified(token) as AccessTokenPayload;
}
