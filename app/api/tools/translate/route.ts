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

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Normalize language codes to standard format
 * Examples: zh-CN → zh, en-US → en, zho → zh, eng → en
 */
function normalizeLanguageCode(code: string): string {
  const normalized = code.trim().toLowerCase();

  // ISO 639-2/3 to ISO 639-1 mapping
  const iso639Map: Record<string, string> = {
    vie: "vi",
    eng: "en",
    fra: "fr",
    fre: "fr",
    deu: "de",
    ger: "de",
    jpn: "ja",
    kor: "ko",
    zho: "zh",
    chi: "zh",
    tha: "th",
    spa: "es",
    por: "pt",
    ita: "it",
    rus: "ru",
    ara: "ar",
    hin: "hi",
    ind: "id",
    msa: "ms",
    nld: "nl",
    dut: "nl",
    pol: "pl",
    tur: "tr",
    ukr: "uk",
    ces: "cs",
    cze: "cs",
    swe: "sv",
    dan: "da",
    nor: "no",
    fin: "fi",
    hun: "hu",
    ell: "el",
    gre: "el",
    heb: "he",
    rum: "ro",
    ron: "ro",
  };

  // If it's a 3-letter code, map it
  if (normalized.length === 3 && iso639Map[normalized]) {
    return iso639Map[normalized];
  }

  // Handle locale codes like zh-CN, en-US, pt-BR
  const baseCode = normalized.split("-")[0];

  // Special handling for Chinese variants
  if (baseCode === "zh" || baseCode === "chinese") {
    if (normalized === "zh-tw" || normalized === "zh-hant") return "zh-TW";
    return "zh";
  }

  // Return the base 2-letter code
  return baseCode.length === 2 ? baseCode : normalized.slice(0, 2);
}

async function tryMyMemory(
  q: string,
  source: string,
  target: string
): Promise<TranslateResult | null> {
  try {
    // Normalize language codes
    const normalizedSource = normalizeLanguageCode(source);
    const normalizedTarget = normalizeLanguageCode(target);

    const url =
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}` +
      `&langpair=${encodeURIComponent(normalizedSource)}|${encodeURIComponent(normalizedTarget)}`;

    const res = await fetchWithTimeout(url, { method: "GET" }, 15000);
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as {
      responseData?: { translatedText?: string };
      responseStatus?: number | string;
      matches?: Array<{ translation: string }>;
    } | null;

    // Check for quota exceeded or errors
    const status = data?.responseStatus;
    if (status === 403 || status === "403") {
      return null;
    }

    let translatedText = data?.responseData?.translatedText?.trim();

    // If main response is empty or looks like an error, try matches
    if (!translatedText || translatedText.includes("MYMEMORY WARNING")) {
      if (data?.matches && data.matches.length > 0) {
        translatedText = data.matches[0].translation.trim();
      }
    }

    // Filter out obvious bad translations
    if (
      !translatedText ||
      translatedText.includes("MYMEMORY WARNING") ||
      translatedText.includes("PLEASE SELECT LANGUAGE") ||
      translatedText === q
    ) {
      return null;
    }

    return { translatedText, provider: "mymemory" };
  } catch {
    return null;
  }
}

async function tryLibreTranslate(
  q: string,
  source: string,
  target: string
): Promise<TranslateResult | null> {
  const configured = process.env.LIBRETRANSLATE_BASE_URL?.trim() ?? "";

  // Updated endpoints - more reliable ones
  const defaultEndpoints = [
    "https://libretranslate.com",
    "https://translate.argosopentech.com",
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

  // Normalize language codes for LibreTranslate
  const normalizedSource = normalizeLanguageCode(source);
  const normalizedTarget = normalizeLanguageCode(target);

  for (const endpoint of endpoints) {
    try {
      const res = await fetchWithTimeout(
        `${endpoint.replace(/\/$/, "")}/translate`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            q,
            source: normalizedSource,
            target: normalizedTarget,
            format: "text",
            ...(apiKey ? { api_key: apiKey } : {}),
          }),
        },
        3000 // 3 second timeout per endpoint to avoid blocking route
      );

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

async function tryLingvaTranslate(
  q: string,
  source: string,
  target: string
): Promise<TranslateResult | null> {
  try {
    let normalizedSource = normalizeLanguageCode(source);
    let normalizedTarget = normalizeLanguageCode(target);

    // Lingva ML uses specific codes for Chinese variants
    if (normalizedSource === "zh-TW") normalizedSource = "zh_HANT";
    if (normalizedTarget === "zh-TW") normalizedTarget = "zh_HANT";

    // Lingva ML is a free, open-source alternative
    const url = `https://lingva.ml/api/v1/${encodeURIComponent(normalizedSource)}/${encodeURIComponent(normalizedTarget)}/${encodeURIComponent(q)}`;

    const res = await fetchWithTimeout(url, { method: "GET" }, 15000);
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as { translation?: string } | null;
    const translatedText = data?.translation?.trim();

    if (!translatedText) return null;
    return { translatedText, provider: "lingva" };
  } catch {
    return null;
  }
}

/**
 * Google Gemini Translation Provider
 * Uses Google AI Studio (Gemini) for translation
 * Free tier available - check limits in AI Studio
 */
async function tryGeminiTranslate(
  q: string,
  source: string,
  target: string
): Promise<TranslateResult | null> {
  const apiKey = process.env.GOOGLE_API_KEY?.trim();

  if (!apiKey) {
    return null; // Skip if no API key configured
  }

  try {
    const normalizedSource = normalizeLanguageCode(source);
    const normalizedTarget = normalizeLanguageCode(target);

    // Language name mapping for better prompts
    const languageNames: Record<string, string> = {
      vi: "Vietnamese",
      en: "English",
      zh: "Chinese (Simplified)",
      "zh-TW": "Chinese (Traditional)",
      ko: "Korean",
      ja: "Japanese",
      fr: "French",
      de: "German",
      es: "Spanish",
      pt: "Portuguese",
      ru: "Russian",
      ar: "Arabic",
      th: "Thai",
      id: "Indonesian",
      ms: "Malay",
    };

    const sourceName = languageNames[normalizedSource] || normalizedSource;
    const targetName = languageNames[normalizedTarget] || normalizedTarget;

    const prompt = `Translate the following text from ${sourceName} to ${targetName}. 
Only provide the translation, no explanations or additional text.

Text to translate:
${q}`;

    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1, // Low temperature for more consistent translations
            maxOutputTokens: 2048,
          },
        }),
      },
      15000
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!translatedText || translatedText === q) {
      return null;
    }

    return { translatedText, provider: "gemini" };
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

  const normalizedSource = normalizeLanguageCode(source);
  const normalizedTarget = normalizeLanguageCode(target);

  // Order: Gemini (Best Quality MT), Lingva (Google Translate MT), MyMemory (Memory/TM), LibreTranslate
  const tries = [
    () => tryGeminiTranslate(q, normalizedSource, normalizedTarget),
    () => tryLingvaTranslate(q, normalizedSource, normalizedTarget),
    () => tryMyMemory(q, normalizedSource, normalizedTarget),
    () => tryLibreTranslate(q, normalizedSource, normalizedTarget),
  ];

  for (const run of tries) {
    const result = await run();
    if (result?.translatedText) return NextResponse.json(result);
  }

  return jsonError(
    502,
    "Không thể dịch tự động ở thời điểm hiện tại. Vui lòng thử lại sau vài phút."
  );
}
