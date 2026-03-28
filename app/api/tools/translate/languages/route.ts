import { NextResponse } from "next/server";

type Language = { code: string; name: string; nativeName: string };

/**
 * GET /api/tools/translate/languages
 * Returns list of supported languages for translation
 */
export async function GET() {
  const languages: Language[] = [
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
    { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "ko", name: "Korean", nativeName: "한국어" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "it", name: "Italian", nativeName: "Italiano" },
    { code: "pt", name: "Portuguese", nativeName: "Português" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "hi", name: "Hindi", nativeName: "हिंदी" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "ms", name: "Malay", nativeName: "Melayu" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
    { code: "pl", name: "Polish", nativeName: "Polski" },
    { code: "el", name: "Greek", nativeName: "Ελληνικά" },
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
    { code: "th", name: "Thai", nativeName: "ไทย" },
    { code: "ur", name: "Urdu", nativeName: "اردو" },
    { code: "fa", name: "Persian", nativeName: "فارسی" },
    { code: "he", name: "Hebrew", nativeName: "עברית" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe" },
    { code: "nl", name: "Dutch", nativeName: "Nederlands" },
    { code: "sv", name: "Swedish", nativeName: "Svenska" },
    { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  ];

  return NextResponse.json({ languages });
}
