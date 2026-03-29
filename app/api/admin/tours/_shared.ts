import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  requireAuth,
  jsonError,
} from "@/infrastructure/security/auth";

export async function requireAdmin(
  request: NextRequest
): Promise<{ adminId: string } | NextResponse> {
  const result = await requireAuth(request, "ADMIN");
  if (result instanceof NextResponse) return result;
  return { adminId: result.userId };
}

export function buildTourInclude() {
  return {
    tourPois: {
      orderBy: [{ stopOrder: "asc" as const }],
      include: {
        poi: {
          select: {
            id: true,
            name: true,
            category: true,
            latitude: true,
            longitude: true,
            status: true,
            isActive: true,
          },
        },
      },
    },
  };
}

export function toTourResponse(tour: {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  durationMinutes: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tourPois: Array<{
    id: string;
    poiId: string;
    stopOrder: number;
    poi: {
      id: string;
      name: string;
      category: string | null;
      latitude: number | null;
      longitude: number | null;
      status: string;
      isActive: boolean;
    };
  }>;
}) {
  return {
    id: tour.id,
    name: tour.name,
    description: tour.description,
    imageUrl: tour.imageUrl,
    durationMinutes: tour.durationMinutes,
    isActive: tour.isActive,
    createdAt: tour.createdAt,
    updatedAt: tour.updatedAt,
    poiIds: tour.tourPois.map((item) => item.poiId),
    stops: tour.tourPois.map((item) => ({
      id: item.id,
      poiId: item.poiId,
      stopOrder: item.stopOrder,
      poi: item.poi,
    })),
  };
}
