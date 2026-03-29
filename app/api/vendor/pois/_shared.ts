import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAuth } from "@/infrastructure/security/auth";

/**
 * Vendor auth guard — delegates to unified requireAuth and maps userId → vendorId
 * so downstream consumers continue working without changes.
 */
export async function requireVendor(
  request: NextRequest
): Promise<{ vendorId: string; email: string; name: string } | NextResponse> {
  const result = await requireAuth(request, "VENDOR");
  if (result instanceof NextResponse) return result;
  return { vendorId: result.userId, email: result.email, name: result.name };
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
