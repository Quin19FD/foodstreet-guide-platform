/**
 * Vendor auth — thin re-export layer over unified auth module.
 *
 * All vendor routes (login, register, refresh, logout, me, profile, avatar-upload,
 * pois, menu-items, media) import from here and get the unified implementation
 * with VENDOR role baked in.
 */

import type { NextResponse } from "next/server";
import {
  VENDOR_AUTH_COOKIES,
  createVendorAccessToken,
  verifyVendorAccessToken as verifyVendorAccessTokenUnified,
  setAuthCookies as unifiedSetAuthCookies,
  clearAuthCookies as unifiedClearAuthCookies,
  jsonError,
  type AccessTokenPayload as UnifiedAccessTokenPayload,
  type RoleAuthCookies,
} from "@/infrastructure/security/auth";

export const AUTH_COOKIES: RoleAuthCookies = VENDOR_AUTH_COOKIES;

/** Narrow role from UserRole union to literal "VENDOR" for existing consumers. */
export type AccessTokenPayload = UnifiedAccessTokenPayload & { role: "VENDOR" };

export function setAuthCookies(
  response: NextResponse,
  input: { accessToken: string; refreshToken: string; rememberMe: boolean }
): void {
  unifiedSetAuthCookies("VENDOR", response, input);
}

export function clearAuthCookies(response: NextResponse): void {
  unifiedClearAuthCookies("VENDOR", response);
}

export { createVendorAccessToken, jsonError };

export function verifyVendorAccessToken(token: string): AccessTokenPayload {
  return verifyVendorAccessTokenUnified(token) as AccessTokenPayload;
}
