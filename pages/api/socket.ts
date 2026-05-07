import {
  getOnlineCustomerCount,
  markCustomerOnline,
} from "@/infrastructure/realtime/customer-online-store";
import { CUSTOMER_AUTH_COOKIES, verifyCustomerAccessToken } from "@/infrastructure/security/auth";
import type { NextApiRequest, NextApiResponse } from "next";

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey || rest.length === 0) return acc;
    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function resolveCustomerUserId(req: NextApiRequest): string | null {
  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies[CUSTOMER_AUTH_COOKIES.access];
  if (!accessToken) return null;

  try {
    const payload = verifyCustomerAccessToken(accessToken);
    return payload.sub;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const total = await getOnlineCustomerCount();
    res.status(200).json({ ok: true, total });
    return;
  }

  if (req.method === "POST") {
    const userId = resolveCustomerUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const rawPresenceId = req.headers["x-presence-id"];
    const presenceId =
      typeof rawPresenceId === "string"
        ? rawPresenceId.trim()
        : Array.isArray(rawPresenceId)
          ? rawPresenceId[0]?.trim()
          : "";

    if (!presenceId) {
      res.status(400).json({ ok: false, error: "Missing presence id" });
      return;
    }

    const total = await markCustomerOnline(userId, presenceId);
    res.status(200).json({ ok: true, total });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ ok: false, error: "Method not allowed" });
}
