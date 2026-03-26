import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

export const runtime = "nodejs";

function mapTour(tour: {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  durationMinutes: number | null;
  updatedAt: Date;
  tourPois: Array<{
    id: string;
    stopOrder: number;
    poiId: string;
    poi: {
      id: string;
      name: string;
      category: string | null;
      latitude: number | null;
      longitude: number | null;
      images: Array<{ imageUrl: string }>;
      translations: Array<{ description: string | null }>;
    };
  }>;
}) {
  return {
    id: tour.id,
    name: tour.name,
    description: tour.description,
    imageUrl: tour.imageUrl ?? tour.tourPois[0]?.poi.images[0]?.imageUrl ?? null,
    durationMinutes: tour.durationMinutes,
    updatedAt: tour.updatedAt,
    poiCount: tour.tourPois.length,
    poiIds: tour.tourPois.map((item) => item.poiId),
    stops: tour.tourPois.map((item) => ({
      id: item.id,
      poiId: item.poiId,
      stopOrder: item.stopOrder,
      poi: {
        id: item.poi.id,
        name: item.poi.name,
        category: item.poi.category,
        latitude: item.poi.latitude,
        longitude: item.poi.longitude,
        imageUrl: item.poi.images[0]?.imageUrl ?? null,
        description: item.poi.translations[0]?.description ?? null,
      },
    })),
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? "100") || 100, 1), 200);

  const tours = await prisma.tour.findMany({
    where: {
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              {
                tourPois: {
                  some: {
                    poi: {
                      name: { contains: q, mode: "insensitive" },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      tourPois: {
        where: {
          poi: {
            status: "APPROVED",
            isActive: true,
          },
        },
        orderBy: { stopOrder: "asc" },
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
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take,
  });

  return NextResponse.json({ tours: tours.map(mapTour) });
}
