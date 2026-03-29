import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { requireAuth } from "@/infrastructure/security/auth";

export const runtime = "nodejs";

/**
 * GET /api/admin/media
 * List all media from POI images, Tour images, and User avatars
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, "ADMIN");
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(request.url);
  const type = url.searchParams.get("type")?.trim() ?? "all"; // all, poi, tour, user
  const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? "50") || 50, 1), 200);
  const skip = Math.max(Number(url.searchParams.get("skip") ?? "0") || 0, 0);

  try {
    const [poiImages, tours, users] = await Promise.all([
      // POI images
      type === "all" || type === "poi"
        ? prisma.pOIImage.findMany({
            take: type === "poi" ? take : undefined,
            skip: type === "poi" ? skip : undefined,
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
          })
        : [],

      // Tour images
      type === "all" || type === "tour"
        ? prisma.tour.findMany({
            where: { imageUrl: { not: null } },
            take: type === "tour" ? take : undefined,
            skip: type === "tour" ? skip : undefined,
            select: {
              id: true,
              name: true,
              imageUrl: true,
              updatedAt: true,
            },
            orderBy: [{ updatedAt: "desc" }],
          })
        : [],

      // User avatars
      type === "all" || type === "user"
        ? prisma.user.findMany({
            where: { avatarUrl: { not: null } },
            take: type === "user" ? take : undefined,
            skip: type === "user" ? skip : undefined,
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true,
              updatedAt: true,
            },
            orderBy: [{ id: "desc" }],
          })
        : [],
    ]);

    // Format media items
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

    // Sort by date descending
    mediaItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination for "all" type
    const total = mediaItems.length;
    const paginatedItems = type === "all" ? mediaItems.slice(skip, skip + take) : mediaItems;

    return NextResponse.json({
      total,
      media: paginatedItems,
      take,
      skip,
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json({ error: "Không thể tải danh sách media" }, { status: 500 });
  }
}
