import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const tour = await prisma.tour.findFirst({
    where: { id, isActive: true },
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
                orderBy: { id: "asc" },
                select: {
                  id: true,
                  imageUrl: true,
                },
              },
              translations: {
                where: { language: "vi" },
                take: 1,
                select: {
                  description: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tour) {
    return NextResponse.json({ error: "Không tìm thấy tour" }, { status: 404 });
  }

  return NextResponse.json({
    tour: {
      id: tour.id,
      name: tour.name,
      description: tour.description,
      imageUrl: tour.imageUrl ?? tour.tourPois[0]?.poi.images[0]?.imageUrl ?? null,
      durationMinutes: tour.durationMinutes,
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
    },
  });
}
