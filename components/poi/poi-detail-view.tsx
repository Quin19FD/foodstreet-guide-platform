"use client";

import maplibregl from "maplibre-gl";
import {
  Globe2,
  Headphones,
  ImageIcon,
  MapPin,
  MenuSquare,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type PoiStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PoiDetailData = {
  id: string;
  name: string;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  status: PoiStatus;
  isActive?: boolean;
  rejectionReason?: string | null;
  submitCount?: number;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    email: string;
    name: string;
  };
  images: Array<{
    id: string;
    imageUrl: string;
    description?: string | null;
  }>;
  menuItems: Array<{
    id: string;
    name?: string | null;
    description?: string | null;
    price?: number | null;
    imageUrl?: string | null;
    isAvailable?: boolean;
  }>;
  translations: Array<{
    id: string;
    language: string;
    name?: string | null;
    description?: string | null;
    audioScript?: string | null;
    audios?: Array<{
      id: string;
      audioUrl: string;
      isActive?: boolean;
      createdAt?: string;
    }>;
  }>;
};

type PoiDetailViewProps = {
  poi: PoiDetailData;
  headerActions?: React.ReactNode;
  showOwner?: boolean;
};

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

const LANGUAGE_FALLBACK_OPTIONS = [
  { code: "vi", label: "Vietnamese (VI)" },
  { code: "en", label: "English (EN)" },
  { code: "fr", label: "French (FR)" },
  { code: "de", label: "German (DE)" },
  { code: "ja", label: "Japanese (JA)" },
  { code: "ko", label: "Korean (KO)" },
  { code: "zh", label: "Chinese (ZH)" },
  { code: "th", label: "Thai (TH)" },
] as const;

function normalizeLanguageCode(input: string): string {
  const code = input.trim().toLowerCase();
  const map: Record<string, string> = {
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

  if (code.length === 2) return code;
  return map[code] ?? code.slice(0, 2);
}

function statusBadge(status: PoiStatus): string {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatCurrency(value?: number | null): string {
  if (value == null) return "-";
  return `${value.toLocaleString("vi-VN")}đ`;
}

function splitSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?…])\s+|\n+/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toSpeechLang(language: string): string {
  const normalized = language.toLowerCase();
  
  // Ánh xạ các mã ngôn ngữ 2 ký tự sang mã ngôn ngữ đầy đủ (BCP-47)
  // để Web Speech API có thể tìm đúng giọng đọc (voice).
  const speechMap: Record<string, string> = {
    vi: "vi-VN", en: "en-US", fr: "fr-FR", de: "de-DE",
    ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", th: "th-TH",
    es: "es-ES", pt: "pt-BR", it: "it-IT", ru: "ru-RU",
    ar: "ar-SA", hi: "hi-IN", id: "id-ID", ms: "ms-MY",
    nl: "nl-NL", pl: "pl-PL", tr: "tr-TR", uk: "uk-UA",
    cs: "cs-CZ", sv: "sv-SE", da: "da-DK", no: "nb-NO",
    fi: "fi-FI", hu: "hu-HU", el: "el-GR", he: "he-IL",
    ro: "ro-RO", bg: "bg-BG", hr: "hr-HR", sk: "sk-SK",
    ta: "ta-IN", te: "te-IN", mr: "mr-IN", bn: "bn-IN",
    gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN",
    "zh-tw": "zh-TW", "zh-hk": "zh-HK",
  };

  return speechMap[normalized] || normalized;
}

function getBestVoice(langCode: string) {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();
  const targetPrefix = langCode.split("-")[0].toLowerCase();

  let voice = voices.find((v) => v.lang.replace("_", "-").toLowerCase() === langCode.toLowerCase());
  if (!voice) {
    voice = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
  }
  return voice || null;
}

function PoiReadonlyMap({ latitude, longitude }: { latitude?: number | null; longitude?: number | null }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const hasCoordinate = typeof latitude === "number" && typeof longitude === "number";

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !hasCoordinate) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center: [longitude as number, latitude as number],
      zoom: 15,
      interactive: true,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    map.on("load", () => {
      markerRef.current = new maplibregl.Marker({ color: "#f97316" })
        .setLngLat([longitude as number, latitude as number])
        .addTo(map);
      map.resize();
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [hasCoordinate, latitude, longitude]);

  if (!hasCoordinate) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        POI chưa có tọa độ để hiển thị trên bản đồ.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div ref={mapContainerRef} className="h-[300px] w-full" />
    </div>
  );
}

