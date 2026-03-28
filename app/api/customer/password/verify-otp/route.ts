import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyOtpSchema } from "@/application/validation/password-reset";
import { prisma } from "@/infrastructure/database/prisma/client";
import { constantTimeEqualHex, hashOtp } from "@/infrastructure/password-reset/otp";
import { config } from "@/shared/config";

export const runtime = "nodejs";

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success)
    return jsonError(400, "Dữ liệu không hợp lệ", { issues: parsed.error.issues });

  const { email, otp } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "USER" || !user.isActive || user.status !== "APPROVED") {
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn");
  }

  if (!user.resetPasswordTokenHash || !user.resetPasswordTokenExpiry) {
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn");
  }

  if (user.resetPasswordTokenExpiry.getTime() < Date.now()) {
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn");
  }

  const actual = hashOtp(otp, config.auth.jwtSecret);
  if (!constantTimeEqualHex(actual, user.resetPasswordTokenHash)) {
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn");
  }

  return NextResponse.json({ ok: true });
}
