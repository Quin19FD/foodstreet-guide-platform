import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { parseDurationToSeconds } from "@/infrastructure/security/jwt";
import {
  generateRefreshToken,
  hashRefreshToken,
  rotateRefreshToken,
} from "@/infrastructure/security/refresh-token";
import { config } from "@/shared/config";

import { AUTH_COOKIES, createCustomerAccessToken, jsonError, setAuthCookies } from "../_shared";

export const runtime = "nodejs";

/**
 * POST /api/customer/auth/refresh
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(AUTH_COOKIES.refresh)?.value ?? null;
  if (!refreshToken) {
    return jsonError(401, "Thiếu refresh token");
  }

  const refreshTokenHash = hashRefreshToken(refreshToken);
  const user = await prisma.user.findFirst({ where: { refreshTokenHash } });
  if (!user || user.role !== "USER" || !user.isActive || user.status !== "APPROVED") {
    return jsonError(401, "Refresh token không hợp lệ");
  }

  const now = new Date();
  if (!user.refreshTokenExpiry || user.refreshTokenExpiry.getTime() < now.getTime()) {
    return jsonError(401, "Refresh token đã hết hạn");
  }

  const accessToken = createCustomerAccessToken({ userId: user.id, email: user.email });

  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenExpiry = new Date(
    now.getTime() + parseDurationToSeconds(config.auth.refreshTokenExpiresIn) * 1000
  );

  const { rotated } = await rotateRefreshToken({
    prisma,
    userId: user.id,
    currentTokenHash: refreshTokenHash,
    newToken: newRefreshToken,
    newExpiry: newRefreshTokenExpiry,
  });

  if (!rotated) {
    return jsonError(401, "Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại");
  }

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

  const rememberMe = request.cookies.get(AUTH_COOKIES.remember)?.value === "1";
  setAuthCookies(response, { accessToken, refreshToken: newRefreshToken, rememberMe });

  return response;
}
