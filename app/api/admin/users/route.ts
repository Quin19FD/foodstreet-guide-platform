import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import type { POIStatus, UserRole, UserStatus } from "@prisma/client";

import { adminUsersDeleteSchema, adminUsersPatchSchema } from "@/application/validators/admin";
import { jsonError, requireAdmin } from "../session/_shared";

export const runtime = "nodejs";

/**
 * GET /api/admin/users
 * Query: ?q=&role=&status=&includeInactive=&take=&skip=
 */
export async function GET(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const role = url.searchParams.get("role")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const includeInactive = url.searchParams.get("includeInactive") === "1";
  const takeRaw = url.searchParams.get("take") ?? "50";
  const skipRaw = url.searchParams.get("skip") ?? "0";

  const take = Math.min(Math.max(Number(takeRaw) || 50, 1), 200);
  const skip = Math.max(Number(skipRaw) || 0, 0);

  const whereRole: UserRole | null =
    role === "USER" || role === "VENDOR" || role === "ADMIN" ? (role as UserRole) : null;

  const whereStatus: UserStatus | null =
    status === "PENDING" || status === "APPROVED" || status === "REJECTED"
      ? (status as UserStatus)
      : null;

  const where = {
    ...(includeInactive ? {} : { isActive: true }),
    ...(whereRole ? { role: whereRole } : {}),
    ...(whereStatus ? { status: whereStatus } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
            { phoneNumber: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take,
      skip,
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        status: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            pois: true,
            reviews: true,
            favoritePois: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ total, users, take, skip });
}

/**
 * PATCH /api/admin/users
 * Body: { ids: string[], action: "activate" | "deactivate" | "approve" | "reject", rejectionReason?: string }
 */
export async function PATCH(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const body = await request.json().catch(() => null);
  const parsed = adminUsersPatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const { ids, action, rejectionReason } = parsed.data;

  const now = new Date();

  try {
    // Verify all users exist
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, name: true, role: true },
    });

    if (existingUsers.length !== ids.length) {
      return jsonError(404, "Một hoặc plusieurs users không tồn tại");
    }

    // Prevent admin from modifying themselves
    if (existingUsers.some((u) => u.id === adminResult.adminId)) {
      return jsonError(400, "Không thể thay đổi tài khoản của chính mình");
    }

    // Update users based on action
    let updateData: any = {};
    switch (action) {
      case "activate":
        updateData = { isActive: true };
        break;
      case "deactivate":
        updateData = { isActive: false };
        break;
      case "approve":
        updateData = {
          status: "APPROVED",
          approvedBy: adminResult.adminId,
          approvedAt: now,
        };
        break;
      case "reject":
        updateData = {
          status: "REJECTED",
          rejectionReason: rejectionReason || "Không đáp ứng yêu cầu",
          approvedBy: adminResult.adminId,
          approvedAt: now,
        };
        break;
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      updated: result.count,
      action,
      message: `Đã ${action === "activate" ? "kích hoạt" : action === "deactivate" ? "vô hiệu hóa" : action === "approve" ? "duyệt" : "từ chối"} ${result.count} user thành công`,
    });
  } catch (error) {
    console.error("[ADMIN_USERS_PATCH]", error);
    return jsonError(500, "Không thể cập nhật users");
  }
}

/**
 * DELETE /api/admin/users
 * Body: { ids: string[] }
 */
export async function DELETE(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const body = await request.json().catch(() => null);
  const parsed = adminUsersDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const { ids } = parsed.data;

  try {
    // Verify users exist and are not admins
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, name: true, role: true },
    });

    if (existingUsers.length !== ids.length) {
      return jsonError(404, "Một hoặc một số users không tồn tại");
    }

    // Prevent admin from deleting themselves
    if (existingUsers.some((u) => u.id === adminResult.adminId)) {
      return jsonError(400, "Không thể xóa tài khoản của chính mình");
    }

    // Prevent deleting other admins
    if (existingUsers.some((u) => u.role === "ADMIN")) {
      return jsonError(403, "Không thể xóa tài khoản admin khác");
    }

    // Delete users (cascade will handle related records)
    const result = await prisma.user.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      ok: true,
      deleted: result.count,
      message: `Đã xóa ${result.count} user thành công`,
    });
  } catch (error) {
    console.error("[ADMIN_USERS_DELETE]", error);
    return jsonError(500, "Không thể xóa users");
  }
}
