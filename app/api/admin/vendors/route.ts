import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { randomUUID } from "node:crypto";
import { vendorCreateSchema } from "@/application/validators/admin-vendors";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";
import { hashPassword } from "@/infrastructure/security/password";
import { sendVendorApprovedEmail, sendVendorRejectedEmail } from "@/infrastructure/vendor/mailer";
import type { UserStatus } from "@prisma/client";

import { jsonError, requireAdmin } from "../session/_shared";

export const runtime = "nodejs";

/**
 * GET /api/admin/vendors
 * Query: ?q=&status=&includeInactive=&take=&skip=
 */
export async function GET(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const includeInactive = url.searchParams.get("includeInactive") === "1";
  const takeRaw = url.searchParams.get("take") ?? "50";
  const skipRaw = url.searchParams.get("skip") ?? "0";

  const take = Math.min(Math.max(Number(takeRaw) || 50, 1), 200);
  const skip = Math.max(Number(skipRaw) || 0, 0);

  const whereStatus: UserStatus | null =
    status === "PENDING" || status === "APPROVED" || status === "REJECTED"
      ? (status as UserStatus)
      : null;

  const where = {
    role: "VENDOR" as const,
    ...(includeInactive ? {} : { isActive: true }),
    ...(whereStatus ? { status: whereStatus } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, vendors] = await Promise.all([
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
        status: true,
        rejectionReason: true,
        approvedBy: true,
        approvedAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    }),
  ]);

  return NextResponse.json({ total, vendors, take, skip });
}

/**
 * POST /api/admin/vendors
 */
export async function POST(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const body = await request.json().catch(() => null);
  const parsed = vendorCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const input = parsed.data;
  const status = input.status ?? "PENDING";

  if (status === "REJECTED" && !input.rejectionReason) {
    return jsonError(400, "Vui lòng nhập lý do từ chối", { field: "rejectionReason" });
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return jsonError(409, "Email đã được sử dụng");

  const now = new Date();
  const passwordHash = await hashPassword(input.password);

  const vendor = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: input.email,
      password: passwordHash,
      name: input.name,
      phoneNumber: input.phoneNumber,
      avatarUrl: input.avatarUrl,
      role: "VENDOR",
      status,
      rejectionReason: status === "REJECTED" ? input.rejectionReason : null,
      approvedBy: status === "PENDING" ? null : adminResult.adminId,
      approvedAt: status === "PENDING" ? null : now,
      isActive: true,
    },
    select: {
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
    },
  });

  await logUserActivity({
    userId: adminResult.adminId,
    action: "ADMIN_VENDOR_CREATED",
    targetType: "USER",
    targetId: vendor.id,
    meta: { vendorEmail: vendor.email, status: vendor.status },
    request,
  });

  let mailSent = false;
  if (vendor.status === "APPROVED") {
    try {
      await sendVendorApprovedEmail({ to: vendor.email, vendorName: vendor.name });
      mailSent = true;
    } catch (error) {
      console.error("[VENDOR_MAIL][APPROVED]", error);
    }
  }

  if (vendor.status === "REJECTED") {
    try {
      await sendVendorRejectedEmail({
        to: vendor.email,
        vendorName: vendor.name,
        reason: vendor.rejectionReason ?? "(không có lý do)",
      });
      mailSent = true;
    } catch (error) {
      console.error("[VENDOR_MAIL][REJECTED]", error);
    }
  }

  return NextResponse.json({ ok: true, vendor, mailSent }, { status: 201 });
}
