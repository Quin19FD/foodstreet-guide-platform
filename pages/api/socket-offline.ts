import { markCustomerOffline } from "@/infrastructure/realtime/customer-online-store";
import type { NextApiRequest, NextApiResponse } from "next";

function resolvePresenceId(req: NextApiRequest): string {
  const fromQuery = typeof req.query.presenceId === "string" ? req.query.presenceId.trim() : "";
  if (fromQuery) return fromQuery;

  const rawHeader = req.headers["x-presence-id"];
  if (typeof rawHeader === "string") return rawHeader.trim();
  if (Array.isArray(rawHeader) && rawHeader[0]) return rawHeader[0].trim();
  return "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const presenceId = resolvePresenceId(req);
  if (!presenceId) {
    res.status(400).json({ ok: false, error: "Missing presence id" });
    return;
  }

  const total = await markCustomerOffline(presenceId);
  res.status(200).json({ ok: true, total });
}
