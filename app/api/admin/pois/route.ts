import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import type { POIStatus } from "@prisma/client";

import { jsonError } from "../session/_shared";
import { buildPoiDetailInclude, requireAdmin } from "./_shared";

export const runtime = "nodejs";

/**
 * GET /api/admin/pois
 */
export async function GET(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const includeLocked = url.searchParams.get("includeLocked") === "1";
  const statusRaw = url.searchParams.get("status")?.trim() ?? "";
  const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? "20") || 20, 1), 200);
  const skip = Math.max(Number(url.searchParams.get("skip") ?? "0") || 0, 0);

  const status: POIStatus | null =
    statusRaw === "PENDING" || statusRaw === "APPROVED" || statusRaw === "REJECTED"
      ? statusRaw
      : null;

  const where = {
    ...(status ? { status } : {}),
    ...(ownerId ? { ownerId } : {}),
    ...(includeLocked ? {} : { isActive: true }),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [total, pois] = await Promise.all([
    prisma.pOI.count({ where }),
    prisma.pOI.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take,
      skip,
      include: buildPoiDetailInclude(),
    }),
  ]);

  return NextResponse.json({ total, pois, take, skip });
}

/**
 * POST /api/admin/pois
 */
export async function POST() {
  return jsonError(405, "Không hỗ trợ tạo POI từ API admin. Vui lòng dùng luồng vendor.");
}


