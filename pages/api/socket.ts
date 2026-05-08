import type { NextApiRequest, NextApiResponse } from "next";

import { ensureCustomerExists } from "@/app/api/customer/_shared";
import {
  getOnlineCustomerCount,
  markCustomerOnline,
} from "@/infrastructure/realtime/customer-online-store";
import { CUSTOMER_AUTH_COOKIES } from "@/infrastructure/security/auth-cookies";
import { verifyCustomerAccessToken } from "@/infrastructure/security/auth";

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};

  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValueParts] = part.split("=");
    const key = rawKey?.trim();
    if (!key) return acc;

    const rawValue = rawValueParts.join("=").trim();
    try {
      acc[key] = decodeURIComponent(rawValue);
    } catch {
      acc[key] = rawValue;
    }
    return acc;
  }, {});
}

function getBearerToken(req: NextApiRequest): string | null {
  const raw = req.headers.authorization;
  if (!raw) return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function resolvePresenceId(req: NextApiRequest): string {
  const rawHeader = req.headers["x-presence-id"];
  if (typeof rawHeader === "string") return rawHeader.trim();
  if (Array.isArray(rawHeader) && rawHeader[0]) return rawHeader[0].trim();
  return "";
}

async function resolveCustomerUserId(req: NextApiRequest): Promise<string | null> {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[CUSTOMER_AUTH_COOKIES.access] ?? getBearerToken(req);
  if (!token) return null;

  try {
    const payload = verifyCustomerAccessToken(token);
    const user = await ensureCustomerExists(payload.sub);
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const total = await getOnlineCustomerCount();
    res.status(200).json({ ok: true, total });
    return;
  }

  if (req.method === "POST") {
    const presenceId = resolvePresenceId(req);
    if (!presenceId) {
      res.status(400).json({ ok: false, error: "Missing presence id" });
      return;
    }

    const userId = await resolveCustomerUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, error: "Chưa đăng nhập" });
      return;
    }

    const total = await markCustomerOnline(userId, presenceId);
    res.status(200).json({ ok: true, total });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ ok: false, error: "Method not allowed" });
}
