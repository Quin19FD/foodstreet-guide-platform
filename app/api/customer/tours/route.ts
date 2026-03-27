import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

export const runtime = "nodejs";

const CACHE_TTL_MS = 20_000;
const MAX_CACHE_ENTRIES = 120;

type TourSummaryItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  durationMinutes: number | null;
  updatedAt: Date;
  poiCount: number;
};

const responseCache = new Map<string, { expiresAt: number; data: { tours: TourSummaryItem[] } }>();

function toCacheKey(q: string, take: number) {
  return `${q.toLowerCase()}|${take}`;
}

function getCachedResponse(key: string): { tours: TourSummaryItem[] } | null {
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return cached.data;
}

function setCachedResponse(key: string, data: { tours: TourSummaryItem[] }) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
  responseCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data });
}

function mapTour(tour: {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  durationMinutes: number | null;
  updatedAt: Date;
  _count: { tourPois: number };
  tourPois: Array<{
    poi: {
      images: Array<{ imageUrl: string }>;
    };
  }>;
}): TourSummaryItem {
  return {
    id: tour.id,
    name: tour.name,
    description: tour.description,
    imageUrl: tour.imageUrl ?? tour.tourPois[0]?.poi.images[0]?.imageUrl ?? null,
    durationMinutes: tour.durationMinutes,
    updatedAt: tour.updatedAt,
    poiCount: tour._count.tourPois,
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? "30") || 30, 1), 120);
  const cacheKey = toCacheKey(q, take);
  const cached = getCachedResponse(cacheKey);

  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=45" },
    });
  }

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
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      durationMinutes: true,
      updatedAt: true,
      _count: {
        select: {
          tourPois: {
            where: {
              poi: {
                status: "APPROVED",
                isActive: true,
              },
            },
          },
        },
      },
      tourPois: {
        where: {
          poi: {
            status: "APPROVED",
            isActive: true,
          },
        },
        orderBy: { stopOrder: "asc" },
        take: 1,
        select: {
          poi: {
            select: {
              images: {
                take: 1,
                orderBy: { id: "asc" },
                select: { imageUrl: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take,
  });

  const payload = { tours: tours.map(mapTour) };
  setCachedResponse(cacheKey, payload);

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=45" },
  });
}
