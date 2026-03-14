import { NextResponse } from "next/server";

import {
  parseDurationToSeconds,
  signJwtHs256,
  verifyJwtHs256,
} from "@/infrastructure/security/jwt";
import { config } from "@/shared/config";

export const AUTH_COOKIES = {
  access: "fs_customer_access_token",
  refresh: "fs_customer_refresh_token",
  remember: "fs_customer_remember_me",
} as const;

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: "USER";
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

export function createCustomerAccessToken(input: { userId: string; email: string }): string {
  const expiresInSeconds = parseDurationToSeconds(config.auth.jwtExpiresIn);
  return signJwtHs256({
    payload: {
      sub: input.userId,
      email: input.email,
      role: "USER",
    },
    secret: config.auth.jwtSecret,
    expiresInSeconds,
  });
}

export function verifyCustomerAccessToken(token: string): AccessTokenPayload {
  const result = verifyJwtHs256<AccessTokenPayload>({ token, secret: config.auth.jwtSecret });
  if (result.payload.role !== "USER") {
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
