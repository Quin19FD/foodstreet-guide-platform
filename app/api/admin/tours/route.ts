import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { randomUUID } from "node:crypto";
import { adminCreateTourSchema } from "@/application/validators/admin-tours";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";
import { uploadToCloudinary } from "@/infrastructure/media/cloudinary";

import { jsonError } from "../session/_shared";
import { buildTourInclude, requireAdmin, toTourResponse } from "./_shared";

export const runtime = "nodejs";

function dedupePoiIds(input: string[]): string[] {
  return [...new Set(input)];
}

function parsePoiIdsFromFormData(formData: FormData): string[] {
  const poiIdsRaw = String(formData.get("poiIds") ?? "").trim();
  if (!poiIdsRaw) return [];

  try {
    const parsed = JSON.parse(poiIdsRaw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
    return [];
  } catch {
    return [];
  }
}

async function parseCreatePayload(request: NextRequest): Promise<{
  name?: string;
  description?: string;
  imageUrl?: string;
  durationMinutes?: number;
  poiIds?: string[];
} | null> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.startsWith("multipart/form-data")) {
    const formData = await request.formData().catch(() => null);
    if (!formData) return null;

    const file = formData.get("file");
    let imageUrl: string | undefined;

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

    const name = String(formData.get("name") ?? "").trim();
    const descriptionRaw = String(formData.get("description") ?? "").trim();
    const durationRaw = String(formData.get("durationMinutes") ?? "").trim();
    const poiIds = parsePoiIdsFromFormData(formData);

    return {
      name,
      description: descriptionRaw || undefined,
      imageUrl,
      durationMinutes: durationRaw ? Number(durationRaw) : undefined,
      poiIds,
    };
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return null;
  return body as {
    name?: string;
    description?: string;
    imageUrl?: string;
    durationMinutes?: number;
    poiIds?: string[];
  };
}

/**
 * GET /api/admin/tours
 */
export async function GET(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const includeInactive = url.searchParams.get("includeInactive") === "1";
  const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? "50") || 50, 1), 200);
  const skip = Math.max(Number(url.searchParams.get("skip") ?? "0") || 0, 0);

  const where = {
    ...(includeInactive ? {} : { isActive: true }),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, tours] = await Promise.all([
    prisma.tour.count({ where }),
    prisma.tour.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take,
      skip,
      include: buildTourInclude(),
    }),
  ]);

  return NextResponse.json({
    total,
    tours: tours.map(toTourResponse),
    take,
    skip,
  });
}

/**
 * POST /api/admin/tours
 */
export async function POST(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  let rawPayload: Awaited<ReturnType<typeof parseCreatePayload>>;
  try {
    rawPayload = await parseCreatePayload(request);
  } catch (_error) {
    return jsonError(400, "Dữ liệu không hợp lệ");
  }

  const parsed = adminCreateTourSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const input = parsed.data;
  const poiIds = dedupePoiIds(input.poiIds);

  const poiCount = await prisma.pOI.count({
    where: {
      id: { in: poiIds },
      status: "APPROVED",
      isActive: true,
    },
  });

  if (poiCount !== poiIds.length) {
    return jsonError(400, "Một số POI không tồn tại, chưa duyệt hoặc đang bị khóa");
  }

  const created = await prisma.$transaction(async (tx) => {
    const tour = await tx.tour.create({
      data: {
        id: randomUUID(),
        name: input.name,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        durationMinutes: input.durationMinutes ?? null,
        isActive: true,
      },
    });

    await tx.tourPOI.createMany({
      data: poiIds.map((poiId, index) => ({
        id: randomUUID(),
        tourId: tour.id,
        poiId,
        stopOrder: index + 1,
      })),
    });

    return tx.tour.findUnique({
      where: { id: tour.id },
      include: buildTourInclude(),
    });
  });

  if (!created) return jsonError(500, "Không thể tạo tour");

  await logUserActivity({
    userId: adminResult.adminId,
    action: "ADMIN_TOUR_CREATED",
    targetType: "TOUR",
    targetId: created.id,
    meta: { name: created.name, poiCount: created.tourPois.length },
    request,
  });

  return NextResponse.json({ ok: true, tour: toTourResponse(created) }, { status: 201 });
}
