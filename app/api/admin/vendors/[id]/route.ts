import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { vendorDecisionSchema, vendorUpdateSchema } from "@/application/validators/admin-vendors";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";
import { sendVendorApprovedEmail, sendVendorRejectedEmail } from "@/infrastructure/vendor/mailer";

import { jsonError, requireAdmin } from "../../session/_shared";

export const runtime = "nodejs";

const vendorSelect = {
  id: true,
  email: true,
  name: true,
  phoneNumber: true,
  avatarUrl: true,
  status: true,
  rejectionReason: true,
  approvedBy: true,
  approvedAt: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
} as const;

/**
 * GET /api/admin/vendors/:id
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await context.params;

  const vendor = await prisma.user.findUnique({
    where: { id },
    select: {
      ...vendorSelect,
      role: true,
    },
  });

  if (!vendor || vendor.role !== "VENDOR") return jsonError(404, "Không tìm thấy vendor");

  return NextResponse.json({ vendor });
}

/**
 * PATCH /api/admin/vendors/:id
 * - Update thông tin (name, email, phoneNumber, avatarUrl, isActive)
 * - Duyệt / từ chối: { status: "APPROVED" } hoặc { status: "REJECTED", rejectionReason }
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await context.params;

  const vendor = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      rejectionReason: true,
      isActive: true,
    },
  });

  if (!vendor || vendor.role !== "VENDOR") return jsonError(404, "Không tìm thấy vendor");

  const body = await request.json().catch(() => null);

  const decisionParsed = vendorDecisionSchema.safeParse(body);
  if (decisionParsed.success) {
    const now = new Date();

    const updated = await prisma.user.update({
      where: { id: vendor.id },
      data:
        decisionParsed.data.status === "APPROVED"
          ? {
              status: "APPROVED",
              rejectionReason: null,
              approvedBy: adminResult.adminId,
              approvedAt: now,
              isActive: true,
            }
          : {
              status: "REJECTED",
              rejectionReason: decisionParsed.data.rejectionReason ?? vendor.rejectionReason,
              approvedBy: adminResult.adminId,
              approvedAt: now,
            },
      select: vendorSelect,
    });

    await logUserActivity({
      userId: adminResult.adminId,
      action: updated.status === "APPROVED" ? "ADMIN_VENDOR_APPROVED" : "ADMIN_VENDOR_REJECTED",
      targetType: "USER",
      targetId: updated.id,
      meta: { vendorEmail: updated.email, status: updated.status },
      request,
    });

    let mailSent = false;
    if (updated.status === "APPROVED") {
      try {
        await sendVendorApprovedEmail({ to: updated.email, vendorName: updated.name });
        mailSent = true;
      } catch (error) {
        console.error("[VENDOR_MAIL][APPROVED]", error);
      }
    }

    if (updated.status === "REJECTED") {
      try {
        await sendVendorRejectedEmail({
          to: updated.email,
          vendorName: updated.name,
          reason: updated.rejectionReason ?? "(không có lý do)",
        });
        mailSent = true;
      } catch (error) {
        console.error("[VENDOR_MAIL][REJECTED]", error);
      }
    }

    return NextResponse.json({ ok: true, vendor: updated, mailSent });
  }

  const updateParsed = vendorUpdateSchema.safeParse(body);
  if (!updateParsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: updateParsed.error.issues });
  }

  try {
    const shouldSyncPoiActive =
      typeof updateParsed.data.isActive === "boolean" &&
      updateParsed.data.isActive !== vendor.isActive;

    if (shouldSyncPoiActive) {
      const [updated, poiUpdated] = await prisma.$transaction([
        prisma.user.update({
          where: { id: vendor.id },
          data: {
            ...(typeof updateParsed.data.email === "string"
              ? { email: updateParsed.data.email }
              : {}),
            ...(typeof updateParsed.data.name === "string" ? { name: updateParsed.data.name } : {}),
            ...("phoneNumber" in updateParsed.data
              ? { phoneNumber: updateParsed.data.phoneNumber }
              : {}),
            ...("avatarUrl" in updateParsed.data ? { avatarUrl: updateParsed.data.avatarUrl } : {}),
            isActive: updateParsed.data.isActive,
          },
          select: vendorSelect,
        }),
        prisma.pOI.updateMany({
          where: { ownerId: vendor.id },
          data: { isActive: updateParsed.data.isActive },
        }),
      ]);

      await logUserActivity({
        userId: adminResult.adminId,
        action: updateParsed.data.isActive
          ? "ADMIN_VENDOR_ENABLED_WITH_POIS"
          : "ADMIN_VENDOR_DISABLED_WITH_POIS",
        targetType: "USER",
        targetId: updated.id,
        meta: { vendorEmail: updated.email, poiAffected: poiUpdated.count },
        request,
      });

      return NextResponse.json({ ok: true, vendor: updated, poiAffected: poiUpdated.count });
    }

    const updated = await prisma.user.update({
      where: { id: vendor.id },
      data: {
        ...(typeof updateParsed.data.email === "string" ? { email: updateParsed.data.email } : {}),
        ...(typeof updateParsed.data.name === "string" ? { name: updateParsed.data.name } : {}),
        ...("phoneNumber" in updateParsed.data
          ? { phoneNumber: updateParsed.data.phoneNumber }
          : {}),
        ...("avatarUrl" in updateParsed.data ? { avatarUrl: updateParsed.data.avatarUrl } : {}),
      },
      select: vendorSelect,
    });

    await logUserActivity({
      userId: adminResult.adminId,
      action: "ADMIN_VENDOR_UPDATED",
      targetType: "USER",
      targetId: updated.id,
      meta: { vendorEmail: updated.email },
      request,
    });

    return NextResponse.json({ ok: true, vendor: updated });
  } catch (error: unknown) {
    // Check for Prisma unique constraint violation via error code, not message content
    const prismaCode =
      error && typeof error === "object" && "code" in error ? (error as { code: string }).code : "";
    if (prismaCode === "P2002") {
      return jsonError(409, "Email đã được sử dụng");
    }
    console.error("[ADMIN_VENDOR_PATCH]", error);
    return jsonError(500, "Không thể cập nhật thông tin vendor");
  }
}

/**
 * DELETE /api/admin/vendors/:id
 * (Soft delete): set isActive=false
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await context.params;

  const vendor = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!vendor || vendor.role !== "VENDOR") return jsonError(404, "Không tìm thấy vendor");

  const [updated, poiUpdated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: vendor.id },
      data: {
        isActive: false,
        refreshTokenHash: null,
        refreshTokenExpiry: null,
      },
      select: vendorSelect,
    }),
    prisma.pOI.updateMany({
      where: { ownerId: vendor.id },
      data: { isActive: false },
    }),
  ]);

  await logUserActivity({
    userId: adminResult.adminId,
    action: "ADMIN_VENDOR_DISABLED_WITH_POIS",
    targetType: "USER",
    targetId: updated.id,
    meta: { vendorEmail: updated.email, poiAffected: poiUpdated.count },
    request,
  });

  return NextResponse.json({ ok: true, vendor: updated, poiAffected: poiUpdated.count });
}
