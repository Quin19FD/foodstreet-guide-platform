import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { randomUUID } from "node:crypto";
import { vendorCreatePoiSchema } from "@/application/validators/poi-management";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";
import type { POIStatus } from "@prisma/client";

import { jsonError } from "../auth/_shared";
import { buildPoiDetailInclude, requireVendor } from "./_shared";

export const runtime = "nodejs";

/**
 * GET /api/vendor/pois
 */
export async function GET(request: NextRequest) {
  const vendorResult = await requireVendor(request);
  if (vendorResult instanceof NextResponse) return vendorResult;

  const url = new URL(request.url);
  const statusRaw = url.searchParams.get("status")?.trim() ?? "";
  const includeLocked = url.searchParams.get("includeLocked") === "1";
  const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? "20") || 20, 1), 200);
  const skip = Math.max(Number(url.searchParams.get("skip") ?? "0") || 0, 0);

  const status: POIStatus | null =
    statusRaw === "PENDING" || statusRaw === "APPROVED" || statusRaw === "REJECTED"
      ? statusRaw
      : null;

  const where = {
    ownerId: vendorResult.vendorId,
    ...(status ? { status } : {}),
    ...(includeLocked ? {} : { isActive: true }),
  };

  const [total, pois] = await Promise.all([
    prisma.pOI.count({ where }),
    prisma.pOI.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take,
      skip,
      include: buildPoiDetailInclude(),
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
  const parsed = vendorCreatePoiSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const input = parsed.data;

  if (
    typeof input.priceMin === "number" &&
    typeof input.priceMax === "number" &&
    input.priceMin > input.priceMax
  ) {
    return jsonError(400, "Khoảng giá không hợp lệ", { field: "priceMin" });
  }

  const poi = await prisma.$transaction(async (tx) => {
    const created = await tx.pOI.create({
      data: {
        id: randomUUID(),
        ownerId: vendorResult.vendorId,
        name: input.name,
        slug: input.slug ?? null,
        category: input.category ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        priceMin: input.priceMin ?? null,
        priceMax: input.priceMax ?? null,
        status: "PENDING",
        rejectionReason: null,
        approvedBy: null,
        approvedAt: null,
        submitCount: 1,
      },
    });

    if (input.images?.length) {
      await tx.pOIImage.createMany({
        data: input.images.map((image) => ({
          id: randomUUID(),
          poiId: created.id,
          imageUrl: image.imageUrl,
          description: image.description ?? null,
        })),
      });
    }

    if (input.menuItems?.length) {
      await tx.menuItem.createMany({
        data: input.menuItems.map((menuItem) => ({
          id: randomUUID(),
          poiId: created.id,
          name: menuItem.name,
          description: menuItem.description ?? null,
          price: menuItem.price ?? null,
          imageUrl: menuItem.imageUrl ?? null,
          isAvailable: menuItem.isAvailable ?? true,
        })),
      });
    }

    await tx.pOITranslation.create({
      data: {
        id: randomUUID(),
        poiId: created.id,
        language: "vi",
        name: input.viTranslation.name ?? input.name,
        description: input.viTranslation.description,
        audioScript: input.viTranslation.audioScript ?? null,
      },
    });

    return tx.pOI.findUniqueOrThrow({
      where: { id: created.id },
      include: buildPoiDetailInclude(),
    });
  });

  await logUserActivity({
    userId: vendorResult.vendorId,
    action: "VENDOR_POI_CREATED_AND_SUBMITTED",
    targetType: "POI",
    targetId: poi.id,
    meta: { poiName: poi.name },
    request,
  });

  return NextResponse.json({ ok: true, poi }, { status: 201 });
}

