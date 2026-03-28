import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";

import { jsonError } from "../../../auth/_shared";
import { requireVendor } from "../../_shared";

export const runtime = "nodejs";

/**
 * POST /api/vendor/pois/:id/unlock
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const vendorResult = await requireVendor(request);
  if (vendorResult instanceof NextResponse) return vendorResult;

  const { id } = await context.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return jsonError(404, "Không tìm thấy POI");
  }

  const poi = await prisma.pOI.findFirst({
    where: {
      id,
      ownerId: vendorResult.vendorId,
    },
    select: { id: true },
  });

  if (!poi) return jsonError(404, "Không tìm thấy POI");

  const updatedPoi = await (prisma as any).pOI.update({
    where: { id },
    data: { isActive: true },
    include: {
      owner: { select: { id: true, email: true, name: true } },
      images: true,
      menuItems: true,
      translations: { include: { audios: true } },
    },
  });

  await logUserActivity({
    userId: vendorResult.vendorId,
    action: "VENDOR_POI_UNLOCKED",
    targetType: "POI",
    targetId: id,
    request,
  });

  return NextResponse.json({ ok: true, poi: updatedPoi });
}



