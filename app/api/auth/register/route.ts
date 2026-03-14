import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { registerRequestSchema } from "@/application/validators/auth";
import { prisma } from "@/infrastructure/database/prisma/client";
import { parseDurationToSeconds } from "@/infrastructure/security/jwt";
import { hashPassword } from "@/infrastructure/security/password";
import { generateRefreshToken, hashRefreshToken } from "@/infrastructure/security/refresh-token";
import { config } from "@/shared/config";

import { createAdminAccessToken, jsonError, setAuthCookies } from "../_shared";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

/**
 * POST /api/auth/register
 *
 * Mục tiêu: bootstrap tài khoản ADMIN đầu tiên để có thể đăng nhập vào cổng quản trị.
 *
 * Rule:
 * - Nếu đã tồn tại ít nhất 1 ADMIN -> chặn public register (403)
 *
 * Input (JSON):
 * - email, name, password (required)
 * - phoneNumber?, avatarUrl?, rememberMe?
 *
 * Output:
 * - { user, accessToken } + set cookies (giống /api/auth/login)
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const { email, name, password, phoneNumber, avatarUrl, rememberMe = false } = parsed.data;

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) {
    return jsonError(403, "Đã có tài khoản admin. Không thể tự đăng ký thêm.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError(409, "Email đã được sử dụng");
  }

  const now = new Date();
  const passwordHash = await hashPassword(password);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshTokenExpiry = new Date(
    now.getTime() + parseDurationToSeconds(config.auth.refreshTokenExpiresIn) * 1000
  );

  const userId = randomUUID();
  const user = await prisma.user.create({
    data: {
      id: userId,
      email,
      password: passwordHash,
      name,
      phoneNumber: phoneNumber || null,
      avatarUrl: avatarUrl || null,
      role: "ADMIN",
      status: "APPROVED",
      approvedAt: now,
      isActive: true,
      lastLogin: now,
      refreshTokenHash,
      refreshTokenExpiry,
    },
  });

  const realAccessToken = createAdminAccessToken({ userId: user.id, email: user.email });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phoneNumber: user.phoneNumber ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      createdAt: user.createdAt,
    },
    accessToken: realAccessToken,
  });

  setAuthCookies(response, { accessToken: realAccessToken, refreshToken, rememberMe });

  return response;
}
