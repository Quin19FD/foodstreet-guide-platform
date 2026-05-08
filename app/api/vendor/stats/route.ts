import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { jsonError } from "../auth/_shared";
import { requireVendor } from "../pois/_shared";

export const runtime = "nodejs";

function getMonthStart(): Date {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function GET(request: NextRequest) {
  const vendorResult = await requireVendor(request);
  if (vendorResult instanceof NextResponse) return vendorResult;

  try {
    const vendorId = vendorResult.vendorId;
    const monthStart = getMonthStart();

    const poiWhere = { ownerId: vendorId };
    const approvedPoiWhere = { ownerId: vendorId, status: "APPROVED" as const };
    const activeApprovedPoiWhere = {
      ownerId: vendorId,
      status: "APPROVED" as const,
      isActive: true,
    };

    const [
      totalPOIs,
      approvedPOIs,
      pendingPOIs,
      rejectedPOIs,
      activeApprovedPOIs,
      totalProducts,
      activeProducts,
      totalViews,
      thisMonthViews,
      totalFavorites,
      totalReviews,
      totalTranslations,
      totalAudioGuides,
      recentPOIs,
    ] = await Promise.all([
      prisma.pOI.count({ where: poiWhere }),
      prisma.pOI.count({ where: approvedPoiWhere }),
      prisma.pOI.count({ where: { ownerId: vendorId, status: "PENDING" } }),
      prisma.pOI.count({ where: { ownerId: vendorId, status: "REJECTED" } }),
      prisma.pOI.count({ where: activeApprovedPoiWhere }),
      prisma.menuItem.count({ where: { poi: { ownerId: vendorId } } }),
      prisma.menuItem.count({ where: { poi: { ownerId: vendorId }, isAvailable: true } }),
      prisma.pOIView.count({ where: { poi: { ownerId: vendorId } } }),
      prisma.pOIView.count({ where: { poi: { ownerId: vendorId }, createdAt: { gte: monthStart } } }),
      prisma.favoritePOI.count({ where: { poi: { ownerId: vendorId } } }),
      prisma.review.count({ where: { poi: { ownerId: vendorId } } }),
      prisma.pOITranslation.count({ where: { poi: { ownerId: vendorId } } }),
      prisma.pOIAudio.count({ where: { translation: { poi: { ownerId: vendorId } } } }),
      prisma.pOI.findMany({
        where: poiWhere,
        orderBy: [{ updatedAt: "desc" }],
        take: 8,
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalPOIs,
        approvedPOIs,
        pendingPOIs,
        rejectedPOIs,
        totalProducts,
        activeProducts,
        totalViews,
        thisMonthViews,
        totalFavorites,
        totalReviews,
        totalTranslations,
        totalAudioGuides,
      },
      recentPOIs,
      summary: {
        activePOIs: activeApprovedPOIs,
      },
    });
  } catch (error) {
    console.error("[VENDOR_STATS_GET]", error);
    return jsonError(500, "Không thể tải dữ liệu dashboard vendor");
  }
}
