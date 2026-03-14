import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { registerRequestSchema } from "@/application/validators/auth";
import { prisma } from "@/infrastructure/database/prisma/client";
import { parseDurationToSeconds } from "@/infrastructure/security/jwt";
import { hashPassword } from "@/infrastructure/security/password";
import { generateRefreshToken, hashRefreshToken } from "@/infrastructure/security/refresh-token";
import { config } from "@/shared/config";
import { randomUUID } from "node:crypto";

import { createCustomerAccessToken, jsonError, setAuthCookies } from "../_shared";

export const runtime = "nodejs";

/**
 * POST /api/customer/auth/register
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const { email, name, password, phoneNumber, avatarUrl, rememberMe = false } = parsed.data;

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

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      password: passwordHash,
      name,
      phoneNumber: phoneNumber || null,
      avatarUrl: avatarUrl || null,
      role: "USER",
      status: "APPROVED",
      approvedAt: now,
      isActive: true,
      lastLogin: now,
      refreshTokenHash,
      refreshTokenExpiry,
    },
  });

  const accessToken = createCustomerAccessToken({ userId: user.id, email: user.email });

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
    accessToken,
  });

  setAuthCookies(response, { accessToken, refreshToken, rememberMe });
  return response;
}
