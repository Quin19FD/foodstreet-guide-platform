import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requestOtpSchema } from "@/application/validation/password-reset";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logUserActivity } from "@/infrastructure/logging/activity-log";
import { sendPasswordResetOtpEmail } from "@/infrastructure/password-reset/mailer";
import { generateNumericOtp, hashOtp } from "@/infrastructure/password-reset/otp";
import { checkAndRecordOtpSend } from "@/infrastructure/password-reset/rate-limit";
import { config } from "@/shared/config";

export const runtime = "nodejs";

const OTP_TTL_MS = 2 * 60_000;

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = requestOtpSchema.safeParse(body);
  if (!parsed.success)
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });

  const { email } = parsed.data;

  const limit = checkAndRecordOtpSend(email);
  if (!limit.ok) {
    return jsonError(429, "Bạn thao tác quá nhanh. Vui lòng thử lại sau.", {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "USER" || !user.isActive || user.status !== "APPROVED") {
    return NextResponse.json({ ok: true });
  }

  const otp = generateNumericOtp(6);
  const tokenHash = hashOtp(otp, config.auth.jwtSecret);
  const expiry = new Date(Date.now() + OTP_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordTokenHash: tokenHash,
      resetPasswordTokenExpiry: expiry,
    },
  });

  await sendPasswordResetOtpEmail({ to: user.email, otp, ttlSeconds: OTP_TTL_MS / 1000 });

  await logUserActivity({
    userId: user.id,
    action: "CUSTOMER_PASSWORD_OTP_SENT",
    targetType: "USER",
    targetId: user.id,
    request,
  });

  return NextResponse.json({ ok: true });
}
