import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";

import { requireAdmin } from "../session/_shared";

export const runtime = "nodejs";

/**
 * GET /api/admin/translations
 * Query: ?poiId=&language=&take=&skip=
 */
export async function GET(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (adminResult instanceof NextResponse) return adminResult;

  const url = new URL(request.url);
  const poiId = url.searchParams.get("poiId")?.trim() ?? "";
  const language = url.searchParams.get("language")?.trim() ?? "";
  const takeRaw = url.searchParams.get("take") ?? "50";
  const skipRaw = url.searchParams.get("skip") ?? "0";

  const take = Math.min(Math.max(Number(takeRaw) || 50, 1), 200);
  const skip = Math.max(Number(skipRaw) || 0, 0);

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

  return NextResponse.json({ total, translations, take, skip });
}
