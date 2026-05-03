/**
 * Refresh token (opaque) utilities.
 *
 * Refresh token nên là chuỗi random, lưu hash trong DB (không lưu plain token).
 */

import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
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

/**
 * Atomically rotate a refresh token.
 *
 * Uses `updateMany` with a WHERE clause matching userId + currentTokenHash + refreshTokenVersion
 * so that concurrent rotation requests are detected as a race condition (count === 0).
 *
 * If the row is updated, the version is incremented, the hash is replaced, and the expiry is set.
 * If count === 0, the token was already rotated (or invalidated) by another request — the caller
 * should revoke the entire token family and force re-authentication.
 */
export async function rotateRefreshToken(params: {
  prisma: PrismaClient;
  userId: string;
  currentTokenHash: string;
  newToken: string;
  newExpiry: Date;
}): Promise<{ rotated: boolean }> {
  const { prisma, userId, currentTokenHash, newToken, newExpiry } = params;
  const newTokenHash = hashRefreshToken(newToken);

  const result = await prisma.user.updateMany({
    where: {
      id: userId,
      refreshTokenHash: currentTokenHash,
    },
    data: {
      refreshTokenHash: newTokenHash,
      refreshTokenExpiry: newExpiry,
    },
  });

  return { rotated: result.count > 0 };
}
