/**
 * Password hashing (scrypt) - không dùng thư viện ngoài.
 *
 * Lưu ý: project này đang dùng Prisma User.password là string.
 * Ta lưu theo format: "scrypt$<saltB64Url>$<hashB64Url>"
 */

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SCRYPT_KEYLEN = 64;
const SCRYPT_SALT_BYTES = 16;

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64");
}

/**
 * Hash mật khẩu.
 *
 * Input:
 * - password: mật khẩu plain text
 *
 * Output:
 * - string theo format "scrypt$<salt>$<hash>"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const derivedKey = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `scrypt$${base64UrlEncode(salt)}$${base64UrlEncode(derivedKey)}`;
}

/**
 * Verify mật khẩu.
 *
 * Input:
 * - password: mật khẩu plain text người dùng nhập
 * - stored: giá trị lưu trong DB (User.password)
 *
 * Output:
 * - true nếu đúng, false nếu sai
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith("scrypt$")) {
    // Fallback dev: nếu DB đang lưu plain text.
    return password === stored;
  }

  const parts = stored.split("$");
  if (parts.length !== 3) return false;
  const salt = base64UrlDecode(parts[1] ?? "");
  const expected = base64UrlDecode(parts[2] ?? "");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
