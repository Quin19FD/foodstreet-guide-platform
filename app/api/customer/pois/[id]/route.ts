import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { inferPoiType } from "../../_shared";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const poi = await prisma.pOI.findFirst({
    where: {
      id,
      status: "APPROVED",
      isActive: true,
    },
    include: {
      images: {
        orderBy: { id: "asc" },
      },
      menuItems: {
        where: { isAvailable: true },
        orderBy: { createdAt: "asc" },
      },
      translations: {
        orderBy: { language: "asc" },
        include: {
          audios: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });

  if (!poi) {
    return NextResponse.json({ error: "Không tìm thấy POI" }, { status: 404 });
  }

  const viTranslation =
    poi.translations.find((item) => item.language.toLowerCase() === "vi") ?? null;

  return NextResponse.json({
    poi: {
      id: poi.id,
      name: poi.name,
      description: viTranslation?.description ?? null,
      category: poi.category,
      type: inferPoiType(poi.category),
      latitude: poi.latitude,
      longitude: poi.longitude,
      rating: poi.rating,
      updatedAt: poi.updatedAt.toISOString(),
      version: Date.parse(poi.updatedAt.toISOString()),
      images: poi.images.map((image) => ({
        id: image.id,
        imageUrl: image.imageUrl,
        description: image.description,
      })),
      menuItems: poi.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
      })),
      translations: poi.translations.map((translation) => ({
        id: translation.id,
        language: translation.language,
        name: translation.name,
        description: translation.description,
        audioScript: translation.audioScript,
        updatedAt: translation.updatedAt.toISOString(),
        audios: translation.audios.map((audio) => ({
          id: audio.id,
          audioUrl: audio.audioUrl,
        })),
      })),
      reviews: poi.reviews,
    },
  });
}
