import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { hashRefreshToken } from "@/infrastructure/security/refresh-token";

import { AUTH_COOKIES, clearAuthCookies } from "../_shared";

export const runtime = "nodejs";

/**
 * POST /api/vendor/auth/logout
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(AUTH_COOKIES.refresh)?.value ?? null;

  if (refreshToken) {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    await prisma.user.updateMany({
      where: { refreshTokenHash },
      data: { refreshTokenHash: null, refreshTokenExpiry: null },
    });
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
