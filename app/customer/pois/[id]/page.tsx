"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Navigation, Play, Square, Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { speak, stopSpeaking } from "@/lib/tts";
import { useFavorites } from "@/components/contexts/favorites-context";

type PoiDetail = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  directionUrl?: string | null;
  images: Array<{ id: string; imageUrl: string; description?: string | null }>;
  menuItems: Array<{
    id: string;
    name?: string | null;
    description?: string | null;
    price?: number | null;
    imageUrl?: string | null;
  }>;
  translations: Array<{
    id: string;
    language: string;
    description?: string | null;
    audioScript?: string | null;
    audios: Array<{ id: string; audioUrl: string }>;
  }>;
};

function speechLang(code: string): string {
  const value = code.toLowerCase();
  if (value === "vi") return "vi-VN";
  if (value === "en") return "en-US";
  if (value === "fr") return "fr-FR";
  if (value === "ja") return "ja-JP";
  return value;
}

export default function POIDetailPage() {
  const router = useRouter();
  const params = useParams();
  const poiId = params.id as string;

  const [poi, setPoi] = useState<PoiDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState("vi");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioText, setAudioText] = useState<string | null>(null);
  const [toggleSuccess, setToggleSuccess] = useState<boolean | null>(null);

  const { isFavorited, toggleFavorite, isLoading: isTogglingFavorite } = useFavorites();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/customer/pois/${poiId}`);
        if (!res.ok) {
          if (mounted) setPoi(null);
          return;
        }
        const data = (await res.json().catch(() => null)) as { poi?: PoiDetail } | null;
        if (mounted) setPoi(data?.poi ?? null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (typeof window !== "undefined") stopSpeaking();
    };
  }, [poiId]);

  const translation = useMemo(() => {
    if (!poi) return null;
    return (
      poi.translations.find((item) => item.language.toLowerCase() === language.toLowerCase()) ??
      null
    );
  }, [poi, language]);

  const resolveAudioText = async (): Promise<{ text: string; lang: string } | null> => {
    if (!poi) return null;

    const target = translation;
    if (target?.audioScript?.trim()) return { text: target.audioScript.trim(), lang: language };
    if (target?.description?.trim()) return { text: target.description.trim(), lang: language };

    const vi = poi.translations.find((item) => item.language.toLowerCase() === "vi");
    const viText =
      vi?.audioScript?.trim() || vi?.description?.trim() || poi.description?.trim() || "";
    if (!viText) return null;

    if (language.toLowerCase() === "vi") return { text: viText, lang: "vi" };

    const res = await fetch("/api/tools/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ q: viText, source: "vi", target: language.toLowerCase() }),
    });

    if (!res.ok) return { text: viText, lang: "vi" };

    const data = (await res.json().catch(() => null)) as { translatedText?: string } | null;
    const translated = data?.translatedText?.trim();
    return translated ? { text: translated, lang: language } : { text: viText, lang: "vi" };
  };

  const handlePlay = async () => {
    if (!poi) return;
    if (typeof window === "undefined") return;

    stopSpeaking();
    const result = await resolveAudioText();
    if (!result) return;
    setAudioText(result.text);

    speak({
      text: result.text,
      lang: result.lang,
      rate: 0.92,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleStop = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  const handleToggleFavorite = async () => {
    if (!poi) return;
    const result = await toggleFavorite(poi.id);
    setToggleSuccess(result);
    setTimeout(() => setToggleSuccess(null), 2000);
  };

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-500">Đang tải POI...</p>
      </div>
    </div>
  );

  if (!poi) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-500">Không tìm thấy POI.</p>
    </div>
  );

  const isCurrentlyFavorited = isFavorited(poi.id);

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {/* Header with favorite button */}
      <header className="sticky top-0 z-40 glass-header px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
            <h1 className="font-semibold text-slate-900">Chi tiết POI</h1>
          </div>
          <button
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className={`
              flex h-11 w-11 items-center justify-center rounded-full shadow-md transition-all duration-200 active:scale-90
              ${isCurrentlyFavorited
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white text-red-500 hover:bg-red-50"}
              ${isTogglingFavorite ? "opacity-70" : ""}
            `}
            aria-label={isCurrentlyFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
            <Heart className={`h-5 w-5 ${isCurrentlyFavorited ? "fill-current" : ""}`} />
          </button>
        </div>
        {/* Success/favorite status indicator */}
        {toggleSuccess !== null && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 animate-fade-in-up">
            <div className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
              toggleSuccess
                ? "bg-emerald-500 text-white"
                : "bg-slate-700 text-white"
            }`}>
              {toggleSuccess ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích"}
            </div>
          </div>
        )}
      </header>

      <main className="space-y-4 p-4">
        {/* POI Info Card */}
        <div className="card-elevated p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{poi.name}</h2>
              <p className="text-sm text-slate-500">{poi.category ?? "-"}</p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                isCurrentlyFavorited
                  ? "bg-red-100 text-red-500"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <Heart className={`h-5 w-5 ${isCurrentlyFavorited ? "fill-current" : ""}`} />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">{poi.description ?? "Không có mô tả"}</p>
        </div>

        {/* Images */}
        {poi.images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {poi.images.map((image) => (
              <img
                key={image.id}
                src={image.imageUrl}
                alt={poi.name}
                className="h-36 w-full rounded-xl object-cover shadow-soft"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <Heart className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Chưa có ảnh giới thiệu</p>
          </div>
        )}

        {/* Menu */}
        <div className="card-elevated p-4">
          <h3 className="mb-3 font-semibold text-slate-900">Thực đơn</h3>
          {poi.menuItems.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có món ăn.</p>
          ) : (
            <div className="space-y-2">
              {poi.menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex min-h-16 items-start justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                >
                  <div className="flex-1">
                    <p className="text-[15px] font-medium text-slate-800">
                      {item.name ?? "Không tên"}
                    </p>
                    <p className="text-sm text-slate-500">{item.description ?? "-"}</p>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">
                    {item.price != null ? `${item.price.toLocaleString()}đ` : "-"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href={poi.directionUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Navigation className="h-4 w-4" />
            Chỉ đường đến POI
          </a>
          <button
            type="button"
            onClick={() => {
              if (typeof poi.latitude !== "number" || typeof poi.longitude !== "number") return;
              router.push(`/customer/map?focusPoi=${poi.id}`);
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            <MapPin className="h-4 w-4" />
            Xem trên bản đồ
          </button>
        </div>

        {/* Audio Player */}
        <div className="card-elevated p-4">
          <h3 className="mb-3 font-semibold text-slate-900">Thuyết minh</h3>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
            >
              {poi.translations.map((item) => (
                <option key={item.id} value={item.language.toLowerCase()}>
                  {item.language.toUpperCase()}
                </option>
              ))}
              {!poi.translations.some((item) => item.language.toLowerCase() === "en") ? (
                <option value="en">EN</option>
              ) : null}
              {!poi.translations.some((item) => item.language.toLowerCase() === "vi") ? (
                <option value="vi">VI</option>
              ) : null}
            </select>
            <button
              type="button"
              onClick={() => void handlePlay()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-orange-600 active:scale-[0.98] transition-all"
            >
              <Play className="h-4 w-4" /> Phát
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              <Square className="h-4 w-4" /> Tắt
            </button>
          </div>
          <p className="text-xs text-slate-500">{isSpeaking ? "Đang phát..." : "Sẵn sàng phát"}</p>
          <p className="mt-2 text-sm text-slate-600">
            {audioText ??
              "Hệ thống sẽ ưu tiên audio/script theo ngôn ngữ, nếu chưa có sẽ dịch từ tiếng Việt rồi đọc bằng TTS."}
          </p>
        </div>
      </main>
    </div>
  );
}
