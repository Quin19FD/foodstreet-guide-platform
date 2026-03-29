import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { requireAuth, jsonError } from "@/infrastructure/security/auth";

export const runtime = "nodejs";

/**
 * GET /api/vendor/auth/me
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "VENDOR");
  if (auth instanceof NextResponse) return auth;

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });

  return NextResponse.json({
    user: {
      id: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
      phoneNumber: user!.phoneNumber ?? undefined,
      avatarUrl: user!.avatarUrl ?? undefined,
      createdAt: user!.createdAt,
    },
  });
}
