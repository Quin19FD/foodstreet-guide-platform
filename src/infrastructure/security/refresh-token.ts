/**
 * Refresh token (opaque) utilities.
 *
 * Refresh token nên là chuỗi random, lưu hash trong DB (không lưu plain token).
 */

import { createHash, randomBytes } from "node:crypto";

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

/**
 * Tạo refresh token dạng opaque string.
 *
 * Input: none
 * Output: string (dài, khó đoán)
 */
export function generateRefreshToken(): string {
  return base64UrlEncode(randomBytes(48));
}

/**
 * Hash refresh token để lưu DB.
 *
 * Input:
 * - token: refresh token plain
 *
 * Output:
 * - hash hex (sha256)
 */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
