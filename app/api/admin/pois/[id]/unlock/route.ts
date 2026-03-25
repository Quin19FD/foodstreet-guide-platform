import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";

import { jsonError } from "../../../session/_shared";
import { buildPoiDetailInclude, requireAdmin } from "../../_shared";

export const runtime = "nodejs";

/**
 * POST /api/admin/pois/:id/unlock
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await context.params;

  const poi = await prisma.pOI.findUnique({ where: { id }, select: { id: true } });
  if (!poi) return jsonError(404, "Không tìm thấy POI");

  const updatedPoi = await (prisma as any).pOI.update({
    where: { id },
    data: { isActive: true },
    include: buildPoiDetailInclude(),
  });

  await logUserActivity({
    userId: adminResult.adminId,
    action: "ADMIN_POI_UNLOCKED",
    targetType: "POI",
    targetId: id,
    request,
  });

  return NextResponse.json({ ok: true, poi: updatedPoi });
}



