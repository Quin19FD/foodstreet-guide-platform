import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";
import { config } from "@/shared/config";
import { resetPasswordSchema } from "@/application/validation/password-reset";
import { constantTimeEqualHex, hashOtp } from "@/infrastructure/password-reset/otp";
import { hashPassword } from "@/infrastructure/security/password";

export const runtime = "nodejs";

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * POST /api/admin/password/reset
 *
 * Input: { email, otp, newPassword }
 * Output: { ok: true } nếu đổi mật khẩu thành công
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });
  }

  const { email, otp, newPassword } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN" || !user.isActive || user.status !== "APPROVED") {
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn");
  }

  if (!user.resetPasswordTokenHash || !user.resetPasswordTokenExpiry) {
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn");
  }

  if (user.resetPasswordTokenExpiry.getTime() < Date.now()) {
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn");
  }

  const expected = user.resetPasswordTokenHash;
  const actual = hashOtp(otp, config.auth.jwtSecret);
  if (!constantTimeEqualHex(actual, expected)) {
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn");
  }

  const newPasswordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: newPasswordHash,
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiry: null,
      refreshTokenHash: null,
      refreshTokenExpiry: null,
    },
  });

  await logUserActivity({
    userId: user.id,
    action: "ADMIN_PASSWORD_RESET",
    targetType: "USER",
    targetId: user.id,
    request,
  });

  return NextResponse.json({ ok: true });
}

