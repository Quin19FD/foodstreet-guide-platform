import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { ADMIN_AUTH_COOKIES, jsonError, verifyAdminAccessToken } from "../session/_shared";

export async function requireAdmin(request: NextRequest): Promise<{ adminId: string } | NextResponse> {
  const cookieToken = request.cookies.get(ADMIN_AUTH_COOKIES.access)?.value ?? null;
  if (!cookieToken) return jsonError(401, "Chưa đăng nhập");

  let payload: { sub: string };
  try {
    payload = verifyAdminAccessToken(cookieToken);
  } catch {
    return jsonError(401, "Phiên đăng nhập không hợp lệ");
  }

  const admin = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!admin) return jsonError(401, "Phiên đăng nhập không hợp lệ");
  if (admin.role !== "ADMIN") return jsonError(403, "Không có quyền admin");
  if (!admin.isActive) return jsonError(403, "Tài khoản admin đang bị khóa");
  if (admin.status !== "APPROVED") return jsonError(403, "Tài khoản admin chưa được phê duyệt");

  return { adminId: admin.id };
}

export function buildTourInclude() {
  return {
    tourPois: {
      orderBy: [{ stopOrder: "asc" as const }],
      include: {
        poi: {
          select: {
            id: true,
            name: true,
            category: true,
            latitude: true,
            longitude: true,
            status: true,
            isActive: true,
          },
        },
      },
    },
  };
}

export function toTourResponse(
  tour: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    durationMinutes: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    tourPois: Array<{
      id: string;
      poiId: string;
      stopOrder: number;
      poi: {
        id: string;
        name: string;
        category: string | null;
        latitude: number | null;
        longitude: number | null;
        status: string;
        isActive: boolean;
      };
    }>;
  }
) {
  return {
    id: tour.id,
    name: tour.name,
    description: tour.description,
    imageUrl: tour.imageUrl,
    durationMinutes: tour.durationMinutes,
    isActive: tour.isActive,
    createdAt: tour.createdAt,
    updatedAt: tour.updatedAt,
    poiIds: tour.tourPois.map((item) => item.poiId),
    stops: tour.tourPois.map((item) => ({
      id: item.id,
      poiId: item.poiId,
      stopOrder: item.stopOrder,
      poi: item.poi,
    })),
  };
}
