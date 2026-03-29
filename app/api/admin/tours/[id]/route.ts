import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { randomUUID } from "node:crypto";
import { adminUpdateTourSchema } from "@/application/validators/admin-tours";
import { prisma } from "@/infrastructure/database/prisma/client";
import { uploadToCloudinary } from "@/infrastructure/media/cloudinary";
import { logUserActivity } from "@/infrastructure/logging/activity-log";

import { jsonError } from "../../session/_shared";
import { buildTourInclude, requireAdmin, toTourResponse } from "../_shared";

export const runtime = "nodejs";

function dedupePoiIds(input: string[]): string[] {
  return [...new Set(input)];
}

function parsePoiIdsFromFormData(formData: FormData): string[] | undefined {
  const poiIdsRaw = String(formData.get("poiIds") ?? "").trim();
  if (!poiIdsRaw) return undefined;

  try {
    const parsed = JSON.parse(poiIdsRaw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function parseUpdatePayload(request: NextRequest): Promise<{
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  durationMinutes?: number | null;
  poiIds?: string[];
  isActive?: boolean;
} | null> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.startsWith("multipart/form-data")) {
    const formData = await request.formData().catch(() => null);
    if (!formData) return null;

    const file = formData.get("file");
    let imageUrl: string | null | undefined;
    if (file instanceof File && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File quá lớn. Giới hạn 10MB");
      }
      if (!file.type.toLowerCase().startsWith("image/")) {
        throw new Error("File ảnh không hợp lệ");
      }

      const upload = await uploadToCloudinary({
        file,
        folder: "foodstreet/tours",
        resourceType: "image",
      });
      imageUrl = upload.secureUrl;
    }

    const nameRaw = String(formData.get("name") ?? "");
    const descriptionRaw = String(formData.get("description") ?? "");
    const durationRaw = String(formData.get("durationMinutes") ?? "").trim();
    const isActiveRaw = String(formData.get("isActive") ?? "")
      .trim()
      .toLowerCase();
    const poiIds = parsePoiIdsFromFormData(formData);

    return {
      ...(nameRaw.trim() ? { name: nameRaw.trim() } : {}),
      ...(descriptionRaw.trim() ? { description: descriptionRaw.trim() } : {}),
      ...(durationRaw ? { durationMinutes: Number(durationRaw) } : {}),
      ...(typeof imageUrl === "string" ? { imageUrl } : {}),
      ...(typeof poiIds !== "undefined" ? { poiIds } : {}),
      ...(isActiveRaw === "true" || isActiveRaw === "false"
        ? { isActive: isActiveRaw === "true" }
        : {}),
    };
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return null;
  return body as {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
    durationMinutes?: number | null;
    poiIds?: string[];
    isActive?: boolean;
  };
}

/**
 * GET /api/admin/tours/:id
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await context.params;

  const tour = await prisma.tour.findUnique({
    where: { id },
    include: buildTourInclude(),
  });

  if (!tour) return jsonError(404, "Không tìm thấy tour");

  return NextResponse.json({ tour: toTourResponse(tour) });
}

/**
 * PATCH /api/admin/tours/:id
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await context.params;

  const existing = await prisma.tour.findUnique({
    where: { id },
    include: {
      tourPois: {
        select: { id: true, poiId: true },
      },
    },
  });

  if (!existing) return jsonError(404, "Không tìm thấy tour");

  let rawPayload: Awaited<ReturnType<typeof parseUpdatePayload>>;
  try {
    rawPayload = await parseUpdatePayload(request);
  } catch (error) {
    return jsonError(400, "Dữ liệu không hợp lệ");
  }

  const parsed = adminUpdateTourSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const input = parsed.data;

  if (input.poiIds) {
    const deduped = dedupePoiIds(input.poiIds);
    const poiCount = await prisma.pOI.count({
      where: {
        id: { in: deduped },
        status: "APPROVED",
        isActive: true,
      },
    });

    if (poiCount !== deduped.length) {
      return jsonError(400, "Một số POI không tồn tại, chưa duyệt hoặc đang bị khóa");
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tour.update({
      where: { id: existing.id },
      data: {
        ...(typeof input.name === "string" ? { name: input.name } : {}),
        ...("description" in input ? { description: input.description ?? null } : {}),
        ...("imageUrl" in input ? { imageUrl: input.imageUrl ?? null } : {}),
        ...("durationMinutes" in input ? { durationMinutes: input.durationMinutes ?? null } : {}),
        ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
      },
    });

    if (input.poiIds) {
      const deduped = dedupePoiIds(input.poiIds);

      await tx.tourPOI.deleteMany({ where: { tourId: existing.id } });
      await tx.tourPOI.createMany({
        data: deduped.map((poiId, index) => ({
          id: randomUUID(),
          tourId: existing.id,
          poiId,
          stopOrder: index + 1,
        })),
      });
    }

    return tx.tour.findUnique({ where: { id: existing.id }, include: buildTourInclude() });
  });

  if (!updated) return jsonError(500, "Không thể cập nhật tour");

  await logUserActivity({
    userId: adminResult.adminId,
    action: "ADMIN_TOUR_UPDATED",
    targetType: "TOUR",
    targetId: updated.id,
    meta: {
      name: updated.name,
      updatedStops: Boolean(input.poiIds),
      isActive: updated.isActive,
    },
    request,
  });

  return NextResponse.json({ ok: true, tour: toTourResponse(updated) });
}

/**
 * DELETE /api/admin/tours/:id
 * Soft hide: set isActive=false
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await context.params;

  const existing = await prisma.tour.findUnique({
    where: { id },
    select: { id: true, name: true, isActive: true },
  });

  if (!existing) return jsonError(404, "Không tìm thấy tour");

  const updated = await prisma.tour.update({
    where: { id: existing.id },
    data: { isActive: false },
    include: buildTourInclude(),
  });

  await logUserActivity({
    userId: adminResult.adminId,
    action: "ADMIN_TOUR_HIDDEN",
    targetType: "TOUR",
    targetId: updated.id,
    meta: { name: updated.name },
    request,
  });

  return NextResponse.json({ ok: true, tour: toTourResponse(updated) });
}
