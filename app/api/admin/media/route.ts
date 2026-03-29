import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { requireAuth } from "@/infrastructure/security/auth";

export const runtime = "nodejs";

/**
 * GET /api/admin/media
 * List media from POI images, Tour images, and User avatars with database-level pagination.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, "ADMIN");
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(request.url);
  const type = url.searchParams.get("type")?.trim() ?? "all"; // all, poi, tour, user
  const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? "50") || 50, 1), 200);
  const skip = Math.max(Number(url.searchParams.get("skip") ?? "0") || 0, 0);

  try {
    // When a specific type is requested, paginate that single source
    if (type === "poi") {
      const [items, total] = await Promise.all([
        prisma.pOIImage.findMany({
          take,
          skip,
          include: {
            poi: {
              select: {
                id: true,
                name: true,
                category: true,
                updatedAt: true,
              },
            },
          },
          orderBy: [{ id: "desc" }],
        }),
        prisma.pOIImage.count(),
      ]);

      const media = items.map((img) => ({
        id: `poi-${img.id}`,
        type: "poi" as const,
        url: img.imageUrl,
        thumbnail: img.imageUrl,
        description: img.description ?? undefined,
        relatedId: img.poiId,
        relatedName: img.poi.name,
        relatedCategory: img.poi.category ?? undefined,
        createdAt: img.poi?.updatedAt?.toISOString() ?? new Date().toISOString(),
      }));

      return NextResponse.json({ total, media, take, skip });
    }

    if (type === "tour") {
      const [items, total] = await Promise.all([
        prisma.tour.findMany({
          where: { imageUrl: { not: null } },
          take,
          skip,
          select: {
            id: true,
            name: true,
            imageUrl: true,
            updatedAt: true,
          },
          orderBy: [{ updatedAt: "desc" }],
        }),
        prisma.tour.count({ where: { imageUrl: { not: null } } }),
      ]);

      const media = items
        .filter((t) => t.imageUrl)
        .map((tour) => ({
          id: `tour-${tour.id}`,
          type: "tour" as const,
          url: tour.imageUrl!,
          thumbnail: tour.imageUrl!,
          description: tour.name,
          relatedId: tour.id,
          relatedName: tour.name,
          createdAt: tour.updatedAt.toISOString(),
        }));

      return NextResponse.json({ total, media, take, skip });
    }

    if (type === "user") {
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where: { avatarUrl: { not: null } },
          take,
          skip,
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            updatedAt: true,
          },
          orderBy: [{ id: "desc" }],
        }),
        prisma.user.count({ where: { avatarUrl: { not: null } } }),
      ]);

      const media = items
        .filter((u) => u.avatarUrl)
        .map((user) => ({
          id: `user-${user.id}`,
          type: "user" as const,
          url: user.avatarUrl!,
          thumbnail: user.avatarUrl!,
          description: `${user.name} (${user.role})`,
          relatedId: user.id,
          relatedName: user.name,
          createdAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),
        }));

      return NextResponse.json({ total, media, take, skip });
    }

    // type === "all": paginate each table independently at the database level
    const [poiImages, tours, users, poiCount, tourCount, userCount] = await Promise.all([
      prisma.pOIImage.findMany({
        take,
        skip,
        include: {
          poi: {
            select: {
              id: true,
              name: true,
              category: true,
              updatedAt: true,
            },
          },
        },
        orderBy: [{ id: "desc" }],
      }),

      prisma.tour.findMany({
        where: { imageUrl: { not: null } },
        take,
        skip,
        select: {
          id: true,
          name: true,
          imageUrl: true,
          updatedAt: true,
        },
        orderBy: [{ updatedAt: "desc" }],
      }),

      prisma.user.findMany({
        where: { avatarUrl: { not: null } },
        take,
        skip,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
          updatedAt: true,
        },
        orderBy: [{ id: "desc" }],
      }),

      prisma.pOIImage.count(),
      prisma.tour.count({ where: { imageUrl: { not: null } } }),
      prisma.user.count({ where: { avatarUrl: { not: null } } }),
    ]);

    const mediaItems = [
      ...poiImages.map((img) => ({
        id: `poi-${img.id}`,
        type: "poi" as const,
        url: img.imageUrl,
        thumbnail: img.imageUrl,
        description: img.description ?? undefined,
        relatedId: img.poiId,
        relatedName: img.poi.name,
        relatedCategory: img.poi.category ?? undefined,
        createdAt: img.poi?.updatedAt?.toISOString() ?? new Date().toISOString(),
      })),

      ...tours
        .filter((t) => t.imageUrl)
        .map((tour) => ({
          id: `tour-${tour.id}`,
          type: "tour" as const,
          url: tour.imageUrl!,
          thumbnail: tour.imageUrl!,
          description: tour.name,
          relatedId: tour.id,
          relatedName: tour.name,
          createdAt: tour.updatedAt.toISOString(),
        })),

      ...users
        .filter((u) => u.avatarUrl)
        .map((user) => ({
          id: `user-${user.id}`,
          type: "user" as const,
          url: user.avatarUrl!,
          thumbnail: user.avatarUrl!,
          description: `${user.name} (${user.role})`,
          relatedId: user.id,
          relatedName: user.name,
          createdAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),
        })),
    ];

    // Sort by date descending (bounded to at most take*3 items — safe in memory)
    mediaItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      total: poiCount + tourCount + userCount,
      media: mediaItems,
      take,
      skip,
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json({ error: "Không thể tải danh sách media" }, { status: 500 });
  }
}
