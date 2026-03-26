import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { inferPoiType } from "../_shared";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const type = (url.searchParams.get("type")?.trim().toLowerCase() ?? "all") as
    | "poi"
    | "tour"
    | "all";

  if (!q) return NextResponse.json({ pois: [], tours: [] });

  const [pois, tours] = await Promise.all([
    type === "tour"
      ? Promise.resolve([])
      : prisma.pOI.findMany({
          where: {
            status: "APPROVED",
            isActive: true,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          },
          include: {
            images: { take: 1, orderBy: { id: "asc" } },
          },
          take: 30,
        }),
    type === "poi"
      ? Promise.resolve([])
      : prisma.tour.findMany({
          where: {
            isActive: true,
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
          },
          include: {
            tourPois: {
              where: {
                poi: {
                  status: "APPROVED",
                  isActive: true,
                },
              },
              include: {
                poi: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { stopOrder: "asc" },
            },
          },
          take: 30,
        }),
  ]);

  return NextResponse.json({
    pois: pois.map((poi) => ({
      id: poi.id,
      name: poi.name,
      category: poi.category,
      type: inferPoiType(poi.category),
      imageUrl: poi.images[0]?.imageUrl ?? null,
    })),
    tours: tours.map((tour) => ({
      id: tour.id,
      name: tour.name,
      description: tour.description,
      poiCount: tour.tourPois.length,
      poiNames: tour.tourPois.map((item) => item.poi.name),
    })),
  });
}
