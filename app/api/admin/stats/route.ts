import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { jsonError, requireAdmin } from "../session/_shared";

export const runtime = "nodejs";

function getMonthStart(): Date {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * GET /api/admin/stats
 * Tổng hợp số liệu cho dashboard và analytics admin.
 */
export async function GET(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  try {
    const monthStart = getMonthStart();

    const [
      totalPOIs,
      pendingPOIs,
      approvedPOIs,
      rejectedPOIs,
      activePOIs,
      totalTours,
      activeTours,
      totalUsers,
      totalVendors,
      totalAdmins,
      totalFavorites,
      totalReviews,
      totalTranslations,
      totalAudioGuides,
      totalPageViews,
      totalPOIViews,
      recentPOIs,
      recentTours,
    ] = await Promise.all([
      prisma.pOI.count(),
      prisma.pOI.count({ where: { status: "PENDING" } }),
      prisma.pOI.count({ where: { status: "APPROVED" } }),
      prisma.pOI.count({ where: { status: "REJECTED" } }),
      prisma.pOI.count({ where: { status: "APPROVED", isActive: true } }),
      prisma.tour.count(),
      prisma.tour.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "VENDOR", isActive: true } }),
      prisma.user.count({ where: { role: "ADMIN", isActive: true } }),
      prisma.favoritePOI.count(),
      prisma.review.count(),
      prisma.pOITranslation.count(),
      prisma.pOIAudio.count(),
      prisma.pageView.count(),
      prisma.pOIView.count(),
      prisma.pOI.findMany({
        orderBy: [{ updatedAt: "desc" }],
        take: 5,
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
          isActive: true,
          updatedAt: true,
        },
      }),
      prisma.tour.findMany({
        orderBy: [{ updatedAt: "desc" }],
        take: 5,
        select: {
          id: true,
          name: true,
          isActive: true,
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalPOIs,
        pendingPOIs,
        approvedPOIs,
        rejectedPOIs,
        activePOIs,
        totalTours,
        activeTours,
        totalUsers,
        totalVendors,
        totalAdmins,
        totalFavorites,
        totalReviews,
        totalTranslations,
        totalAudioGuides,
        totalPageViews,
        totalPOIViews,
      },
      recentPOIs,
      recentTours,
      period: {
        monthStart: monthStart.toISOString(),
      },
    });
  } catch (error) {
    console.error("[ADMIN_STATS_GET]", error);
    return jsonError(500, "Không thể tải thống kê admin");
  }
}
