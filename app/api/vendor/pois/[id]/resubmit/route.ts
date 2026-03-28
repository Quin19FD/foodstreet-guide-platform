import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { vendorResubmitPoiSchema } from "@/application/validators/poi-management";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";

import { jsonError } from "../../../auth/_shared";
import { requireVendor } from "../../_shared";

export const runtime = "nodejs";

/**
 * POST /api/vendor/pois/:id/resubmit
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
    select: {
      id: true,
      status: true,
      rejectionReason: true,
    },
  });

  if (!poi) return jsonError(404, "Không tìm thấy POI");
  if (poi.status !== "REJECTED") {
    return jsonError(409, "Chỉ có thể gửi duyệt lại khi POI đang ở trạng thái REJECTED");
  }

  const body = await request.json().catch(() => null);
  const parsed = vendorResubmitPoiSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const updatedPoi = await prisma.pOI.update({
    where: { id },
    data: {
      status: "PENDING",
      rejectionReason: null,
      approvedBy: null,
      approvedAt: null,
      submitCount: { increment: 1 },
    },
    include: {
      owner: { select: { id: true, email: true, name: true } },
      images: true,
      menuItems: true,
      translations: { include: { audios: true } },
    },
  });

  await logUserActivity({
    userId: vendorResult.vendorId,
    action: "VENDOR_POI_RESUBMITTED",
    targetType: "POI",
    targetId: id,
    meta: {
      note: parsed.data.note ?? null,
    },
    request,
  });

  return NextResponse.json({ ok: true, poi: updatedPoi });
}
