import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { AUTH_COOKIES, jsonError, verifyCustomerAccessToken } from "../auth/_shared";

export const runtime = "nodejs";

function getBearerToken(request: NextRequest): string | null {
  const raw = request.headers.get("authorization");
  if (!raw) return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

/**
 * GET /api/customer/stats
 * Lấy thống kê hoạt động của user
 */
export async function GET(request: NextRequest) {
  const cookieToken = request.cookies.get(AUTH_COOKIES.access)?.value ?? null;
  const token = cookieToken ?? getBearerToken(request);
  if (!token) {
    return jsonError(401, "Chưa đăng nhập");
  }

  let payload: { sub: string; email: string; role: "USER" };
  try {
    payload = verifyCustomerAccessToken(token);
  } catch {
    return jsonError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, status: true, isActive: true },
  });

  if (!user || !user.isActive || user.role !== "USER" || user.status !== "APPROVED") {
    return jsonError(401, "Phiên đăng nhập không hợp lệ");
  }

  try {
    // Count unique POIs visited (from POIView)
    const visitedCount = await prisma.pOIView.groupBy({
      by: ["poiId"],
      where: {
        userId: user.id,
      },
      _count: {
        poiId: true,
      },
    });

    // Count favorites
    const favoriteCount = await prisma.favoritePOI.count({
      where: { userId: user.id },
    });

    // Count tours booked (from TourBooking if exists, or UserActivity)
    const tourBookings = await prisma.userActivity.count({
      where: {
        userId: user.id,
        action: "BOOK_TOUR",
      },
    });

    // Count reviews written
    const reviewCount = await prisma.userActivity.count({
      where: {
        userId: user.id,
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
