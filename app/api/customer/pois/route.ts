import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/infrastructure/database/prisma/client";

import { haversineMeters, inferPoiType } from "../_shared";

export const runtime = "nodejs";

const CACHE_TTL_MS = 15_000;
const MAX_CACHE_ENTRIES = 180;
const SUMMARY_RADIUS_KM = 8;
const MAP_RADIUS_KM = 6;

type PoiSummaryResponseItem = {
  id: string;
  name: string;
  description: string;
  type: "FOOD_STALL" | "SUPPORTING_FACILITY";
  imageUrl: string | null;
  distanceMeters: number | null;
};

type PoiMapResponseItem = PoiSummaryResponseItem & {
  viNarration: string;
  availableLanguages: string[];
  languagesWithAudio: string[];
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  priorityScore: number | null;
};

const responseCache = new Map<
  string,
  {
    expiresAt: number;
    data: { pois: PoiSummaryResponseItem[] | PoiMapResponseItem[] };
  }
>();

function getCachedResponse(
  key: string
): { pois: PoiSummaryResponseItem[] | PoiMapResponseItem[] } | null {
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return cached.data;
}

function setCachedResponse(
  key: string,
  data: { pois: PoiSummaryResponseItem[] | PoiMapResponseItem[] }
) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }

  responseCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  });
}

function toCacheKey(input: {
  mode: "summary" | "map";
  q: string;
  take: number;
  lat: number | null;
  lng: number | null;
}) {
  const lat = input.lat == null ? "na" : input.lat.toFixed(4);
  const lng = input.lng == null ? "na" : input.lng.toFixed(4);
  return `${input.mode}|${input.q.toLowerCase()}|${input.take}|${lat}|${lng}`;
}

function locationBounds(lat: number, lng: number, radiusKm: number): Prisma.POIWhereInput {
  const latDelta = radiusKm / 111;
  const safeCos = Math.max(Math.abs(Math.cos((lat * Math.PI) / 180)), 0.2);
  const lngDelta = radiusKm / (111 * safeCos);

  return {
    latitude: {
      gte: lat - latDelta,
      lte: lat + latDelta,
    },
    longitude: {
      gte: lng - lngDelta,
      lte: lng + lngDelta,
    },
  };
}

function parseCoordinate(input: string | null): number | null {
  if (!input) return null;
  const value = Number(input);
  return Number.isFinite(value) ? value : null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const mode = url.searchParams.get("mode") === "map" ? "map" : "summary";
  const defaultTake = mode === "map" ? 80 : 36;
  const take = Math.min(
    Math.max(Number(url.searchParams.get("take") ?? String(defaultTake)) || defaultTake, 1),
    200
  );
  const lat = parseCoordinate(url.searchParams.get("lat"));
  const lng = parseCoordinate(url.searchParams.get("lng"));
  const cacheKey = toCacheKey({ mode, q, take, lat, lng });
  const cached = getCachedResponse(cacheKey);

  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" },
    });
  }

  const where: Prisma.POIWhereInput = {
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
    ...(lat != null && lng != null
      ? locationBounds(lat, lng, mode === "map" ? MAP_RADIUS_KM : SUMMARY_RADIUS_KM)
      : {}),
  };

  const pois = await prisma.pOI.findMany({
    where,
    select: {
      id: true,
      name: true,
      category: true,
      latitude: true,
      longitude: true,
      rating: true,
      images: {
        take: 1,
        orderBy: { id: "asc" },
        select: { imageUrl: true },
      },
      translations: {
        where: { language: "vi" },
        take: 1,
        select: {
          description: true,
          audioScript: true,
        },
      },
      menuItems: {
        take: 1,
        select: { id: true },
      },
    },
    take,
  });

  const poiIds = mode === "map" ? pois.map((poi) => poi.id) : [];
  const languageMeta =
    mode !== "map" || poiIds.length === 0
      ? []
      : await prisma.pOITranslation.findMany({
          where: { poiId: { in: poiIds } },
          select: {
            poiId: true,
            language: true,
            audios: {
              where: { isActive: true },
              take: 1,
              select: { id: true },
            },
          },
        });

  const languageMap = new Map<
    string,
    {
      available: Set<string>;
      audio: Set<string>;
    }
  >();

  if (mode === "map") {
    for (const item of languageMeta) {
      const key = item.poiId;
      const lang = item.language.toLowerCase();
      const bucket = languageMap.get(key) ?? {
        available: new Set<string>(),
        audio: new Set<string>(),
      };
      bucket.available.add(lang);
      if ((item.audios?.length ?? 0) > 0) bucket.audio.add(lang);
      languageMap.set(key, bucket);
    }
  }

  const result = pois
    .map((poi) => {
      const viTranslation = poi.translations[0] ?? null;

      const distanceMeters =
        lat != null &&
        lng != null &&
        typeof poi.latitude === "number" &&
        typeof poi.longitude === "number"
          ? haversineMeters(lat, lng, poi.latitude, poi.longitude)
          : null;

      if (mode !== "map") {
        return {
          id: poi.id,
          name: poi.name,
          description: viTranslation?.description?.trim() || `Khám phá ${poi.name}`,
          type: inferPoiType(poi.category),
          imageUrl: poi.images[0]?.imageUrl ?? null,
          distanceMeters,
        } satisfies PoiSummaryResponseItem;
      }

      const languageBucket = languageMap.get(poi.id);
      const priorityScore =
        distanceMeters != null
          ? distanceMeters - poi.rating * 120 - (poi.menuItems.length > 0 ? 30 : 0)
          : null;

      return {
        id: poi.id,
        name: poi.name,
        description: viTranslation?.description?.trim() || `Khám phá ${poi.name}`,
        viNarration:
          viTranslation?.audioScript?.trim() ||
          viTranslation?.description?.trim() ||
          `Bạn đang đến gần ${poi.name}`,
        availableLanguages: Array.from(languageBucket?.available ?? []),
        languagesWithAudio: Array.from(languageBucket?.audio ?? []),
        category: poi.category,
        type: inferPoiType(poi.category),
        latitude: poi.latitude,
        longitude: poi.longitude,
        imageUrl: poi.images[0]?.imageUrl ?? null,
        rating: poi.rating,
        distanceMeters,
        priorityScore,
      } satisfies PoiMapResponseItem;
    })
    .sort((a, b) => {
      if (
        "priorityScore" in a &&
        "priorityScore" in b &&
        a.priorityScore != null &&
        b.priorityScore != null
      ) {
        return a.priorityScore - b.priorityScore;
      }
      if (a.distanceMeters != null && b.distanceMeters != null)
        return a.distanceMeters - b.distanceMeters;
      if ("rating" in a && "rating" in b) {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        return ratingB - ratingA;
      }
      return 0;
    });

  const payload = { pois: result };
  setCachedResponse(cacheKey, payload);

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" },
  });
}
