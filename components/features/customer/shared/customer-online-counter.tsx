"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";

// Socket.IO requires a persistent Node.js server (not compatible with Vercel serverless).
// We fall back to HTTP polling which works everywhere.
export function CustomerOnlineCounter() {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const res = await fetch("/api/socket", { method: "GET" });
        const data = (await res.json()) as { total?: number };
        if (typeof data?.total === "number" && mounted) {
          setOnlineCount(data.total);
        }
      } catch {
        // silently ignore — counter is non-critical
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000); // poll every 30s

    return () => {
      mounted = false;
      clearInterval(interval);
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

