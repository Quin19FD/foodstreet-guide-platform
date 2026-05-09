import {
  getOnlineCountChannel,
  getOnlineCustomerCount,
  getUpstashConfig,
  isUpstashConfigured,
} from "@/infrastructure/realtime/customer-online-store";
import type { NextApiRequest, NextApiResponse } from "next";

// Viết sự kiện SSE theo định dạng:
// event: <event-name>
// data: <payload>
function writeEvent(res: NextApiResponse, event: string, payload: string) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${payload}\n\n`);
}

// Phân tích dòng dữ liệu từ Upstash subscribe event để lấy số lượng online
function parseCountFromUpstashLine(line: string): number | null {
  if (!line.startsWith("data:")) return null;
  const raw = line.slice(5).trim();
  if (!raw) return null;

  // Upstash subscribe event format:
  // data: message,<channel>,<payload>
  if (!raw.startsWith("message,")) return null;
  const parts = raw.split(",");
  const payload = parts.slice(2).join(",").trim();
  if (!payload) return null;
  const count = Number.parseInt(payload, 10);
  return Number.isFinite(count) ? count : null;
}

// API route này cung cấp một stream SSE để gửi cập nhật số lượng khách hàng online theo thời gian thực
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.status(200);
  res.flushHeaders?.();

  let stopped = false;
  let lastCount = -1;
  const pingTimer = setInterval(() => {
    if (stopped) return;
    res.write(": ping\n\n");
  }, 15_000);

  // Hàm này sẽ lấy số lượng online mới nhất và gửi đến client nếu có sự thay đổi
  const pushCount = async () => {
    const count = await getOnlineCustomerCount();
    if (count === lastCount || stopped) return;
    lastCount = count;
    writeEvent(res, "count", String(count));
  };

  await pushCount();

  let fallbackTimer: NodeJS.Timeout | null = null;
  // Nếu Upstash không được cấu hình hoặc có lỗi xảy ra, chúng ta sẽ sử dụng polling để cập nhật số lượng online mỗi 2 giây
  const startPollingFallback = () => {
    if (fallbackTimer || stopped) return;
    fallbackTimer = setInterval(() => {
      void pushCount();
    }, 2_000);
  };

  // Hàm này sẽ dọn dẹp tài nguyên khi client ngắt kết nối
  const stop = () => {
    stopped = true;
    clearInterval(pingTimer);
    if (fallbackTimer) clearInterval(fallbackTimer);
    res.end();
  };

  req.on("close", stop);
  req.on("aborted", stop);

  if (!isUpstashConfigured()) {
    startPollingFallback();
    return;
  }

  //Cập nhật số lượng online theo thời gian thực bằng cách subscribe vào kênh của Upstash
  const config = getUpstashConfig();
  if (!config) {
    startPollingFallback();
    return;
  }

  const subscribeUrl = `${config.url}/subscribe/${encodeURIComponent(getOnlineCountChannel())}`;
  const controller = new AbortController();
  req.on("close", () => controller.abort());
  req.on("aborted", () => controller.abort());

  try {
    const upstream = await fetch(subscribeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "text/event-stream",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!upstream.ok || !upstream.body) {
      startPollingFallback();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // Đọc dữ liệu từ stream của Upstash và gửi sự kiện đến client khi có cập nhật số lượng online mới
    while (!stopped) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const count = parseCountFromUpstashLine(line);
        if (count === null || count === lastCount || stopped) continue;
        lastCount = count;
        writeEvent(res, "count", String(count));
      }
    }

    if (!stopped) {
      startPollingFallback();
    }
  } catch {
    startPollingFallback();
  }
}
