import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { jsonError, requireAuth } from "@/infrastructure/security/auth";

export const runtime = "nodejs";

/**
 * GET /api/customer/stats
 * Lấy thống kê hoạt động của user
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "USER");
  if (auth instanceof NextResponse) return auth;

  try {
    // Count unique POIs visited (from POIView)
    const visitedCount = await prisma.pOIView.groupBy({
      by: ["poiId"],
      where: {
        userId: auth.userId,
      },
      _count: {
        poiId: true,
      },
    });

    // Count favorites
    const favoriteCount = await prisma.favoritePOI.count({
      where: { userId: auth.userId },
    });

    // Count tours booked (from UserActivity)
    const tourBookings = await prisma.userActivity.count({
      where: {
        userId: auth.userId,
        action: "BOOK_TOUR",
      },
    });

    // Count reviews written
    const reviewCount = await prisma.userActivity.count({
      where: {
        userId: auth.userId,
        action: "REVIEW_POI",
      },
    });

    return NextResponse.json({
      stats: {
        visitedCount: visitedCount.length,
        favoriteCount,
        tourBookings,
        reviewCount,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return jsonError(500, "Lỗi khi lấy thống kê");
  }
}
