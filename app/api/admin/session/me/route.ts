import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { ADMIN_AUTH_COOKIES, jsonError, verifyAdminAccessToken } from "../_shared";

export const runtime = "nodejs";

function getBearerToken(request: NextRequest): string | null {
  const raw = request.headers.get("authorization");
  if (!raw) return null;
  const match = raw.match(/^Bearer\\s+(.+)$/i);
  return match?.[1] ?? null;
}

/**
 * GET /api/admin/session/me
 *
 * Input:
 * - Cookie `fs_admin_access_token` hoặc header Authorization: Bearer <token>
 *
 * Output:
 * - { user } nếu access token hợp lệ
 */
export async function GET(request: NextRequest) {
  const cookieToken = request.cookies.get(ADMIN_AUTH_COOKIES.access)?.value ?? null;
  const token = cookieToken ?? getBearerToken(request);
  if (!token) {
    return jsonError(401, "Chưa đăng nhập");
  }

  let payload: { sub: string; email: string; role: "ADMIN" };
  try {
    payload = verifyAdminAccessToken(token);
  } catch {
    return jsonError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive || user.role !== "ADMIN" || user.status !== "APPROVED") {
    return jsonError(401, "Phiên đăng nhập không hợp lệ");
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phoneNumber: user.phoneNumber ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      createdAt: user.createdAt,
    },
  });
}
