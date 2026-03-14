import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { loginRequestSchema } from "@/application/validators/auth";
import { prisma } from "@/infrastructure/database/prisma/client";
import { parseDurationToSeconds } from "@/infrastructure/security/jwt";
import {
  getLockoutStatus,
  recordFailedAttempt,
  resetLockout,
} from "@/infrastructure/security/login-lockout";
import { verifyPassword } from "@/infrastructure/security/password";
import { generateRefreshToken, hashRefreshToken } from "@/infrastructure/security/refresh-token";
import { config } from "@/shared/config";

import { createVendorAccessToken, jsonError, setAuthCookies } from "../_shared";

export const runtime = "nodejs";

/**
 * POST /api/vendor/auth/login
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

  if (user.role !== "VENDOR") {
    return jsonError(403, "Tài khoản không có quyền vendor");
  }
  if (!user.isActive) {
    return jsonError(403, "Tài khoản đang bị khóa (không hoạt động)");
  }

  if (user.status === "PENDING") {
    return jsonError(403, "Tài khoản đang chờ admin phê duyệt");
  }

  if (user.status === "REJECTED") {
    return jsonError(403, "Tài khoản đã bị từ chối", {
      rejectionReason: user.rejectionReason ?? undefined,
    });
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
  const accessToken = createVendorAccessToken({ userId: user.id, email: user.email });

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
