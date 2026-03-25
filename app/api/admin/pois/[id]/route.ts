import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { jsonError } from "../../session/_shared";
import { buildPoiDetailInclude, requireAdmin } from "../_shared";

export const runtime = "nodejs";

/**
 * GET /api/admin/pois/:id
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await context.params;

  const poi = await prisma.pOI.findUnique({
    where: { id },
    include: buildPoiDetailInclude(),
  });

  if (!poi) return jsonError(404, "Không tìm thấy POI");

  return NextResponse.json({ poi });
}
