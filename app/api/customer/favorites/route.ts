import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { jsonError, requireAuth } from "@/infrastructure/security/auth";

import { inferPoiType } from "../_shared";

export const runtime = "nodejs";

/**
 * GET /api/customer/favorites
 * Lấy danh sách POI yêu thích của user
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "USER");
  if (auth instanceof NextResponse) return auth;

  // Get favorite POIs
  const favorites = await prisma.favoritePOI.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    include: {
      poi: {
        select: {
          id: true,
          name: true,
          category: true,
          latitude: true,
          longitude: true,
          images: {
            take: 1,
            orderBy: { id: "asc" },
            select: { imageUrl: true },
          },
          translations: {
            where: { language: "vi" },
            take: 1,
            select: { description: true },
          },
        },
      },
    },
  });

  const result = favorites
    .map((fav) => {
      const poi = fav.poi;
      if (!poi) return null;

      const viTranslation = poi.translations[0] ?? null;

      return {
        id: poi.id,
        name: poi.name,
        description: viTranslation?.description ?? `Khám phá ${poi.name}`,
        type: inferPoiType(poi.category),
        category: poi.category,
        imageUrl: poi.images[0]?.imageUrl ?? null,
        latitude: poi.latitude,
        longitude: poi.longitude,
        favoritedAt: fav.createdAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return NextResponse.json({
    favorites: result,
    total: result.length,
  });
}

/**
 * POST /api/customer/favorites
 * Thêm POI vào danh sách yêu thích
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "USER");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { poiId } = body as { poiId?: string };

    if (!poiId || typeof poiId !== "string") {
      return jsonError(400, "poiId là bắt buộc");
    }

    // Check if POI exists
    const poi = await prisma.pOI.findUnique({
      where: { id: poiId },
      select: { id: true, status: true, isActive: true },
    });

    if (!poi || !poi.isActive || poi.status !== "APPROVED") {
      return jsonError(404, "POI không tồn tại");
    }

    // Check if already favorited
    const existing = await prisma.favoritePOI.findUnique({
      where: {
        userId_poiId: {
          userId: auth.userId,
          poiId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "POI đã có trong danh sách yêu thích", favorite: existing },
        { status: 200 }
      );
    }

    // Create favorite - generate UUID for id
    const favorite = await prisma.favoritePOI.create({
      data: {
        id: crypto.randomUUID(),
        userId: auth.userId,
        poiId,
      },
    });

    return NextResponse.json(
      { message: "Đã thêm vào danh sách yêu thích", favorite },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating favorite:", error);
    return jsonError(500, "Lỗi khi thêm vào danh sách yêu thích");
  }
}

/**
 * DELETE /api/customer/favorites
 * Xóa POI khỏi danh sách yêu thích
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request, "USER");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { poiId } = body as { poiId?: string };

    if (!poiId || typeof poiId !== "string") {
      return jsonError(400, "poiId là bắt buộc");
    }

    // Delete favorite
    const deleted = await prisma.favoritePOI.deleteMany({
      where: {
        userId: auth.userId,
        poiId,
      },
    });

    if (deleted.count === 0) {
      return jsonError(404, "POI không có trong danh sách yêu thích");
    }

    return NextResponse.json({ message: "Đã xóa khỏi danh sách yêu thích" });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    return jsonError(500, "Lỗi khi xóa khỏi danh sách yêu thích");
  }
}
