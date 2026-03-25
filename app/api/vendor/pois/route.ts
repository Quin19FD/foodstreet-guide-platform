import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  poiCreateSchema,
  poiUpdateSchema,
} from "@/application/validators/vendor-pois";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";
import { randomUUID } from "node:crypto";

import {
  AUTH_COOKIES as VENDOR_AUTH_COOKIES,
  jsonError,
  verifyVendorAccessToken,
} from "../auth/_shared";

export const runtime = "nodejs";

async function requireVendor(
  request: NextRequest,
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

  return { vendorId: vendor.id };
}

/**
 * GET /api/vendor/pois
 * Query: ?status=&take=&skip=
 */
export async function GET(request: NextRequest) {
  const vendorResult = await requireVendor(request);
  if (vendorResult instanceof NextResponse) return vendorResult;

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() ?? "";
  const takeRaw = url.searchParams.get("take") ?? "50";
  const skipRaw = url.searchParams.get("skip") ?? "0";

  const take = Math.min(Math.max(Number(takeRaw) || 50, 1), 200);
  const skip = Math.max(Number(skipRaw) || 0, 0);

  const whereStatus: "PENDING" | "APPROVED" | "REJECTED" | null =
    status === "PENDING" || status === "APPROVED" || status === "REJECTED"
      ? (status as "PENDING" | "APPROVED" | "REJECTED")
      : null;

  const where = {
    ownerId: vendorResult.vendorId,
    ...(whereStatus ? { status: whereStatus } : {}),
  };

  const [total, pois] = await Promise.all([
    prisma.pOI.count({ where }),
    prisma.pOI.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take,
      skip,
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

/**
 * POST /api/vendor/pois
 */
export async function POST(request: NextRequest) {
  const vendorResult = await requireVendor(request);
  if (vendorResult instanceof NextResponse) return vendorResult;

  const body = await request.json().catch(() => null);
  const parsed = poiCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", {
      issues: parsed.error.issues,
    });
  }

  const input = parsed.data;

  const poi = await prisma.pOI.create({
    data: {
      id: randomUUID(),
      ownerId: vendorResult.vendorId,
      name: input.name,
      slug: input.slug,
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      priceMin: input.priceMin,
      priceMax: input.priceMax,
      rating: 0,
      status: "PENDING",
      submitCount: 1,
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
      createdAt: true,
      updatedAt: true,
    },
  });

  await logUserActivity({
    userId: vendorResult.vendorId,
    action: "VENDOR_POI_CREATED",
    targetType: "POI",
    targetId: poi.id,
    meta: { poiName: poi.name },
    request,
  });

  return NextResponse.json({ ok: true, poi }, { status: 201 });
}
