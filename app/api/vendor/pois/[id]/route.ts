import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { poiUpdateSchema } from "@/application/validators/vendor-pois";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";

import {
  AUTH_COOKIES as VENDOR_AUTH_COOKIES,
  jsonError,
  verifyVendorAccessToken,
} from "../../auth/_shared";

export const runtime = "nodejs";

async function requireVendorAndOwnership(
  request: NextRequest,
  poiId: string,
): Promise<{ vendorId: string } | NextResponse> {
  const cookieToken =
    request.cookies.get(VENDOR_AUTH_COOKIES.access)?.value ?? null;
  if (!cookieToken) return jsonError(401, "Chưa đăng nhập");

  let payload: { sub: string };
  try {
    payload = verifyVendorAccessToken(cookieToken);
  } catch {
    return jsonError(401, "Phiên đăng nhập không hợp lệ");
  }

  const vendor = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!vendor) return jsonError(401, "Phiên đăng nhập không hợp lệ");
  if (vendor.role !== "VENDOR") return jsonError(403, "Không có quyền vendor");
  if (!vendor.isActive) return jsonError(403, "Tài khoản vendor đang bị khóa");
  if (vendor.status !== "APPROVED")
    return jsonError(403, "Tài khoản vendor chưa được phê duyệt");

  // Check ownership
  const poi = await prisma.pOI.findUnique({
    where: { id: poiId },
    select: { ownerId: true, status: true },
  });

  if (!poi) return jsonError(404, "Không tìm thấy POI");
  if (poi.ownerId !== vendor.id)
    return jsonError(403, "Không có quyền truy cập POI này");

  return { vendorId: vendor.id };
}

/**
 * GET /api/vendor/pois/:id
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const ownershipResult = await requireVendorAndOwnership(request, id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

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
 * PATCH /api/vendor/pois/:id
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const ownershipResult = await requireVendorAndOwnership(request, id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  const poi = await prisma.pOI.findUnique({
    where: { id },
    select: { status: true, submitCount: true },
  });

  if (!poi) return jsonError(404, "Không tìm thấy POI");

  // Only allow updates if PENDING or REJECTED
  if (poi.status === "APPROVED") {
    return jsonError(403, "Không thể chỉnh sửa POI đã được phê duyệt");
  }

  const body = await request.json().catch(() => null);
  const parsed = poiUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", {
      issues: parsed.error.issues,
    });
  }

  const input = parsed.data;

  const updatedPoi = await prisma.pOI.update({
    where: { id },
    data: {
      ...input,
      status: "PENDING", // Reset to pending on update
      submitCount: poi.submitCount + 1,
      rejectionReason: null, // Clear rejection reason
      approvedBy: null,
      approvedAt: null,
    },
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
      submitCount: true,
      updatedAt: true,
    },
  });

  await logUserActivity({
    userId: ownershipResult.vendorId,
    action: "VENDOR_POI_UPDATED",
    targetType: "POI",
    targetId: id,
    meta: { poiName: updatedPoi.name, submitCount: updatedPoi.submitCount },
    request,
  });

  return NextResponse.json({ ok: true, poi: updatedPoi });
}

/**
 * DELETE /api/vendor/pois/:id
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const ownershipResult = await requireVendorAndOwnership(request, id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  const poi = await prisma.pOI.findUnique({
    where: { id },
    select: { status: true, name: true },
  });

  if (!poi) return jsonError(404, "Không tìm thấy POI");

  // Only allow deletion if not approved
  if (poi.status === "APPROVED") {
    return jsonError(403, "Không thể xóa POI đã được phê duyệt");
  }

  await prisma.pOI.delete({ where: { id } });

  await logUserActivity({
    userId: ownershipResult.vendorId,
    action: "VENDOR_POI_DELETED",
    targetType: "POI",
    targetId: id,
    meta: { poiName: poi.name },
    request,
  });

  return NextResponse.json({ ok: true });
}
