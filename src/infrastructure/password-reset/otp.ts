import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export function generateNumericOtp(length = 6): string {
  const max = 10 ** length;
  const value = randomInt(0, max);
  return String(value).padStart(length, "0");
}

export function hashOtp(otp: string, pepper: string): string {
  return createHash("sha256").update(`${otp}:${pepper}`).digest("hex");
}

export function constantTimeEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}