export function PoiDetailView(props: PoiDetailViewProps) {
  const { poi, headerActions, showOwner } = props;

  const viTranslation = useMemo(
    () => poi.translations.find((translation) => translation.language.toLowerCase() === "vi") ?? null,
    [poi.translations]
  );

  const otherTranslations = useMemo(
    () => poi.translations.filter((translation) => translation.language.toLowerCase() !== "vi"),
    [poi.translations]
  );

  const [targetLanguage, setTargetLanguage] = useState("en");
  const [countryLanguageOptions, setCountryLanguageOptions] = useState<Array<{ code: string; label: string }>>(
    [...LANGUAGE_FALLBACK_OPTIONS]
  );
  const [translatedPreview, setTranslatedPreview] = useState(viTranslation?.description ?? "");
  const [translateNotice, setTranslateNotice] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playbackTokenRef = useRef(0);

  const viSentences = useMemo(() => splitSentences(translatedPreview), [translatedPreview]);

  useEffect(() => {
    setTranslatedPreview(viTranslation?.description ?? "");
    setSentenceIndex(0);
    setTranslateNotice(null);
  }, [viTranslation?.id]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,languages");
        if (!response.ok) return;

        const data = (await response.json().catch(() => null)) as
          | Array<{ name?: { common?: string }; languages?: Record<string, string> }>
          | null;

        if (!data?.length || !isMounted) return;

        const map = new Map<string, string>();
        for (const item of data) {
          const countryName = item.name?.common?.trim();
          const firstLanguageCode = Object.keys(item.languages ?? {})[0];
          if (!countryName || !firstLanguageCode) continue;

          const normalized = normalizeLanguageCode(firstLanguageCode);
          if (!normalized) continue;
          if (!map.has(normalized)) {
            const languageName = item.languages![firstLanguageCode];
            map.set(normalized, `${languageName || countryName} (${normalized.toUpperCase()})`);
          }
        }

        map.set("vi", "Vietnamese (VI)");
        map.set("en", "English (EN)");
        map.set("zh", "Chinese (ZH)");

        const options = Array.from(map.entries())
          .map(([code, label]) => ({ code, label }))
          .sort((a, b) => a.label.localeCompare(b.label));

        if (!options.length) return;

        if (isMounted) {
          setCountryLanguageOptions(options);
          if (!options.some((option) => option.code === targetLanguage)) {
            setTargetLanguage("en");
          }
        }
      } catch {
        // keep fallback options
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeech = () => {
    if (typeof window === "undefined") return;
    playbackTokenRef.current += 1;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsSpeechPaused(false);
  };

  const speakFromIndex = (index: number, continuous: boolean) => {
    if (typeof window === "undefined") return;
    if (!viSentences[index]) return;

    const token = playbackTokenRef.current + 1;
    playbackTokenRef.current = token;
    window.speechSynthesis.cancel();

    const speakNext = (currentIndex: number) => {
      if (playbackTokenRef.current !== token) return;
      const text = viSentences[currentIndex];
      if (!text) {
        setIsSpeaking(false);
        setIsSpeechPaused(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = toSpeechLang(targetLanguage);
      const voice = getBestVoice(utterance.lang);
      if (voice) utterance.voice = voice;
      utterance.rate = speechRate;
      utterance.onstart = () => {
        if (playbackTokenRef.current !== token) return;
        setIsSpeaking(true);
        setIsSpeechPaused(false);
        setSentenceIndex(currentIndex);
      };
      utterance.onend = () => {
        if (playbackTokenRef.current !== token) return;

        if (continuous && currentIndex < viSentences.length - 1) {
          speakNext(currentIndex + 1);
          return;
        }

        setIsSpeaking(false);
        setIsSpeechPaused(false);
      };
      utterance.onerror = () => {
        if (playbackTokenRef.current !== token) return;
        setIsSpeaking(false);
        setIsSpeechPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNext(index);
  };

  const speakSentenceAt = (index: number) => {
    speakFromIndex(index, false);
  };

  const speakContinuousFrom = (index: number) => {
    speakFromIndex(index, true);
  };

  const pauseOrResume = () => {
    if (typeof window === "undefined") return;
    if (!isSpeaking && !isSpeechPaused) return;

    if (isSpeechPaused) {
      window.speechSynthesis.resume();
      setIsSpeechPaused(false);
      return;
    }

    window.speechSynthesis.pause();
    setIsSpeechPaused(true);
  };

  const readTranslation = (description: string, language: string) => {
    if (typeof window === "undefined") return;
    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(description);
    utterance.lang = toSpeechLang(language);
    const voice = getBestVoice(utterance.lang);
    if (voice) utterance.voice = voice;
    utterance.rate = speechRate;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsSpeechPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsSpeechPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleTranslatePreview = async () => {
    const viDescription = viTranslation?.description?.trim() ?? "";
    if (!viDescription) {
      setTranslateNotice("Bản thuyết minh tiếng Việt đang trống.");
      return;
    }

    if (targetLanguage === "vi") {
      setTranslatedPreview(viDescription);
      setSentenceIndex(0);
      setTranslateNotice("Đang dùng bản tiếng Việt gốc.");
      return;
    }

    const existingTranslation = poi.translations.find(
      (translation) =>
        translation.language.toLowerCase() === targetLanguage &&
        Boolean(translation.description?.trim())
    );

    if (existingTranslation?.description) {
      setTranslatedPreview(existingTranslation.description);
      setSentenceIndex(0);
      setTranslateNotice("Đã dùng bản dịch có sẵn của POI.");
      return;
    }

    setIsTranslating(true);
    setTranslateNotice(null);

    try {
      const response = await fetch("/api/tools/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          q: viDescription,
          source: "vi",
          target: targetLanguage,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setTranslatedPreview(viDescription);
        setSentenceIndex(0);
        setTranslateNotice(
          data?.error
            ? `${data.error}. Hệ thống đang đọc bản tiếng Việt gốc.`
            : "Không thể dịch tự động. Hệ thống đang đọc bản tiếng Việt gốc."
        );
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { translatedText?: string; provider?: string }
        | null;

      const translatedText = data?.translatedText?.trim();
      if (!translatedText) {
        setTranslatedPreview(viDescription);
        setSentenceIndex(0);
        setTranslateNotice("Không nhận được nội dung dịch. Hệ thống đang đọc bản tiếng Việt gốc.");
        return;
      }

      setTranslatedPreview(translatedText);
      setSentenceIndex(0);
      setTranslateNotice(`Dịch tự động thành công (${data?.provider ?? "provider"}).`);
    } catch {
      setTranslatedPreview(viDescription);
      setSentenceIndex(0);
      setTranslateNotice("Lỗi kết nối khi dịch tự động. Hệ thống đang đọc bản tiếng Việt gốc.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-amber-50 to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(poi.status)}`}>
                {poi.status}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  poi.isActive === false
                    ? "bg-slate-200 text-slate-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {poi.isActive === false ? "Đang khóa" : "Đang mở"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Submit: {poi.submitCount ?? 1}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{poi.name}</h1>
            <p className="text-sm text-slate-600">Danh mục: {poi.category ?? "-"}</p>
            <p className="text-xs text-slate-500">Cập nhật: {formatDate(poi.updatedAt)}</p>
            {showOwner && poi.owner ? (
              <p className="text-xs text-slate-500">
                Vendor: <span className="font-medium text-slate-700">{poi.owner.name}</span> ({poi.owner.email})
              </p>
            ) : null}
            {poi.rejectionReason ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                Lý do từ chối gần nhất: {poi.rejectionReason}
              </p>
            ) : null}
          </div>

          {headerActions ? <div className="flex flex-wrap items-center gap-2">{headerActions}</div> : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-slate-800">Vị trí nhà hàng</h2>
          </div>
          <p className="text-xs text-slate-500">
            Tọa độ: {poi.latitude ?? "-"}, {poi.longitude ?? "-"}
          </p>
          <PoiReadonlyMap latitude={poi.latitude} longitude={poi.longitude} />
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-slate-800">Hình ảnh quảng bá</h2>
          </div>

          {poi.images.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              Chưa có ảnh quảng bá cho POI.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {poi.images.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img src={image.imageUrl} alt={image.description ?? poi.name} className="h-32 w-full object-cover" />
                  <p className="line-clamp-2 px-2 py-1.5 text-xs text-slate-600">{image.description || "Không mô tả"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <MenuSquare className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-slate-800">Menu</h2>
        </div>

        {poi.menuItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            Chưa có menu item.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {poi.menuItems.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name ?? "menu"} className="h-20 w-24 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-20 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                    Không ảnh
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{item.name ?? "(không tên)"}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.description || "Không mô tả"}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-orange-600">{formatCurrency(item.price)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        item.isAvailable === false
                          ? "bg-slate-200 text-slate-600"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.isAvailable === false ? "Hết món" : "Còn món"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-slate-900">
            Bản thuyết minh tiếng Việt (bắt buộc, nổi bật)
          </h2>
        </div>

        <p className="mb-3 whitespace-pre-wrap rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-slate-700">
          {viTranslation?.description || "POI chưa cập nhật thuyết minh tiếng Việt."}
        </p>

        <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <select
            value={targetLanguage}
            onChange={(event) => setTargetLanguage(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-orange-500 focus:ring-2"
          >
            {countryLanguageOptions.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="h-10 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            onClick={() => void handleTranslatePreview()}
            disabled={isTranslating}
          >
            {isTranslating ? "Đang dịch..." : "Dịch để nghe"}
          </button>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600">
            Tốc độ
            <input
              type="range"
              min={0.6}
              max={1.4}
              step={0.1}
              value={speechRate}
              onChange={(event) => setSpeechRate(Number(event.target.value))}
            />
          </div>
        </div>

        {translateNotice ? <p className="mt-2 text-xs text-slate-600">{translateNotice}</p> : null}

        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-500">Bản dùng để đọc</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{translatedPreview || "-"}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => speakContinuousFrom(sentenceIndex)}
              disabled={viSentences.length === 0}
            >
              <Play className="h-3.5 w-3.5" />
              Đọc từ câu hiện tại
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => speakSentenceAt(Math.max(sentenceIndex - 1, 0))}
              disabled={viSentences.length === 0}
            >
              <SkipBack className="h-3.5 w-3.5" />
              Lùi
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => speakSentenceAt(Math.min(sentenceIndex + 1, Math.max(viSentences.length - 1, 0)))}
              disabled={viSentences.length === 0}
            >
              <SkipForward className="h-3.5 w-3.5" />
              Tiến
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={pauseOrResume}
              disabled={!isSpeaking && !isSpeechPaused}
            >
              <Pause className="h-3.5 w-3.5" />
              {isSpeechPaused ? "Tiếp tục" : "Tạm dừng"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              onClick={stopSpeech}
            >
              <Square className="h-3.5 w-3.5" />
              Dừng
            </button>
            <span className="text-xs text-slate-500">
              Câu {Math.min(sentenceIndex + 1, Math.max(viSentences.length, 1))}/{Math.max(viSentences.length, 1)}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Bản thuyết minh ngôn ngữ khác</h2>

        {otherTranslations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            Chưa có bản dịch ngôn ngữ khác.
          </div>
        ) : (
          <div className="space-y-3">
            {otherTranslations.map((translation) => (
              <div key={translation.id} className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {translation.language.toUpperCase()} - {translation.name ?? "(không tiêu đề)"}
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      if (!translation.description?.trim()) return;
                      readTranslation(translation.description, translation.language);
                    }}
                    disabled={!translation.description?.trim()}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Đọc
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {translation.description || "Không có nội dung"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Headphones className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-slate-800">Audio của POI</h2>
        </div>

        {poi.translations.every((translation) => (translation.audios?.length ?? 0) === 0) ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            Chưa có file audio cho POI.
          </div>
        ) : (
          <div className="space-y-3">
            {poi.translations
              .filter((translation) => (translation.audios?.length ?? 0) > 0)
              .map((translation) => (
                <div key={translation.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    {translation.language.toUpperCase()} ({translation.audios?.length ?? 0} file)
                  </p>
                  <div className="space-y-2">
                    {translation.audios?.map((audio) => (
                      <div key={audio.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <audio controls className="w-full">
                          <source src={audio.audioUrl} />
                        </audio>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}










