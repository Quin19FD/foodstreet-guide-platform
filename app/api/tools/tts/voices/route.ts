import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/tools/tts/voices?language=vi
 * Returns list of available TTS voices for the specified language
 * 
 * Uses Google Cloud Text-to-Speech API (free tier: 4M chars/month for Standard voices)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get("language")?.toLowerCase() ?? "vi";
  
  // Static voice list for common languages
  // In production, you would call Google Cloud TTS list_voices API
  const voicesByLanguage: Record<string, Array<{
    name: string;
    gender: "MALE" | "FEMALE" | "NEUTRAL";
    type: "Standard" | "WaveNet" | "Neural2";
    languageCode: string;
  }>> = {
    "vi": [
      { name: "vi-VN-Standard-A", gender: "FEMALE", type: "Standard", languageCode: "vi-VN" },
      { name: "vi-VN-Standard-B", gender: "MALE", type: "Standard", languageCode: "vi-VN" },
      { name: "vi-VN-Standard-C", gender: "FEMALE", type: "Standard", languageCode: "vi-VN" },
      { name: "vi-VN-Standard-D", gender: "MALE", type: "Standard", languageCode: "vi-VN" },
      { name: "vi-VN-Wavenet-A", gender: "FEMALE", type: "WaveNet", languageCode: "vi-VN" },
      { name: "vi-VN-Wavenet-B", gender: "MALE", type: "WaveNet", languageCode: "vi-VN" },
      { name: "vi-VN-Wavenet-C", gender: "FEMALE", type: "WaveNet", languageCode: "vi-VN" },
      { name: "vi-VN-Wavenet-D", gender: "MALE", type: "WaveNet", languageCode: "vi-VN" },
    ],
    "en": [
      { name: "en-US-Standard-A", gender: "MALE", type: "Standard", languageCode: "en-US" },
      { name: "en-US-Standard-B", gender: "MALE", type: "Standard", languageCode: "en-US" },
      { name: "en-US-Standard-C", gender: "FEMALE", type: "Standard", languageCode: "en-US" },
      { name: "en-US-Standard-D", gender: "MALE", type: "Standard", languageCode: "en-US" },
      { name: "en-US-Standard-E", gender: "FEMALE", type: "Standard", languageCode: "en-US" },
      { name: "en-US-Wavenet-A", gender: "MALE", type: "WaveNet", languageCode: "en-US" },
      { name: "en-US-Wavenet-B", gender: "MALE", type: "WaveNet", languageCode: "en-US" },
      { name: "en-US-Wavenet-C", gender: "FEMALE", type: "WaveNet", languageCode: "en-US" },
      { name: "en-US-Wavenet-D", gender: "MALE", type: "WaveNet", languageCode: "en-US" },
      { name: "en-US-Wavenet-E", gender: "FEMALE", type: "WaveNet", languageCode: "en-US" },
      { name: "en-US-Neural2-A", gender: "MALE", type: "Neural2", languageCode: "en-US" },
      { name: "en-US-Neural2-C", gender: "FEMALE", type: "Neural2", languageCode: "en-US" },
    ],
    "zh": [
      { name: "cmn-CN-Standard-A", gender: "FEMALE", type: "Standard", languageCode: "cmn-CN" },
      { name: "cmn-CN-Standard-B", gender: "MALE", type: "Standard", languageCode: "cmn-CN" },
      { name: "cmn-CN-Standard-C", gender: "MALE", type: "Standard", languageCode: "cmn-CN" },
      { name: "cmn-CN-Standard-D", gender: "FEMALE", type: "Standard", languageCode: "cmn-CN" },
      { name: "cmn-CN-Wavenet-A", gender: "FEMALE", type: "WaveNet", languageCode: "cmn-CN" },
      { name: "cmn-CN-Wavenet-B", gender: "MALE", type: "WaveNet", languageCode: "cmn-CN" },
      { name: "cmn-CN-Wavenet-C", gender: "MALE", type: "WaveNet", languageCode: "cmn-CN" },
      { name: "cmn-CN-Wavenet-D", gender: "FEMALE", type: "WaveNet", languageCode: "cmn-CN" },
    ],
    "ko": [
      { name: "ko-KR-Standard-A", gender: "FEMALE", type: "Standard", languageCode: "ko-KR" },
      { name: "ko-KR-Standard-B", gender: "FEMALE", type: "Standard", languageCode: "ko-KR" },
      { name: "ko-KR-Standard-C", gender: "MALE", type: "Standard", languageCode: "ko-KR" },
      { name: "ko-KR-Standard-D", gender: "MALE", type: "Standard", languageCode: "ko-KR" },
      { name: "ko-KR-Wavenet-A", gender: "FEMALE", type: "WaveNet", languageCode: "ko-KR" },
      { name: "ko-KR-Wavenet-B", gender: "FEMALE", type: "WaveNet", languageCode: "ko-KR" },
      { name: "ko-KR-Wavenet-C", gender: "MALE", type: "WaveNet", languageCode: "ko-KR" },
      { name: "ko-KR-Wavenet-D", gender: "MALE", type: "WaveNet", languageCode: "ko-KR" },
    ],
    "ja": [
      { name: "ja-JP-Standard-A", gender: "FEMALE", type: "Standard", languageCode: "ja-JP" },
      { name: "ja-JP-Standard-B", gender: "FEMALE", type: "Standard", languageCode: "ja-JP" },
      { name: "ja-JP-Standard-C", gender: "MALE", type: "Standard", languageCode: "ja-JP" },
      { name: "ja-JP-Standard-D", gender: "MALE", type: "Standard", languageCode: "ja-JP" },
      { name: "ja-JP-Wavenet-A", gender: "FEMALE", type: "WaveNet", languageCode: "ja-JP" },
      { name: "ja-JP-Wavenet-B", gender: "FEMALE", type: "WaveNet", languageCode: "ja-JP" },
      { name: "ja-JP-Wavenet-C", gender: "MALE", type: "WaveNet", languageCode: "ja-JP" },
      { name: "ja-JP-Wavenet-D", gender: "MALE", type: "WaveNet", languageCode: "ja-JP" },
    ],
  };
  
  // Normalize language code
  const normalizedLang = language.split("-")[0].toLowerCase();
  
  const voices = voicesByLanguage[normalizedLang] || [];
  
  return NextResponse.json({
    language,
    voices,
    total: voices.length,
    note: voices.length === 0
      ? "No voices found for this language. Try: vi, en, zh, ko, ja"
      : undefined
  });
}
