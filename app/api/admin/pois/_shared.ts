import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  requireAuth,
  jsonError,
} from "@/infrastructure/security/auth";

export async function requireAdmin(
  request: NextRequest
): Promise<{ adminId: string; email: string; name: string | null } | NextResponse> {
  const result = await requireAuth(request, "ADMIN");
  if (result instanceof NextResponse) return result;
  return { adminId: result.userId, email: result.email, name: result.name };
}

export function buildPoiDetailInclude() {
  return {
    owner: {
      select: {
        id: true,
        email: true,
        name: true,
      },
    },
    images: {
      orderBy: { id: "asc" as const },
    },
    menuItems: {
      orderBy: { createdAt: "asc" as const },
    },
    translations: {
      orderBy: [{ language: "asc" as const }],
      include: {
        audios: {
          orderBy: { createdAt: "asc" as const },
        },
      },
    },
  };
}
