import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { ADMIN_AUTH_COOKIES, jsonError, verifyAdminAccessToken } from "../session/_shared";

export async function requireAdmin(
  request: NextRequest
): Promise<{ adminId: string; email: string; name: string | null } | NextResponse> {
  const cookieToken = request.cookies.get(ADMIN_AUTH_COOKIES.access)?.value ?? null;
  if (!cookieToken) return jsonError(401, "Chưa đăng nhập");

  let payload: { sub: string };
  try {
    payload = verifyAdminAccessToken(cookieToken);
  } catch {
    return jsonError(401, "Phiên đăng nhập không hợp lệ");
  }

  const admin = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      isActive: true,
    },
  });

  if (!admin || admin.role !== "ADMIN") return jsonError(403, "Không có quyền admin");
  if (!admin.isActive) return jsonError(403, "Tài khoản admin đang bị khóa");
  if (admin.status !== "APPROVED") return jsonError(403, "Tài khoản admin chưa được phê duyệt");

  return { adminId: admin.id, email: admin.email, name: admin.name };
}

export function buildPoiDetailInclude() {
  return {
    owner: {
      select: {
        id: true,
        email: true,
        name: true,
      },
    },
    images: {
      orderBy: { id: "asc" as const },
    },
    menuItems: {
      orderBy: { createdAt: "asc" as const },
    },
    translations: {
      orderBy: [{ language: "asc" as const }],
      include: {
        audios: {
          orderBy: { createdAt: "asc" as const },
        },
      },
    },
  };
}
