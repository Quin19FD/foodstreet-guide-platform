import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { config } from "@/shared/config";
import { verifyOtpSchema } from "@/application/validation/password-reset";
import { constantTimeEqualHex, hashOtp } from "@/infrastructure/password-reset/otp";

export const runtime = "nodejs";

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

function devExtra(extra: Record<string, unknown>): Record<string, unknown> | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  return extra;
}

/**
 * POST /api/admin/password/verify-otp
 *
 * Input: { email, otp }
 * Output: { ok: true } nếu hợp lệ
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Dữ liệu không hợp lệ", {
      issues: parsed.error.issues,
      ...devExtra({ code: "INVALID_SCHEMA" }),
    });
  }

  const { email, otp } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN" || !user.isActive || user.status !== "APPROVED") {
    console.warn("[VERIFY_OTP] ineligible user", devExtra({ email }) ?? {});
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn", devExtra({ code: "USER_INELIGIBLE" }));
  }

  if (!user.resetPasswordTokenHash || !user.resetPasswordTokenExpiry) {
    console.warn("[VERIFY_OTP] missing token", devExtra({ email }) ?? {});
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn", devExtra({ code: "TOKEN_MISSING" }));
  }

  if (user.resetPasswordTokenExpiry.getTime() < Date.now()) {
    console.warn(
      "[VERIFY_OTP] token expired",
      devExtra({ email, expiry: user.resetPasswordTokenExpiry.toISOString() }) ?? {}
    );
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn", devExtra({ code: "TOKEN_EXPIRED" }));
  }

  const expected = user.resetPasswordTokenHash;
  const actual = hashOtp(otp, config.auth.jwtSecret);
  if (!constantTimeEqualHex(actual, expected)) {
    console.warn("[VERIFY_OTP] token mismatch", devExtra({ email }) ?? {});
    return jsonError(400, "OTP không hợp lệ hoặc đã hết hạn", devExtra({ code: "TOKEN_MISMATCH" }));
  }

  return NextResponse.json({ ok: true });
}
