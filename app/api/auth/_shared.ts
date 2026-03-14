import { NextResponse } from "next/server";

import {
  parseDurationToSeconds,
  signJwtHs256,
  verifyJwtHs256,
} from "@/infrastructure/security/jwt";
import { config } from "@/shared/config";

export const AUTH_COOKIES = {
  access: "fs_admin_access_token",
  refresh: "fs_admin_refresh_token",
  remember: "fs_admin_remember_me",
} as const;

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: "ADMIN";
  iat: number;
  exp: number;
};

export function setAuthCookies(
  response: NextResponse,
  input: {
    accessToken: string;
    refreshToken: string;
    rememberMe: boolean;
  }
): void {
  const isProduction = process.env.NODE_ENV === "production";

  const accessMaxAge = parseDurationToSeconds(config.auth.jwtExpiresIn);
  const refreshMaxAge = parseDurationToSeconds(config.auth.refreshTokenExpiresIn);

  response.cookies.set(AUTH_COOKIES.access, input.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });

  response.cookies.set(AUTH_COOKIES.refresh, input.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    ...(input.rememberMe ? { maxAge: refreshMaxAge } : {}),
  });

  if (input.rememberMe) {
    response.cookies.set(AUTH_COOKIES.remember, "1", {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: refreshMaxAge,
    });
  } else {
    response.cookies.delete(AUTH_COOKIES.remember);
  }
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(AUTH_COOKIES.access);
  response.cookies.delete(AUTH_COOKIES.refresh);
  response.cookies.delete(AUTH_COOKIES.remember);
}

/**
 * Tạo access token cho admin.
 *
 * Input:
 * - userId/email: thông tin user
 *
 * Output:
 * - string JWT HS256
 */
export function createAdminAccessToken(input: { userId: string; email: string }): string {
  const expiresInSeconds = parseDurationToSeconds(config.auth.jwtExpiresIn);
  return signJwtHs256({
    payload: {
      sub: input.userId,
      email: input.email,
      role: "ADMIN",
    },
    secret: config.auth.jwtSecret,
    expiresInSeconds,
  });
}

/**
 * Verify access token và trả payload.
 *
 * Input:
 * - token: JWT string
 *
 * Output:
 * - payload (sub/email/role/iat/exp)
 */
export function verifyAdminAccessToken(token: string): AccessTokenPayload {
  const result = verifyJwtHs256<AccessTokenPayload>({ token, secret: config.auth.jwtSecret });
  if (result.payload.role !== "ADMIN") {
    throw new Error("Invalid role");
  }
  return result.payload;
}

export function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error: message,
      ...extra,
    },
    { status }
  );
}
