import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type TranslateBody = {
  q?: string;
  source?: string;
  target?: string;
};

type TranslateResult = {
  translatedText: string;
  provider: string;
};

function jsonError(status: number, error: string, extras?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extras }, { status });
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function tryLibreTranslate(q: string, source: string, target: string): Promise<TranslateResult | null> {
  const configured = process.env.LIBRETRANSLATE_BASE_URL?.trim() ?? "";
  const defaultEndpoints = [
    "https://translate.astian.org",
    "https://libretranslate.de",
  ];

  const endpoints = configured
    ? configured
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : defaultEndpoints;

  const apiKey = process.env.LIBRETRANSLATE_API_KEY?.trim() ?? "";

  for (const endpoint of endpoints) {
    try {
      const res = await fetchWithTimeout(`${endpoint.replace(/\/$/, "")}/translate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          q,
          source,
          target,
          format: "text",
          ...(apiKey ? { api_key: apiKey } : {}),
        }),
      });

      if (!res.ok) continue;
      const data = (await res.json().catch(() => null)) as { translatedText?: string } | null;
      const translatedText = data?.translatedText?.trim();
      if (translatedText) {
        return { translatedText, provider: `libretranslate:${endpoint}` };
      }
    } catch {
      // try next endpoint
    }
  }

  return null;
}

async function tryGooglePublic(q: string, source: string, target: string): Promise<TranslateResult | null> {
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(source)}` +
      `&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(q)}`;

    const res = await fetchWithTimeout(url, { method: "GET" });
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;

    const firstLayer = data[0] as Array<Array<unknown>>;
    const translatedText = firstLayer
      .map((row) => (Array.isArray(row) && typeof row[0] === "string" ? row[0] : ""))
      .join("")
      .trim();

    if (!translatedText) return null;
    return { translatedText, provider: "google-public" };
  } catch {
    return null;
  }
}

async function tryMyMemory(q: string, source: string, target: string): Promise<TranslateResult | null> {
  try {
    const url =
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}` +
      `&langpair=${encodeURIComponent(source)}|${encodeURIComponent(target)}`;

    const res = await fetchWithTimeout(url, { method: "GET" });
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as
      | { responseData?: { translatedText?: string } }
      | null;

    const translatedText = data?.responseData?.translatedText?.trim();
    if (!translatedText) return null;
    return { translatedText, provider: "mymemory" };
  } catch {
    return null;
  }
}

/**
 * POST /api/tools/translate
 * body: { q, source, target }
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as TranslateBody | null;

  const q = body?.q?.trim() ?? "";
  const source = body?.source?.trim().toLowerCase() ?? "";
  const target = body?.target?.trim().toLowerCase() ?? "";

  if (!q) return jsonError(400, "Thiếu nội dung cần dịch");
  if (!source || source.length < 2 || source.length > 10) {
    return jsonError(400, "Mã ngôn ngữ source không hợp lệ");
  }
  if (!target || target.length < 2 || target.length > 10) {
    return jsonError(400, "Mã ngôn ngữ target không hợp lệ");
  }

  if (source === target) {
    return NextResponse.json({ translatedText: q, provider: "identity" });
  }

  const tries = [
    () => tryLibreTranslate(q, source, target),
    () => tryGooglePublic(q, source, target),
    () => tryMyMemory(q, source, target),
  ];

  for (const run of tries) {
    const result = await run();
    if (result?.translatedText) return NextResponse.json(result);
  }

  return jsonError(502, "Không thể dịch tự động ở thời điểm hiện tại");
}
