import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { AUTH_COOKIES, jsonError, verifyVendorAccessToken } from "../auth/_shared";

export async function requireVendor(
  request: NextRequest
): Promise<{ vendorId: string; email: string; name: string | null } | NextResponse> {
  const cookieToken = request.cookies.get(AUTH_COOKIES.access)?.value ?? null;
  if (!cookieToken) return jsonError(401, "Chưa đăng nhập");

  let payload: { sub: string };
  try {
    payload = verifyVendorAccessToken(cookieToken);
  } catch {
    return jsonError(401, "Phiên đăng nhập không hợp lệ");
  }

  const vendor = await prisma.user.findUnique({
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

  if (!vendor || vendor.role !== "VENDOR") return jsonError(403, "Không có quyền vendor");
  if (!vendor.isActive) return jsonError(403, "Tài khoản vendor đang bị khóa");
  if (vendor.status !== "APPROVED") return jsonError(403, "Tài khoản vendor chưa được phê duyệt");

  return { vendorId: vendor.id, email: vendor.email, name: vendor.name };
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
