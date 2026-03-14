import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { registerRequestSchema } from "@/application/validators/auth";
import { prisma } from "@/infrastructure/database/prisma/client";
import { hashPassword } from "@/infrastructure/security/password";
import { randomUUID } from "node:crypto";

import { jsonError } from "../_shared";

export const runtime = "nodejs";

/**
 * POST /api/vendor/auth/register
 *
 * Tạo tài khoản VENDOR ở trạng thái chờ duyệt (status=PENDING).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const { email, name, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError(409, "Email đã được sử dụng");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      password: passwordHash,
      name,
      role: "VENDOR",
      status: "PENDING",
      isActive: true,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      message: "Đăng ký thành công. Vui lòng chờ admin phê duyệt trước khi đăng nhập.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    },
    { status: 201 }
  );
}
