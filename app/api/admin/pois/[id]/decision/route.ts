import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { adminPoiDecisionSchema } from "@/application/validators/poi-management";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";
import { sendPoiApprovedEmail, sendPoiRejectedEmail } from "@/infrastructure/vendor/mailer";

import { jsonError } from "../../../session/_shared";
import { buildPoiDetailInclude, requireAdmin } from "../../_shared";

export const runtime = "nodejs";

/**
 * PATCH /api/admin/pois/:id/decision
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await context.params;

  const body = await request.json().catch(() => null);
  const parsed = adminPoiDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const poi = await prisma.pOI.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!poi) return jsonError(404, "Không tìm thấy POI");

  const now = new Date();

  const decisionData: any =
    parsed.data.decision === "APPROVE"
      ? {
          status: "APPROVED",
          rejectionReason: null,
          approvedBy: adminResult.adminId,
          approvedAt: now,
          isActive: true,
        }
      : {
          status: "REJECTED",
          rejectionReason: parsed.data.rejectionReason ?? "Không có lý do",
          approvedBy: adminResult.adminId,
          approvedAt: now,
        };

  const updatedPoi = await (prisma as any).pOI.update({
    where: { id },
    data: decisionData,
    include: buildPoiDetailInclude(),
  });

  await logUserActivity({
    userId: adminResult.adminId,
    action: parsed.data.decision === "APPROVE" ? "ADMIN_POI_APPROVED" : "ADMIN_POI_REJECTED",
    targetType: "POI",
    targetId: id,
    meta: {
      rejectionReason: parsed.data.rejectionReason ?? null,
      ownerId: poi.ownerId,
    },
    request,
  });

  let mailSent = false;
  if (parsed.data.decision === "APPROVE") {
    try {
      await sendPoiApprovedEmail({
        to: poi.owner.email,
        vendorName: poi.owner.name,
        poiName: poi.name,
      });
      mailSent = true;
    } catch (error) {
      console.error("[POI_MAIL][APPROVED]", error);
    }
  }

  if (parsed.data.decision === "REJECT") {
    try {
      await sendPoiRejectedEmail({
        to: poi.owner.email,
        vendorName: poi.owner.name,
        poiName: poi.name,
        reason: parsed.data.rejectionReason ?? "Không có lý do",
      });
      mailSent = true;
    } catch (error) {
      console.error("[POI_MAIL][REJECTED]", error);
    }
  }

  return NextResponse.json({ ok: true, poi: updatedPoi, mailSent });
}


