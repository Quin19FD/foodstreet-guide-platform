"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

let clientSocket: Socket | null = null;

export function CustomerOnlineCounter() {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      const boot = await fetch("/api/socket", { method: "GET" }).catch(() => null);
      const bootData = (await boot?.json().catch(() => null)) as { total?: number } | null;
      if (typeof bootData?.total === "number" && mounted) {
        setOnlineCount(bootData.total);
      }

      if (!clientSocket) {
        clientSocket = io({
          path: "/api/socket_io",
          transports: ["websocket", "polling"],
          autoConnect: false,
        });
      }

      const onCount = (count: number) => {
        if (mounted) setOnlineCount(count);
      };

      const onConnect = () => {
        clientSocket?.emit("customer_online_count_request");
      };

      clientSocket.on("customer_online_count", onCount);
      clientSocket.on("connect", onConnect);
      clientSocket.connect();

      return () => {
        clientSocket?.off("customer_online_count", onCount);
        clientSocket?.off("connect", onConnect);
      };
    };

    const cleanupPromise = setupSocket();

    return () => {
      mounted = false;
      void cleanupPromise.then((cleanup) => cleanup?.());
      clientSocket?.disconnect();
      clientSocket = null;
    };
  }, []);

  return (
    <div className="fixed bottom-[calc(5.4rem+env(safe-area-inset-bottom))] right-3 z-50 rounded-full border border-emerald-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-md backdrop-blur md:bottom-4 md:right-4">
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" />
        <span>
          Đang truy cập: <strong>{onlineCount}</strong>
        </span>
      </div>
    </div>
  );
}
