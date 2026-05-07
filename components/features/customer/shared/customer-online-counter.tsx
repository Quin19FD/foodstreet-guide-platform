"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";

// Socket.IO requires a persistent Node.js server (not compatible with Vercel serverless).
// We fall back to HTTP polling which works everywhere.
export function CustomerOnlineCounter() {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let shouldHeartbeat = true;
    let eventSource: EventSource | null = null;
    const storageKey = "customer_presence_id";

    const createPresenceId = () => {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
      return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    };

    const resolvePresenceId = () => {
      try {
        const current = window.localStorage.getItem(storageKey);
        if (current) return current;
        const created = createPresenceId();
        window.localStorage.setItem(storageKey, created);
        return created;
      } catch {
        return createPresenceId();
      }
    };

    const presenceId = resolvePresenceId();

    const openStream = () => {
      if (typeof window === "undefined") return;
      eventSource?.close();
      eventSource = new EventSource("/api/socket-stream");
      eventSource.addEventListener("count", (event) => {
        const next = Number.parseInt((event as MessageEvent<string>).data, 10);
        if (!Number.isFinite(next) || !mounted) return;
        setOnlineCount(next);
      });
    };

    const loadCount = async () => {
      const res = await fetch("/api/socket", {
        method: "GET",
        cache: "no-store",
      }).catch(() => null);
      const data = (await res?.json().catch(() => null)) as { total?: number } | null;
      if (typeof data?.total === "number" && mounted) {
        setOnlineCount(data.total);
      }
    };

    const refreshCount = async () => {
      if (shouldHeartbeat) {
        const res = await fetch("/api/socket", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "x-presence-id": presenceId,
          },
        }).catch(() => null);
        const data = (await res?.json().catch(() => null)) as { total?: number } | null;
        if (typeof data?.total === "number") {
          if (mounted) setOnlineCount(data.total);
          return;
        }

        if (res?.status === 401 || res?.status === 403) {
          shouldHeartbeat = false;
        }
      }

      await loadCount();
    };

    void loadCount();
    void refreshCount();
    openStream();

    const sendOfflineSignal = () => {
      const url = `/api/socket-offline?presenceId=${encodeURIComponent(presenceId)}`;
      const queued = navigator.sendBeacon?.(url);
      if (queued) return;

      void fetch(url, {
        method: "POST",
        keepalive: true,
        cache: "no-store",
      }).catch(() => null);
    };

    const onPageHide = () => {
      sendOfflineSignal();
    };
    window.addEventListener("pagehide", onPageHide);

    const interval = window.setInterval(() => {
      void refreshCount();
    }, 15_000);

    return () => {
      mounted = false;
      eventSource?.close();
      sendOfflineSignal();
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(interval);
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

