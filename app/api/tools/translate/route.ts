import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const MAX_CHUNK_CHARS = 700;
const MAX_DIRECT_PROVIDER_CHARS = 1200;

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

  if (normalized.length === 3 && iso639Map[normalized]) {
    return iso639Map[normalized];
  }

  const baseCode = normalized.split("-")[0];

  if (baseCode === "zh" || baseCode === "chinese") {
    if (normalized === "zh-tw" || normalized === "zh-hant") return "zh-TW";
    return "zh";
  }

  return baseCode.length === 2 ? baseCode : normalized.slice(0, 2);
}

function splitLongSentence(sentence: string, maxChars: number): string[] {
  const parts: string[] = [];
  let remaining = sentence.trim();

  while (remaining.length > maxChars) {
    let splitAt = remaining.lastIndexOf(" ", maxChars);
    if (splitAt < Math.floor(maxChars * 0.5)) {
      splitAt = maxChars;
    }
    parts.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) parts.push(remaining);
  return parts;
}

function splitTextIntoChunks(text: string, maxChars: number): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  const pushPiece = (piece: string) => {
    const trimmed = piece.trim();
    if (!trimmed) return;

    if (!current) {
      current = trimmed;
      return;
    }

    const candidate = `${current}\n\n${trimmed}`;
    if (candidate.length <= maxChars) {
      current = candidate;
      return;
    }

    chunks.push(current);
    current = trimmed;
  };

  const pushSentence = (sentence: string) => {
    const trimmed = sentence.trim();
    if (!trimmed) return;

    if (trimmed.length > maxChars) {
      for (const part of splitLongSentence(trimmed, maxChars)) {
        pushPiece(part);
      }
      return;
    }

    if (!current) {
      current = trimmed;
      return;
    }

    const candidate = `${current} ${trimmed}`;
    if (candidate.length <= maxChars) {
      current = candidate;
      return;
    }

    chunks.push(current);
    current = trimmed;
  };

  for (const paragraph of paragraphs.length > 0 ? paragraphs : [text.trim()]) {
    if (paragraph.length <= maxChars) {
      pushPiece(paragraph);
      continue;
    }

    const sentences = paragraph
      .split(/(?<=[.!?。！？])\s+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (sentences.length <= 1) {
      for (const part of splitLongSentence(paragraph, maxChars)) {
        pushPiece(part);
      }
      continue;
    }

    for (const sentence of sentences) {
      pushSentence(sentence);
    }
  }

  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

async function tryMyMemory(
  q: string,
  source: string,
  target: string
): Promise<TranslateResult | null> {
  try {
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

    const status = data?.responseStatus;
    if (status === 403 || status === "403") {
      return null;
    }

    let translatedText = data?.responseData?.translatedText?.trim();

    if (!translatedText || translatedText.includes("MYMEMORY WARNING")) {
      if (data?.matches && data.matches.length > 0) {
        translatedText = data.matches[0].translation.trim();
      }
    }

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
        5000
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

    if (normalizedSource === "zh-TW") normalizedSource = "zh_HANT";
    if (normalizedTarget === "zh-TW") normalizedTarget = "zh_HANT";

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

async function tryGoogleTranslateWeb(
  q: string,
  source: string,
  target: string
): Promise<TranslateResult | null> {
  try {
    const normalizedSource = normalizeLanguageCode(source);
    const normalizedTarget = normalizeLanguageCode(target);

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(normalizedSource)}&tl=${encodeURIComponent(normalizedTarget)}&dt=t&q=${encodeURIComponent(q)}`;

    const res = await fetchWithTimeout(url, { method: "GET" }, 10000);
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as
      | [Array<[string, string?, unknown?, unknown?]>, ...unknown[]]
      | null;

    const parts = data?.[0];
    if (!Array.isArray(parts) || parts.length === 0) return null;

    const translatedText = parts
      .map((item) => (Array.isArray(item) ? String(item[0] ?? "") : ""))
      .join("")
      .trim();

    if (!translatedText || translatedText === q) return null;
    return { translatedText, provider: "google-web" };
  } catch {
    return null;
  }
}

async function tryGeminiTranslate(
  q: string,
  source: string,
  target: string
): Promise<TranslateResult | null> {
  const apiKey = process.env.GOOGLE_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  try {
    const normalizedSource = normalizeLanguageCode(source);
    const normalizedTarget = normalizeLanguageCode(target);

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
      hi: "Hindi",
      it: "Italian",
    };

    const sourceName = languageNames[normalizedSource] || normalizedSource;
    const targetName = languageNames[normalizedTarget] || normalizedTarget;

    const prompt = `Translate the following text from ${sourceName} to ${targetName}.\nOnly provide the translation, no explanations or additional text.\n\nText to translate:\n${q}`;

    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      },
      15000
    );

    if (!response.ok) return null;

    const data = (await response.json().catch(() => null)) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    } | null;

    const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!translatedText || translatedText === q) {
      return null;
    }

    return { translatedText, provider: "gemini" };
  } catch {
    return null;
  }
}

async function translateSingleSegment(
  q: string,
  source: string,
  target: string
): Promise<TranslateResult | null> {
  const preferPostOnly = q.length > MAX_DIRECT_PROVIDER_CHARS;

  const tries = preferPostOnly
    ? [
        () => tryGeminiTranslate(q, source, target),
        () => tryLibreTranslate(q, source, target),
      ]
    : [
        () => tryGeminiTranslate(q, source, target),
        () => tryGoogleTranslateWeb(q, source, target),
        () => tryLingvaTranslate(q, source, target),
        () => tryMyMemory(q, source, target),
        () => tryLibreTranslate(q, source, target),
      ];

  for (const run of tries) {
    const result = await run();
    if (result?.translatedText) return result;
  }

  return null;
}

async function translateWithChunking(
  q: string,
  source: string,
  target: string
): Promise<TranslateResult | null> {
  if (q.length <= MAX_CHUNK_CHARS) {
    return translateSingleSegment(q, source, target);
  }

  const chunks = splitTextIntoChunks(q, MAX_CHUNK_CHARS);
  if (chunks.length <= 1) {
    return translateSingleSegment(q, source, target);
  }

  const translatedChunks: string[] = [];
  const providers = new Set<string>();

  for (const chunk of chunks) {
    const result = await translateSingleSegment(chunk, source, target);
    if (!result?.translatedText) {
      return null;
    }
    translatedChunks.push(result.translatedText);
    providers.add(result.provider);
  }

  return {
    translatedText: translatedChunks.join("\n\n"),
    provider: providers.size === 1 ? `${Array.from(providers)[0]}:chunked` : "mixed:chunked",
  };
}

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

  const result = await translateWithChunking(q, normalizedSource, normalizedTarget);
  if (result?.translatedText) {
    return NextResponse.json(result);
  }

  return jsonError(
    502,
    "Không thể dịch tự động ở thời điểm hiện tại. Vui lòng thử lại sau vài phút."
  );
}
