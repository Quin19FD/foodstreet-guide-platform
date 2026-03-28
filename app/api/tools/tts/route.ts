import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type TTSBody = {
  text: string;
  language?: string; // e.g., "vi", "en", "zh", "ko", "ja"
  voice?: string; // e.g., "vi-VN-Standard-A"
  gender?: "MALE" | "FEMALE" | "NEUTRAL";
};

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/**
 * GET /api/tools/tts?text=...&lang=vi
 * Proxy Google Translate TTS — trả về audio/mpeg stream.
 * Dùng cho client-side Audio element (tránh CORS).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text")?.trim() ?? "";
  const lang = searchParams.get("lang")?.trim().toLowerCase() ?? "vi";

  if (!text) {
    return new NextResponse("Missing text", { status: 400 });
  }
  if (text.length > 500) {
    return new NextResponse("Text too long", { status: 400 });
  }

  const tl = lang.split("-")[0];
  const googleUrl =
    `https://translate.google.com/translate_tts?ie=UTF-8` +
    `&tl=${encodeURIComponent(tl)}` +
    `&client=tw-ob` +
    `&q=${encodeURIComponent(text)}`;

  try {
    const upstream = await fetch(googleUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });

    if (!upstream.ok) {
      return new NextResponse("TTS upstream error", { status: 502 });
    }

    const audioBuffer = await upstream.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.byteLength),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("TTS fetch failed", { status: 502 });
  }
}

/**
 * POST /api/tools/tts
 * Convert text to speech using Google Cloud Text-to-Speech API
 *
 * Body: { text, language?, voice?, gender? }
 * Returns: { audioContent: base64, audioFormat: "mp3" }
 *
 * FREE TIER: 4M chars/month (Standard), 1M chars/month (WaveNet)
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as TTSBody | null;

  const text = body?.text?.trim() ?? "";
  const language = body?.language?.toLowerCase() ?? "vi";
  const voice = body?.voice;
  const gender = (body?.gender ?? "FEMALE") as "MALE" | "FEMALE" | "NEUTRAL";

  if (!text) {
    return jsonError(400, "Thiếu nội dung cần chuyển đổi");
  }

  if (text.length > 5000) {
    return jsonError(400, "Nội dung quá dài (tối đa 5000 ký tự)");
  }

  // Map language codes to Google TTS language codes
  const languageMap: Record<string, string> = {
    vi: "vi-VN",
    en: "en-US",
    zh: "cmn-CN",
    ko: "ko-KR",
    ja: "ja-JP",
  };

  const languageCode = languageMap[language.split("-")[0]] || "vi-VN";

  // Default voice selection based on language and gender
  const defaultVoices: Record<string, Record<string, string>> = {
    "vi-VN": { FEMALE: "vi-VN-Standard-A", MALE: "vi-VN-Standard-B" },
    "en-US": { FEMALE: "en-US-Standard-C", MALE: "en-US-Standard-B" },
    "cmn-CN": { FEMALE: "cmn-CN-Standard-A", MALE: "cmn-CN-Standard-B" },
    "ko-KR": { FEMALE: "ko-KR-Standard-A", MALE: "ko-KR-Standard-C" },
    "ja-JP": { FEMALE: "ja-JP-Standard-A", MALE: "ja-JP-Standard-C" },
  };

  const selectedVoice =
    voice || defaultVoices[languageCode]?.[gender] || `${languageCode}-Standard-A`;

  // Check if Google Cloud credentials are configured
  const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS;
  const apiKey = process.env.GOOGLE_TTS_API_KEY; // Alternative: API key

  if (!credentials && !apiKey) {
    // Fallback: proxy Google Translate TTS
    const tl = language.split("-")[0];
    const googleUrl =
      `https://translate.google.com/translate_tts?ie=UTF-8` +
      `&tl=${encodeURIComponent(tl)}` +
      `&client=tw-ob` +
      `&q=${encodeURIComponent(text.slice(0, 200))}`;

    try {
      const upstream = await fetch(googleUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/",
        },
      });

      if (upstream.ok) {
        const buffer = await upstream.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return NextResponse.json({
          audioContent: base64,
          audioFormat: "mp3",
          voice: "google-translate",
          language: tl,
        });
      }
    } catch {
      // fall through to error
    }

    return NextResponse.json({
      audioContent: null,
      audioFormat: "mp3",
      voice: selectedVoice,
      language: languageCode,
      error: "Chưa cấu hình Google Cloud TTS và không thể kết nối Google Translate.",
      developmentMode: true,
    });
  }

  try {
    // Call Google Cloud Text-to-Speech API
    const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-Goog-Api-Key": apiKey } : {}),
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode,
          name: selectedVoice,
          ssmlGender: gender,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
          pitch: 0.0,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Google TTS error:", error);
      return jsonError(502, "Không thể tạo audio. Vui lòng thử lại sau.");
    }

    const data = await response.json();

    return NextResponse.json({
      audioContent: data.audioContent, // Base64 encoded MP3
      audioFormat: "mp3",
      voice: selectedVoice,
      language: languageCode,
    });
  } catch (error) {
    console.error("TTS error:", error);
    return jsonError(500, "Lỗi khi tạo audio");
  }
}
