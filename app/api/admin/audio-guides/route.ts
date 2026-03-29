import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { requireAuth } from "@/infrastructure/security/auth";

export const runtime = "nodejs";

/**
 * GET /api/admin/audio-guides
 * Query: ?poiId=&language=&take=&skip=
 */
export async function GET(request: NextRequest) {
  const adminResult = await requireAuth(request, "ADMIN");
  if (adminResult instanceof NextResponse) return adminResult;

  const url = new URL(request.url);
  const poiId = url.searchParams.get("poiId")?.trim() ?? "";
  const language = url.searchParams.get("language")?.trim() ?? "";
  const takeRaw = url.searchParams.get("take") ?? "50";
  const skipRaw = url.searchParams.get("skip") ?? "0";

  const take = Math.min(Math.max(Number(takeRaw) || 50, 1), 200);
  const skip = Math.max(Number(skipRaw) || 0, 0);

  // Build where clause for POI translations
  const where = {
    ...(poiId ? { poiId } : {}),
    ...(language ? { language } : {}),
  };

  const [total, translations] = await Promise.all([
    prisma.pOITranslation.count({ where }),
    prisma.pOITranslation.findMany({
      where,
      include: {
        poi: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        audios: {
          select: {
            id: true,
            audioUrl: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take,
      skip,
    }),
  ]);

  // Format as audio guides
  const audioGuides = translations.flatMap((translation) => {
    return translation.audios.map((audio) => ({
      id: audio.id,
      poiId: translation.poiId,
      poiName: translation.poi.name,
      category: translation.poi.category,
      language: translation.language,
      name: translation.name,
      description: translation.description,
      audioScript: translation.audioScript,
      audioUrl: audio.audioUrl,
      isActive: audio.isActive,
      createdAt: audio.createdAt,
      translationUpdatedAt: translation.updatedAt,
    }));
  });

  return NextResponse.json({ total, audioGuides, take, skip });
}
