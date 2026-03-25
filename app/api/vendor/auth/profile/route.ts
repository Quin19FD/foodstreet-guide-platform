import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { profileUpdateSchema } from "@/application/validation/profile";
import { prisma } from "@/infrastructure/database/prisma/client";

import { AUTH_COOKIES, jsonError, verifyVendorAccessToken } from "../_shared";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIES.access)?.value ?? null;
  if (!token) return jsonError(401, "Chưa đăng nhập");

  let payload: { sub: string; role: "VENDOR" };
  try {
    payload = verifyVendorAccessToken(token);
  } catch {
    return jsonError(401, "Phiên đăng nhập không hợp lệ");
  }

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const input = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!existing || existing.role !== "VENDOR" || !existing.isActive || existing.status !== "APPROVED") {
    return jsonError(401, "Phiên đăng nhập không hợp lệ");
  }

  if (input.email && input.email !== existing.email) {
    const duplicated = await prisma.user.findUnique({ where: { email: input.email } });
    if (duplicated && duplicated.id !== existing.id) {
      return jsonError(409, "Email đã được sử dụng");
    }
  }

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: {
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phoneNumber !== undefined ? { phoneNumber: input.phoneNumber || null } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl || null } : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phoneNumber: user.phoneNumber ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      createdAt: user.createdAt,
    },
  });
}
