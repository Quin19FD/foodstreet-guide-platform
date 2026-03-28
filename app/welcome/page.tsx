"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Globe, Navigation } from "lucide-react";
import { cn } from "@/shared/utils";

type Language = "vi" | "en" | "zh" | "ko";

const languages: { code: Language; name: string; flag: string }[] = [
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
];

const content = {
  vi: {
    title: "Khám phá Ẩm thực Phố",
    subtitle: "Khám phá các món ăn đường phố độc đáo với Audio Guide đa ngôn ngữ",
    getStarted: "Bắt đầu",
    welcome: "Chào mừng!",
    selectLanguage: "Chọn ngôn ngữ của bạn",
    enableGPS: "Bật GPS để tìm quán ăn gần bạn",
    districts: "Khu phố ẩm thực",
    tours: "Food Tours",
    explore: "Khám phá ngay",
  },
  en: {
    title: "Street Food Discovery",
    subtitle: "Discover unique street foods with multilingual Audio Guide",
    getStarted: "Get Started",
    welcome: "Welcome!",
    selectLanguage: "Select your language",
    enableGPS: "Enable GPS to find restaurants near you",
    districts: "Food Districts",
    tours: "Food Tours",
    explore: "Explore Now",
  },
  zh: {
    title: "街头美食探索",
    subtitle: "通过多语言语音导览发现独特的街头美食",
    getStarted: "开始",
    welcome: "欢迎！",
    selectLanguage: "选择您的语言",
    enableGPS: "启用GPS以查找附近的餐厅",
    districts: "美食街区",
    tours: "美食之旅",
    explore: "立即探索",
  },
  ko: {
    title: "길거리 음식 발견",
    subtitle: "다국어 오디오 가이드로 독특한 길거리 음식을 발견하세요",
    getStarted: "시작하기",
    welcome: "환영합니다!",
    selectLanguage: "언어를 선택하세요",
    enableGPS: "GPS를 활성화하여 근처 식당을 찾으세요",
    districts: "음식 지구",
    tours: "푸드 투어",
    explore: "지금 탐험",
  },
};

export default function WelcomePage() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<Language>("vi");
  const [isLoading, setIsLoading] = useState(false);
  const t = content[selectedLang];

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      // Request GPS permission
      if ("geolocation" in navigator) {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
      }
      // Save language preference
      localStorage.setItem("preferred-language", selectedLang);
      router.push("/customer");
    } catch (error) {
      console.error("GPS permission denied:", error);
      // Still navigate even if GPS is denied
      localStorage.setItem("preferred-language", selectedLang);
      router.push("/customer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-amber-50 p-6">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 shadow-lg">
          <MapPin className="h-10 w-10 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-center text-3xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-2 max-w-xs text-center text-sm text-slate-600">{t.subtitle}</p>
      </div>

      {/* Language Selection */}
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Globe className="h-5 w-5" />
          <span className="font-medium">{t.selectLanguage}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 p-4 transition-all",
                selectedLang === lang.code
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  selectedLang === lang.code ? "text-orange-700" : "text-slate-700"
                )}
              >
                {lang.name}
              </span>
            </button>
          ))}
        </div>

        {/* Info Cards */}
        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-white/80 p-4 backdrop-blur">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
              <Navigation className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{t.enableGPS}</p>
              <p className="mt-1 text-xs text-slate-500">
                Location services help you find nearby food stalls
              </p>
            </div>
          </div>
        </div>

        {/* Get Started Button */}
        <button
          onClick={handleGetStarted}
          disabled={isLoading}
          className={cn(
            "mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 font-semibold text-white shadow-lg transition-all",
            "hover:bg-orange-600 active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-70"
          )}
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>{t.getStarted}</span>
              <MapPin className="h-5 w-5" />
            </>
          )}
        </button>

        {/* District Preview */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            {t.districts} • {t.tours}
          </p>
        </div>
      </div>
    </div>
  );
}
