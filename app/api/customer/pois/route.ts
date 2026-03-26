import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { haversineMeters, inferPoiType } from "../_shared";

export const runtime = "nodejs";

function parseCoordinate(input: string | null): number | null {
  if (!input) return null;
  const value = Number(input);
  return Number.isFinite(value) ? value : null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? "100") || 100, 1), 200);
  const lat = parseCoordinate(url.searchParams.get("lat"));
  const lng = parseCoordinate(url.searchParams.get("lng"));

  const pois = await prisma.pOI.findMany({
    where: {
      status: "APPROVED",
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
              {
                translations: {
                  some: {
                    OR: [
                      { name: { contains: q, mode: "insensitive" } },
                      { description: { contains: q, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      images: {
        take: 1,
        orderBy: { id: "asc" },
      },
      translations: {
        select: {
          language: true,
          description: true,
          audioScript: true,
          audios: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      },
      _count: {
        select: {
          menuItems: true,
          reviews: true,
        },
      },
    },
    take,
  });

  const result = pois
    .map((poi) => {
      const viTranslation = poi.translations.find((item) => item.language.toLowerCase() === "vi") ?? null;

      const distanceMeters =
        lat != null && lng != null && typeof poi.latitude === "number" && typeof poi.longitude === "number"
          ? haversineMeters(lat, lng, poi.latitude, poi.longitude)
          : null;

      const priorityScore =
        distanceMeters != null
          ? distanceMeters - poi.rating * 120 - (poi._count.menuItems > 0 ? 30 : 0)
          : null;

      return {
        id: poi.id,
        name: poi.name,
        description: viTranslation?.description?.trim() || `Khám phá ${poi.name}`,
        viNarration:
          viTranslation?.audioScript?.trim() ||
          viTranslation?.description?.trim() ||
          `Bạn đang đến gần ${poi.name}`,
        availableLanguages: poi.translations.map((item) => item.language.toLowerCase()),
        languagesWithAudio: poi.translations
          .filter((item) => (item.audios?.length ?? 0) > 0)
          .map((item) => item.language.toLowerCase()),
        category: poi.category,
        type: inferPoiType(poi.category),
        latitude: poi.latitude,
        longitude: poi.longitude,
        imageUrl: poi.images[0]?.imageUrl ?? null,
        rating: poi.rating,
        distanceMeters,
        priorityScore,
      };
    })
    .sort((a, b) => {
      if (a.priorityScore != null && b.priorityScore != null) return a.priorityScore - b.priorityScore;
      if (a.distanceMeters != null && b.distanceMeters != null) return a.distanceMeters - b.distanceMeters;
      return b.rating - a.rating;
    });

  return NextResponse.json({ pois: result });
}
