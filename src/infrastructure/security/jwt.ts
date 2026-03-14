/**
 * JWT (HS256) utilities - không dùng thư viện ngoài.
 *
 * Mục tiêu: ký/verify JWT cho access token (và có thể dùng cho các token khác).
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export type JwtHeader = {
  alg: "HS256";
  typ: "JWT";
};

export type JwtPayload = Record<string, unknown> & {
  iat: number;
  exp: number;
};

export type JwtVerifyResult<TPayload extends JwtPayload> = {
  header: JwtHeader;
  payload: TPayload;
};

function base64UrlEncode(input: Buffer | string): string {
  const buffer = typeof input === "string" ? Buffer.from(input) : input;
  return buffer.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecodeToBuffer(input: string): Buffer {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64");
}

function signHs256(data: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(data).digest();
  return base64UrlEncode(signature);
}

/**
 * Parse duration string về số giây.
 *
 * Input:
 * - duration: "15m" | "7d" | "3600" | "120s" | ...
 *
 * Output:
 * - number (seconds)
 */
export function parseDurationToSeconds(duration: string): number {
  const value = duration.trim();
  const match = value.match(/^(\d+)([smhd])?$/i);
  if (!match) {
    throw new Error(`Invalid duration: ${duration}`);
  }
  const amount = Number(match[1]);
  const unit = (match[2] ?? "s").toLowerCase();
  const multiplier = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
  return amount * multiplier;
}

/**
 * Ký JWT HS256.
 *
 * Input:
 * - payload: dữ liệu cần nhét vào token (sẽ được bổ sung iat/exp)
 * - secret: chuỗi bí mật (JWT_SECRET)
 * - expiresInSeconds: số giây token còn hiệu lực
 *
 * Output:
 * - string: JWT dạng "header.payload.signature"
 */
export function signJwtHs256<TPayload extends Record<string, unknown>>(input: {
  payload: TPayload;
  secret: string;
  expiresInSeconds: number;
  now?: Date;
}): string {
  const now = input.now ?? new Date();
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + input.expiresInSeconds;

  const header: JwtHeader = { alg: "HS256", typ: "JWT" };
  const payload: JwtPayload = { ...input.payload, iat, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = signHs256(data, input.secret);

  return `${data}.${signature}`;
}

/**
 * Verify JWT HS256.
 *
 * Input:
 * - token: JWT string
 * - secret: JWT_SECRET
 *
 * Output:
 * - header + payload nếu hợp lệ
 *
 * Throws:
 * - Error nếu token sai format, sai chữ ký, hoặc hết hạn (exp < now)
 */
export function verifyJwtHs256<TPayload extends JwtPayload>(input: {
  token: string;
  secret: string;
  now?: Date;
}): JwtVerifyResult<TPayload> {
  const parts = input.token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = signHs256(data, input.secret);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid JWT signature");
  }

  const headerJson = base64UrlDecodeToBuffer(encodedHeader).toString("utf8");
  const payloadJson = base64UrlDecodeToBuffer(encodedPayload).toString("utf8");

  const header = JSON.parse(headerJson) as JwtHeader;
  const payload = JSON.parse(payloadJson) as TPayload;

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Unsupported JWT header");
  }

  const now = input.now ?? new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < nowSeconds) {
    throw new Error("JWT expired");
  }

  return { header, payload };
}
