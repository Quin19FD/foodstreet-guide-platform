import {
  getOnlineCustomerCount,
  registerCustomerSocket,
  unregisterCustomerSocket,
} from "@/infrastructure/realtime/customer-online-store";
import { CUSTOMER_AUTH_COOKIES, verifyCustomerAccessToken } from "@/infrastructure/security/auth";
import type { NextApiResponseServerIO } from "@/types/next-socket";
import type { NextApiRequest } from "next";
import { Server as IOServer } from "socket.io";

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey || rest.length === 0) return acc;
    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

export default function handler(_req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/api/socket_io",
      addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const accessToken = cookies[CUSTOMER_AUTH_COOKIES.access];

      if (!accessToken) {
        socket.disconnect();
        return;
      }

      try {
        const payload = verifyCustomerAccessToken(accessToken);
        const total = registerCustomerSocket(payload.sub, socket.id);
        io.emit("customer_online_count", total);

        socket.on("customer_online_count_request", () => {
          socket.emit("customer_online_count", getOnlineCustomerCount());
        });

        socket.on("disconnect", () => {
          const nextTotal = unregisterCustomerSocket(socket.id);
          io.emit("customer_online_count", nextTotal);
        });
      } catch {
        socket.disconnect();
      }
    });

    res.socket.server.io = io;
  }

  res.status(200).json({ ok: true, total: getOnlineCustomerCount() });
}
