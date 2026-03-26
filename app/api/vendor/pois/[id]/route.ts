import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { randomUUID } from "node:crypto";
import { vendorUpdatePoiSchema } from "@/application/validators/poi-management";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";

import { jsonError } from "../../auth/_shared";
import { buildPoiDetailInclude, requireVendor } from "../_shared";

export const runtime = "nodejs";

/**
 * GET /api/vendor/pois/:id
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const vendorResult = await requireVendor(request);
  if (vendorResult instanceof NextResponse) return vendorResult;

  const { id } = await context.params;

  const poi = await prisma.pOI.findFirst({
    where: {
      id,
      ownerId: vendorResult.vendorId,
    },
    include: buildPoiDetailInclude(),
  });

  if (!poi) return jsonError(404, "Không tìm thấy POI");

  return NextResponse.json({ poi });
}

/**
 * PATCH /api/vendor/pois/:id
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const vendorResult = await requireVendor(request);
  if (vendorResult instanceof NextResponse) return vendorResult;

  const { id } = await context.params;

  const poi = await prisma.pOI.findFirst({
    where: {
      id,
      ownerId: vendorResult.vendorId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!poi) return jsonError(404, "Không tìm thấy POI");

  const body = await request.json().catch(() => null);
  const parsed = vendorUpdatePoiSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const input = parsed.data;

  if (
    typeof input.priceMin === "number" &&
    typeof input.priceMax === "number" &&
    input.priceMin > input.priceMax
  ) {
    return jsonError(400, "Khoảng giá không hợp lệ", { field: "priceMin" });
  }

  const updatedPoi = await prisma.$transaction(async (tx) => {
    if (input.images?.deleteIds?.length) {
      await tx.pOIImage.deleteMany({
        where: {
          poiId: id,
          id: { in: input.images.deleteIds },
        },
      });
    }

    if (input.images?.update?.length) {
      await Promise.all(
        input.images.update.map((image) =>
          tx.pOIImage.updateMany({
            where: {
              id: image.id,
              poiId: id,
            },
            data: {
              ...(typeof image.imageUrl === "string" ? { imageUrl: image.imageUrl } : {}),
              ...(image.description !== undefined ? { description: image.description } : {}),
            },
          })
        )
      );
    }

    if (input.images?.create?.length) {
      await tx.pOIImage.createMany({
        data: input.images.create.map((image) => ({
          id: randomUUID(),
          poiId: id,
          imageUrl: image.imageUrl,
          description: image.description ?? null,
        })),
      });
    }

    if (input.menuItems?.deleteIds?.length) {
      await tx.menuItem.deleteMany({
        where: {
          poiId: id,
          id: { in: input.menuItems.deleteIds },
        },
      });
    }

    if (input.menuItems?.update?.length) {
      await Promise.all(
        input.menuItems.update.map((menuItem) =>
          tx.menuItem.updateMany({
            where: {
              id: menuItem.id,
              poiId: id,
            },
            data: {
              ...(typeof menuItem.name === "string" ? { name: menuItem.name } : {}),
              ...(menuItem.description !== undefined ? { description: menuItem.description } : {}),
              ...(menuItem.price !== undefined ? { price: menuItem.price } : {}),
              ...(menuItem.imageUrl !== undefined ? { imageUrl: menuItem.imageUrl } : {}),
              ...(typeof menuItem.isAvailable === "boolean"
                ? { isAvailable: menuItem.isAvailable }
                : {}),
            },
          })
        )
      );
    }

    if (input.menuItems?.create?.length) {
      await tx.menuItem.createMany({
        data: input.menuItems.create.map((menuItem) => ({
          id: randomUUID(),
          poiId: id,
          name: menuItem.name,
          description: menuItem.description ?? null,
          price: menuItem.price ?? null,
          imageUrl: menuItem.imageUrl ?? null,
          isAvailable: menuItem.isAvailable ?? true,
        })),
      });
    }

    if (input.translations?.deleteIds?.length) {
      const deletingTranslations = await tx.pOITranslation.findMany({
        where: { id: { in: input.translations.deleteIds }, poiId: id },
        select: { id: true, language: true },
      });

      const deletingVi = deletingTranslations.find((translation) => translation.language === "vi");
      if (deletingVi) {
        throw new Error("Không thể xóa bản thuyết minh tiếng Việt");
      }

      await tx.pOITranslation.deleteMany({
        where: {
          id: { in: deletingTranslations.map((translation) => translation.id) },
          poiId: id,
        },
      });
    }

    if (input.translations?.create?.length) {
      const existingLanguages = await tx.pOITranslation.findMany({
        where: { poiId: id },
        select: { language: true },
      });

      const languageSet = new Set(existingLanguages.map((translation) => translation.language));

      for (const translation of input.translations.create) {
        if (languageSet.has(translation.language)) {
          throw new Error(`Đã tồn tại bản thuyết minh ngôn ngữ ${translation.language}`);
        }
        languageSet.add(translation.language);
      }

      await tx.pOITranslation.createMany({
        data: input.translations.create.map((translation) => ({
          id: randomUUID(),
          poiId: id,
          language: translation.language,
          name: translation.name ?? null,
          description: translation.description ?? null,
          audioScript: translation.audioScript ?? null,
        })),
      });
    }

    if (input.translations?.update?.length) {
      await Promise.all(
        input.translations.update.map((translation) =>
          tx.pOITranslation.updateMany({
            where: {
              id: translation.id,
              poiId: id,
            },
            data: {
              ...(translation.name !== undefined ? { name: translation.name } : {}),
              ...(translation.description !== undefined
                ? { description: translation.description }
                : {}),
              ...(translation.audioScript !== undefined
                ? { audioScript: translation.audioScript }
                : {}),
            },
          })
        )
      );
    }

    if (input.audios?.deleteIds?.length) {
      const deletingAudioIds = await tx.pOIAudio.findMany({
        where: {
          id: { in: input.audios.deleteIds },
          translation: { poiId: id },
        },
        select: { id: true },
      });

      await tx.pOIAudio.deleteMany({
        where: {
          id: { in: deletingAudioIds.map((audio) => audio.id) },
        },
      });
    }

    if (input.audios?.create?.length) {
      const translationIds = [...new Set(input.audios.create.map((audio) => audio.translationId))];
      const existingTranslations = await tx.pOITranslation.findMany({
        where: {
          id: { in: translationIds },
          poiId: id,
        },
        select: { id: true },
      });

      const existingTranslationIdSet = new Set(existingTranslations.map((translation) => translation.id));

      for (const audio of input.audios.create) {
        if (!existingTranslationIdSet.has(audio.translationId)) {
          throw new Error("translationId không thuộc POI này");
        }
      }

      await tx.pOIAudio.createMany({
        data: input.audios.create.map((audio) => ({
          id: randomUUID(),
          translationId: audio.translationId,
          audioUrl: audio.audioUrl,
          isActive: audio.isActive ?? true,
        })),
      });
    }

    if (input.audios?.update?.length) {
      const audioIds = input.audios.update.map((audio) => audio.id);
      const existingAudio = await tx.pOIAudio.findMany({
        where: {
          id: { in: audioIds },
          translation: { poiId: id },
        },
        select: { id: true },
      });
      const existingAudioIdSet = new Set(existingAudio.map((audio) => audio.id));

      for (const audio of input.audios.update) {
        if (!existingAudioIdSet.has(audio.id)) {
          throw new Error("Audio không thuộc POI này");
        }

        await tx.pOIAudio.update({
          where: { id: audio.id },
          data: {
            ...(typeof audio.audioUrl === "string" ? { audioUrl: audio.audioUrl } : {}),
            ...(typeof audio.isActive === "boolean" ? { isActive: audio.isActive } : {}),
          },
        });
      }
    }

    await tx.pOI.update({
      where: { id },
      data: {
        ...(typeof input.name === "string" ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
        ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
        ...(input.priceMin !== undefined ? { priceMin: input.priceMin } : {}),
        ...(input.priceMax !== undefined ? { priceMax: input.priceMax } : {}),
        ...(poi.status === "REJECTED"
          ? {}
          : {
              status: "PENDING",
              rejectionReason: null,
              approvedBy: null,
              approvedAt: null,
            }),
      },
    });

    return tx.pOI.findUniqueOrThrow({
      where: { id },
      include: buildPoiDetailInclude(),
    });
  });

  await logUserActivity({
    userId: vendorResult.vendorId,
    action: "VENDOR_POI_UPDATED",
    targetType: "POI",
    targetId: id,
    meta: { poiStatusAfterUpdate: updatedPoi.status },
    request,
  });

  return NextResponse.json({ ok: true, poi: updatedPoi });
}


