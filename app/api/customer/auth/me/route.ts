import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { AUTH_COOKIES, jsonError, verifyCustomerAccessToken } from "../_shared";

export const runtime = "nodejs";

function getBearerToken(request: NextRequest): string | null {
  const raw = request.headers.get("authorization");
  if (!raw) return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

/**
 * GET /api/customer/auth/me
 */
export async function GET(request: NextRequest) {
  const cookieToken = request.cookies.get(AUTH_COOKIES.access)?.value ?? null;
  const token = cookieToken ?? getBearerToken(request);
  if (!token) {
    return jsonError(401, "Chưa đăng nhập");
  }

  let payload: { sub: string; email: string; role: "USER" };
  try {
    payload = verifyCustomerAccessToken(token);
  } catch {
    return jsonError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive || user.role !== "USER" || user.status !== "APPROVED") {
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
