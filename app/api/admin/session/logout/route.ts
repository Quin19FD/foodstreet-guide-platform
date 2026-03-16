import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";
import { hashRefreshToken } from "@/infrastructure/security/refresh-token";

import { ADMIN_AUTH_COOKIES, clearAdminAuthCookies, verifyAdminAccessToken } from "../_shared";

export const runtime = "nodejs";

/**
 * POST /api/admin/session/logout
 *
 * Input:
 * - Cookie `fs_admin_refresh_token` (nếu có)
 *
 * Output:
 * - { ok: true }
 */
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ADMIN_AUTH_COOKIES.access)?.value ?? null;
  const refreshToken = request.cookies.get(ADMIN_AUTH_COOKIES.refresh)?.value ?? null;

  let userId: string | null = null;
  if (accessToken) {
    try {
      userId = verifyAdminAccessToken(accessToken).sub;
    } catch {
      userId = null;
    }
  }

  if (!userId && refreshToken) {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const user = await prisma.user.findFirst({ where: { refreshTokenHash } });
    if (user?.role === "ADMIN") userId = user.id;
  }

  if (refreshToken) {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    await prisma.user.updateMany({
      where: { refreshTokenHash },
      data: { refreshTokenHash: null, refreshTokenExpiry: null },
    });
  }

  if (userId) {
    await logUserActivity({
      userId,
      action: "ADMIN_LOGOUT",
      targetType: "USER",
      targetId: userId,
      request,
    });
  }

  const response = NextResponse.json({ ok: true });
  clearAdminAuthCookies(response);
  return response;
}

