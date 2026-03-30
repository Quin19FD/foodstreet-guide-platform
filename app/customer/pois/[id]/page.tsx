"use client";

import { useFavorites } from "@/components/contexts/favorites-context";
import { speak, stopSpeaking } from "@/lib/tts";
import { ArrowLeft, Heart, MapPin, Navigation, Play, Square, Volume2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type PoiDetail = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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

const LANGUAGE_PRESETS = [
  { code: "vi", label: "Vietnamese (VI)" },
  { code: "en", label: "English (EN)" },
  { code: "fr", label: "French (FR)" },
  { code: "de", label: "German (DE)" },
  { code: "ja", label: "Japanese (JA)" },
  { code: "ko", label: "Korean (KO)" },
  { code: "zh", label: "Chinese (ZH)" },
  { code: "th", label: "Thai (TH)" },
  { code: "es", label: "Spanish (ES)" },
  { code: "pt", label: "Portuguese (PT)" },
  { code: "it", label: "Italian (IT)" },
  { code: "ru", label: "Russian (RU)" },
  { code: "id", label: "Indonesian (ID)" },
  { code: "ms", label: "Malay (MS)" },
  { code: "ar", label: "Arabic (AR)" },
  { code: "hi", label: "Hindi (HI)" },
] as const;

const LANGUAGE_LABEL_MAP = new Map<string, string>(
  LANGUAGE_PRESETS.map((item) => [item.code, item.label])
);

function normalizeLanguageCode(input: string): string {
  const value = input.trim().toLowerCase();
  if (!value) return "vi";
  if (value.length === 2) return value;

  const aliases: Record<string, string> = {
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
  };

  return aliases[value] ?? value.slice(0, 2);
}

function languageLabel(code: string): string {
  const normalized = normalizeLanguageCode(code);
  return LANGUAGE_LABEL_MAP.get(normalized) ?? `${normalized.toUpperCase()}`;
}

function formatPrice(value?: number | null): string {
  if (value == null) return "-";
  return `${value.toLocaleString("vi-VN")}đ`;
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
  const [audioSourceLabel, setAudioSourceLabel] = useState<string | null>(null);
  const [toggleSuccess, setToggleSuccess] = useState<boolean | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const translationCacheRef = useRef<Record<string, string>>({});

  const { isFavorited, toggleFavorite, isLoading: isTogglingFavorite } = useFavorites();

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/customer/pois/${poiId}`, {
          method: "GET",
          signal: controller.signal,
        });
        if (!res.ok) {
          setPoi(null);
          return;
        }

        const data = (await res.json().catch(() => null)) as { poi?: PoiDetail } | null;
        setPoi(data?.poi ?? null);
      } catch (error) {
        if ((error as { name?: string })?.name !== "AbortError") {
          setPoi(null);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => {
      controller.abort();
      stopSpeaking();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
      }
    };
  }, [poiId]);

  const languageOptions = useMemo(() => {
    if (!poi) return [...LANGUAGE_PRESETS];

    const optionMap = new Map<string, string>();
    for (const translation of poi.translations) {
      const code = normalizeLanguageCode(translation.language);
      optionMap.set(code, languageLabel(code));
    }
    for (const item of LANGUAGE_PRESETS) {
      if (!optionMap.has(item.code)) optionMap.set(item.code, item.label);
    }

    return Array.from(optionMap.entries())
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [poi]);

  useEffect(() => {
    if (!languageOptions.some((item) => item.code === language)) {
      setLanguage("vi");
    }
  }, [language, languageOptions]);

  const translation = useMemo(() => {
    if (!poi) return null;
    const targetCode = normalizeLanguageCode(language);
    return (
      poi.translations.find(
        (item) => normalizeLanguageCode(item.language) === normalizeLanguageCode(targetCode)
      ) ?? null
    );
  }, [poi, language]);

  const groupedAudios = useMemo(() => {
    if (!poi) return [];
    return poi.translations.filter((item) => (item.audios?.length ?? 0) > 0);
  }, [poi]);

  const stopAllAudio = () => {
    stopSpeaking();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
    }
    setIsSpeaking(false);
  };

  const resolveAudioPayload = async (): Promise<
    | { type: "file"; audioUrl: string; label: string }
    | { type: "tts"; text: string; lang: string; label: string }
    | null
  > => {
    if (!poi) return null;
    const targetLanguage = normalizeLanguageCode(language);
    const target = translation;

    if (target?.audios?.[0]?.audioUrl) {
      return {
        type: "file",
        audioUrl: target.audios[0].audioUrl,
        label: `Audio file ${targetLanguage.toUpperCase()}`,
      };
    }

    if (target?.audioScript?.trim()) {
      return {
        type: "tts",
        text: target.audioScript.trim(),
        lang: targetLanguage,
        label: `TTS script ${targetLanguage.toUpperCase()}`,
      };
    }

    if (target?.description?.trim()) {
      return {
        type: "tts",
        text: target.description.trim(),
        lang: targetLanguage,
        label: `TTS mô tả ${targetLanguage.toUpperCase()}`,
      };
    }

    const vi = poi.translations.find((item) => normalizeLanguageCode(item.language) === "vi");
    const viText = vi?.audioScript?.trim() || vi?.description?.trim() || poi.description?.trim() || "";
    if (!viText) return null;

    if (targetLanguage === "vi") {
      return {
        type: "tts",
        text: viText,
        lang: "vi",
        label: "TTS tiếng Việt",
      };
    }

    const cacheKey = `${poi.id}:${targetLanguage}`;
    if (translationCacheRef.current[cacheKey]) {
      return {
        type: "tts",
        text: translationCacheRef.current[cacheKey],
        lang: targetLanguage,
        label: `TTS dịch tự động ${targetLanguage.toUpperCase()}`,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch("/api/tools/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: viText, source: "vi", target: targetLanguage }),
        signal: controller.signal,
      });

      if (!res.ok) {
        return {
          type: "tts",
          text: viText,
          lang: "vi",
          label: "TTS tiếng Việt (fallback)",
        };
      }

      const data = (await res.json().catch(() => null)) as { translatedText?: string } | null;
      const translated = data?.translatedText?.trim();
      if (!translated) {
        return {
          type: "tts",
          text: viText,
          lang: "vi",
          label: "TTS tiếng Việt (fallback)",
        };
      }

      translationCacheRef.current[cacheKey] = translated;
      return {
        type: "tts",
        text: translated,
        lang: targetLanguage,
        label: `TTS dịch tự động ${targetLanguage.toUpperCase()}`,
      };
    } catch {
      return {
        type: "tts",
        text: viText,
        lang: "vi",
        label: "TTS tiếng Việt (fallback)",
      };
    } finally {
      clearTimeout(timeout);
    }
  };

  const handlePlay = async () => {
    if (!poi || typeof window === "undefined") return;

    stopAllAudio();
    const payload = await resolveAudioPayload();
    if (!payload) {
      setAudioText("POI chưa có nội dung thuyết minh để phát.");
      setAudioSourceLabel(null);
      return;
    }

    if (payload.type === "file") {
      setAudioSourceLabel(payload.label);
      setAudioText("Đang phát từ file audio đã upload.");
      const audio = audioRef.current;
      if (!audio) return;
      audio.src = payload.audioUrl;
      try {
        await audio.play();
      } catch {
        setIsSpeaking(false);
      }
      return;
    }

    setAudioSourceLabel(payload.label);
    setAudioText(payload.text);

    speak({
      text: payload.text,
      lang: payload.lang,
      rate: 0.92,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleStop = () => {
    stopAllAudio();
  };

  const handleToggleFavorite = async () => {
    if (!poi) return;
    const result = await toggleFavorite(poi.id);
    setToggleSuccess(result);
    setTimeout(() => setToggleSuccess(null), 2000);
  };

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Đang tải POI...</p>
        </div>
      </div>
    );

  if (!poi)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Không tìm thấy POI.</p>
      </div>
    );

  const isCurrentlyFavorited = isFavorited(poi.id);

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 glass-header px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
            <h1 className="font-semibold text-slate-900">Chi tiết POI</h1>
          </div>

          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-md transition-all duration-200 active:scale-90 ${
              isCurrentlyFavorited
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white text-red-500 hover:bg-red-50"
            } ${isTogglingFavorite ? "opacity-70" : ""}`}
            aria-label={isCurrentlyFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
            <Heart className={`h-5 w-5 ${isCurrentlyFavorited ? "fill-current" : ""}`} />
          </button>
        </div>

        {toggleSuccess !== null && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 animate-fade-in-up">
            <div
              className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
                toggleSuccess ? "bg-emerald-500 text-white" : "bg-slate-700 text-white"
              }`}
            >
              {toggleSuccess ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích"}
            </div>
          </div>
        )}
      </header>

      <main className="space-y-4 p-4">
        <div className="card-elevated p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{poi.name}</h2>
              <p className="text-sm text-slate-500">{poi.category ?? "-"}</p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                isCurrentlyFavorited ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-400"
              }`}
            >
              <Heart className={`h-5 w-5 ${isCurrentlyFavorited ? "fill-current" : ""}`} />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">{poi.description ?? "Không có mô tả"}</p>
        </div>

        {poi.images.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {poi.images.map((image) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft"
              >
                <img
                  src={image.imageUrl}
                  alt={image.description ?? poi.name}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <p className="line-clamp-2 px-3 py-2 text-sm text-slate-600">
                  {image.description?.trim() || "Không có mô tả ảnh."}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <Volume2 className="mx-auto mb-2 h-12 w-12 text-slate-300" />
            <p className="text-sm text-slate-500">Chưa có ảnh giới thiệu</p>
          </div>
        )}

        <div className="card-elevated p-4">
          <h3 className="mb-3 font-semibold text-slate-900">Thực đơn</h3>
          {poi.menuItems.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có món ăn.</p>
          ) : (
            <div className="space-y-3">
              {poi.menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name ?? "Menu item"}
                      className="h-20 w-24 rounded-lg object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-20 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                      Không ảnh
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[15px] font-medium text-slate-800">
                        {item.name ?? "Không tên"}
                      </p>
                      <span className="text-sm font-semibold text-orange-600">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{item.description ?? "Không mô tả"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              if (typeof poi.latitude !== "number" || typeof poi.longitude !== "number") return;
              router.push(`/customer/map?focusPoi=${poi.id}&routeTo=${poi.id}`);
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-orange-600 active:scale-[0.98]"
            disabled={typeof poi.latitude !== "number" || typeof poi.longitude !== "number"}
          >
            <Navigation className="h-4 w-4" />
            Chỉ đường trong ứng dụng
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof poi.latitude !== "number" || typeof poi.longitude !== "number") return;
              router.push(`/customer/map?focusPoi=${poi.id}`);
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            <MapPin className="h-4 w-4" />
            Xem trên bản đồ
          </button>
        </div>

        <div className="card-elevated p-4">
          <h3 className="mb-3 font-semibold text-slate-900">Thuyết minh đa ngôn ngữ</h3>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(normalizeLanguageCode(e.target.value))}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            >
              {languageOptions.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handlePlay()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-orange-600 active:scale-[0.98]"
            >
              <Play className="h-4 w-4" /> Phát
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <Square className="h-4 w-4" /> Tắt
            </button>
          </div>

          <audio
            ref={audioRef}
            controls
            preload="none"
            className="w-full"
            onPlay={() => setIsSpeaking(true)}
            onPause={() => setIsSpeaking(false)}
            onEnded={() => setIsSpeaking(false)}
          >
            <track kind="captions" />
          </audio>

          <p className="mt-3 text-xs text-slate-500">{isSpeaking ? "Đang phát..." : "Sẵn sàng phát"}</p>
          {audioSourceLabel ? (
            <p className="mt-1 text-xs font-semibold text-orange-600">Nguồn phát: {audioSourceLabel}</p>
          ) : null}
          <p className="mt-2 text-sm text-slate-600">
            {audioText ??
              "Ưu tiên audio file theo ngôn ngữ, sau đó đến script/mô tả, cuối cùng dịch tự động từ tiếng Việt."}
          </p>

          {translation ? (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Bản hiện chọn: {languageLabel(translation.language)}
            </p>
          ) : null}
        </div>

        <div className="card-elevated p-4">
          <h3 className="mb-3 font-semibold text-slate-900">Audio file đã upload</h3>
          {groupedAudios.length === 0 ? (
            <p className="text-sm text-slate-500">POI chưa có file audio upload.</p>
          ) : (
            <div className="space-y-3">
              {groupedAudios.map((translationItem) => (
                <div key={translationItem.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    {languageLabel(translationItem.language)} ({translationItem.audios.length} file)
                  </p>
                  <div className="space-y-2">
                    {translationItem.audios.map((audio) => (
                      <div key={audio.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <audio controls preload="none" className="w-full">
                          <track kind="captions" />
                          <source src={audio.audioUrl} />
                        </audio>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
