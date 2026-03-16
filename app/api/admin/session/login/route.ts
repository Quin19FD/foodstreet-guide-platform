import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { loginRequestSchema } from "@/application/validators/auth";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";
import { parseDurationToSeconds } from "@/infrastructure/security/jwt";
import {
  getLockoutStatus,
  recordFailedAttempt,
  resetLockout,
} from "@/infrastructure/security/login-lockout";
import { verifyPassword } from "@/infrastructure/security/password";
import { generateRefreshToken, hashRefreshToken } from "@/infrastructure/security/refresh-token";
import { config } from "@/shared/config";

import { createAdminAccessToken, jsonError, setAdminAuthCookies } from "../_shared";

export const runtime = "nodejs";

/**
 * POST /api/admin/session/login
 *
 * Input (JSON):
 * - email: string (required, đúng định dạng)
 * - password: string (required)
 * - rememberMe?: boolean (optional)
 *
 * Output (JSON):
 * - { user, accessToken } nếu thành công
 * - 400/401/403/429 nếu lỗi
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const { email, password, rememberMe = false } = parsed.data;

  const lock = getLockoutStatus(email);
  if (lock.isLocked) {
    return jsonError(429, "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.", {
      retryAfterSeconds: lock.remainingSeconds,
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    recordFailedAttempt(email);
    return jsonError(401, "Email hoặc mật khẩu không đúng");
  }

  if (!user.isActive) {
    return jsonError(403, "Tài khoản đang bị khóa (không hoạt động)");
  }

  if (user.role !== "ADMIN") {
    return jsonError(403, "Tài khoản không có quyền admin");
  }

  if (user.status !== "APPROVED") {
    return jsonError(403, "Tài khoản chưa được phê duyệt");
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    const after = recordFailedAttempt(email);
    if (after.isLocked) {
      return jsonError(429, "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.", {
        retryAfterSeconds: after.remainingSeconds,
      });
    }
    return jsonError(401, "Email hoặc mật khẩu không đúng");
  }

  resetLockout(email);

  const now = new Date();
  const accessToken = createAdminAccessToken({ userId: user.id, email: user.email });

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshTokenExpiry = new Date(
    now.getTime() + parseDurationToSeconds(config.auth.refreshTokenExpiresIn) * 1000
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: now,
      refreshTokenHash,
      refreshTokenExpiry,
    },
  });

  await logUserActivity({
    userId: user.id,
    action: "ADMIN_LOGIN",
    targetType: "USER",
    targetId: user.id,
    meta: { email: user.email, rememberMe },
    request,
  });

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

  setAdminAuthCookies(response, { accessToken, refreshToken, rememberMe });

  return response;
}

