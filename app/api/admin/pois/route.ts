import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";
import {
  sendPoiApprovedEmail,
  sendPoiRejectedEmail,
} from "@/infrastructure/vendor/mailer";

import {
  ADMIN_AUTH_COOKIES,
  jsonError,
  verifyAdminAccessToken,
} from "../session/_shared";

export const runtime = "nodejs";

async function requireAdmin(
  request: NextRequest,
): Promise<{ adminId: string } | NextResponse> {
  const cookieToken =
    request.cookies.get(ADMIN_AUTH_COOKIES.access)?.value ?? null;
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
  if (admin.status !== "APPROVED")
    return jsonError(403, "Tài khoản admin chưa được phê duyệt");

  return { adminId: admin.id };
}

/**
 * GET /api/admin/pois
 * Query: ?q=&status=&ownerId=&take=&skip=
 */
export async function GET(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const takeRaw = url.searchParams.get("take") ?? "50";
  const skipRaw = url.searchParams.get("skip") ?? "0";

  const take = Math.min(Math.max(Number(takeRaw) || 50, 1), 200);
  const skip = Math.max(Number(skipRaw) || 0, 0);

  const whereStatus: "PENDING" | "APPROVED" | "REJECTED" | null =
    status === "PENDING" || status === "APPROVED" || status === "REJECTED"
      ? (status as "PENDING" | "APPROVED" | "REJECTED")
      : null;

  const where = {
    ...(whereStatus ? { status: whereStatus } : {}),
    ...(ownerId ? { ownerId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { owner: { name: { contains: q, mode: "insensitive" as const } } },
            { owner: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, pois] = await Promise.all([
    prisma.pOI.count({ where }),
    prisma.pOI.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take,
      skip,
      select: {
        id: true,
        name: true,
        category: true,
        latitude: true,
        longitude: true,
        priceMin: true,
        priceMax: true,
        rating: true,
        status: true,
        rejectionReason: true,
        approvedBy: true,
        approvedAt: true,
        submitCount: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            images: true,
            menuItems: true,
            translations: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ total, pois, take, skip });
}
