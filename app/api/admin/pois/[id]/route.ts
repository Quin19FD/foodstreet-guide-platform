import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { poiDecisionSchema } from "@/application/validators/admin-pois";
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
} from "../../session/_shared";

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
 * GET /api/admin/pois/:id
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await context.params;

  const poi = await prisma.pOI.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
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
      images: {
        select: {
          id: true,
          imageUrl: true,
          description: true,
        },
      },
      menuItems: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          isAvailable: true,
        },
      },
      translations: {
        select: {
          id: true,
          language: true,
          name: true,
          description: true,
          audioScript: true,
          audios: {
            select: {
              id: true,
              audioUrl: true,
            },
          },
        },
      },
    },
  });

  if (!poi) return jsonError(404, "Không tìm thấy POI");

  return NextResponse.json({ poi });
}

/**
 * PATCH /api/admin/pois/:id
 * Approve or reject POI: { status: "APPROVED" } or { status: "REJECTED", rejectionReason }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await context.params;

  const poi = await prisma.pOI.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!poi) return jsonError(404, "Không tìm thấy POI");
  if (poi.status !== "PENDING") return jsonError(400, "POI đã được xử lý");

  const body = await request.json().catch(() => null);
  const parsed = poiDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", {
      issues: parsed.error.issues,
    });
  }

  const input = parsed.data;
  const now = new Date();

  const updatedPoi = await prisma.pOI.update({
    where: { id },
    data: {
      status: input.status,
      rejectionReason:
        input.status === "REJECTED" ? input.rejectionReason : null,
      approvedBy: input.status === "APPROVED" ? adminResult.adminId : null,
      approvedAt: input.status === "APPROVED" ? now : null,
    },
    select: {
      id: true,
      name: true,
      status: true,
      rejectionReason: true,
      approvedBy: true,
      approvedAt: true,
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  await logUserActivity({
    userId: adminResult.adminId,
    action: "ADMIN_POI_DECISION",
    targetType: "POI",
    targetId: id,
    meta: {
      poiName: updatedPoi.name,
      status: updatedPoi.status,
      rejectionReason: updatedPoi.rejectionReason,
    },
    request,
  });

  let mailSent = false;
  if (updatedPoi.status === "APPROVED") {
    try {
      await sendPoiApprovedEmail({
        to: updatedPoi.owner.email,
        vendorName: updatedPoi.owner.name,
        poiName: updatedPoi.name,
      });
      mailSent = true;
    } catch (error) {
      console.error("[POI_MAIL][APPROVED]", error);
    }
  }

  if (updatedPoi.status === "REJECTED") {
    try {
      await sendPoiRejectedEmail({
        to: updatedPoi.owner.email,
        vendorName: updatedPoi.owner.name,
        poiName: updatedPoi.name,
        reason: updatedPoi.rejectionReason ?? "(không có lý do)",
      });
      mailSent = true;
    } catch (error) {
      console.error("[POI_MAIL][REJECTED]", error);
    }
  }

  return NextResponse.json({ ok: true, poi: updatedPoi, mailSent });
}
