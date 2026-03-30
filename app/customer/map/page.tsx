"use client";

import { speak as ttsSpeak, stopSpeaking as ttsStop } from "@/lib/tts";
import { MapPin, Navigation, Pause, Play, Search, Square, Wifi, WifiOff } from "lucide-react";
import maplibregl from "maplibre-gl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

type PoiMapItem = {
  id: string;
  name: string;
  description?: string;
  viNarration?: string;
  availableLanguages?: string[];
  languagesWithAudio?: string[];
  latitude?: number | null;
  longitude?: number | null;
  distanceMeters?: number | null;
  priorityScore?: number | null;
  imageUrl?: string | null;
  category?: string | null;
  rating?: number | null;
};

type PoiDetailNarration = {
  description?: string | null;
  translations?: Array<{
    language: string;
    description?: string | null;
    audioScript?: string | null;
  }>;
};

type SpeechChunk = {
  id: string;
  key: string;
  text: string;
  lang: string;
  label: string;
  poiId?: string;
};

type ClusterCandidate = {
  clusterId: string;
  centerLat: number;
  centerLng: number;
  topPoi: PoiMapItem;
  score: number;
  memberCount: number;
};

type RouteInfo = {
  distanceMeters: number;
  durationSeconds: number;
  source: "osrm" | "straight";
};

type RouteCacheItem = {
  coordinates: [number, number][];
  info: RouteInfo;
};

type MovementMode = "walk" | "motorbike";

type MovementProfile = {
  label: string;
  baseAlertRadius: number;
  minAlertRadius: number;
  maxAlertRadius: number;
  accuracyMultiplier: number;
  accuracyCap: number;
  speedMultiplier: number;
  speedCap: number;
  globalPromptIntervalMs: number;
  dismissPromptCooldownMs: number;
  clusterCooldownMs: number;
  poiCooldownMs: number;
  stabilityTicks: number;
  exitPadding: number;
  exitFloor: number;
  promptTimeoutMs: number;
  hint: string;
};

const MOVEMENT_MODE_STORAGE_KEY = "fs_customer_movement_mode";
const MOVEMENT_PROFILES: Record<MovementMode, MovementProfile> = {
  walk: {
    label: "Đi bộ",
    baseAlertRadius: 92,
    minAlertRadius: 80,
    maxAlertRadius: 170,
    accuracyMultiplier: 0.75,
    accuracyCap: 80,
    speedMultiplier: 10,
    speedCap: 50,
    globalPromptIntervalMs: 32_000,
    dismissPromptCooldownMs: 10 * 60_000,
    clusterCooldownMs: 3 * 60_000,
    poiCooldownMs: 7 * 60_000,
    stabilityTicks: 2,
    exitPadding: 36,
    exitFloor: 140,
    promptTimeoutMs: 28_000,
    hint: "Hỏi sớm vừa phải, phù hợp khi bạn đi bộ quanh khu POI.",
  },
  motorbike: {
    label: "Xe máy",
    baseAlertRadius: 180,
    minAlertRadius: 150,
    maxAlertRadius: 290,
    accuracyMultiplier: 0.9,
    accuracyCap: 100,
    speedMultiplier: 12,
    speedCap: 80,
    globalPromptIntervalMs: 58_000,
    dismissPromptCooldownMs: 15 * 60_000,
    clusterCooldownMs: 5 * 60_000,
    poiCooldownMs: 10 * 60_000,
    stabilityTicks: 3,
    exitPadding: 70,
    exitFloor: 210,
    promptTimeoutMs: 18_000,
    hint: "Hỏi sớm hơn và thưa hơn để kịp tốc độ di chuyển bằng xe máy.",
  },
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
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const ALERT_TRIGGER_RADIUS_METERS = 130;
const CLUSTER_RADIUS_METERS = 90;
const NETWORK_TIMEOUT_MS = 5000;
const DEFAULT_CENTER: [number, number] = [106.7009, 10.7769];
const ROUTE_SOURCE_ID = "customer-route-source";
const ROUTE_LINE_LAYER_ID = "customer-route-line";
const ROUTE_LINE_OUTLINE_LAYER_ID = "customer-route-line-outline";

const LANGUAGE_PRESETS = [
  "vi",
  "en",
  "fr",
  "de",
  "ja",
  "ko",
  "zh",
  "th",
  "es",
  "pt",
  "it",
  "ru",
  "id",
  "ms",
  "ar",
  "hi",
];

function speechLang(code: string): string {
  const value = code.toLowerCase();
  if (value === "vi") return "vi-VN";
  if (value === "en") return "en-US";
  if (value === "fr") return "fr-FR";
  if (value === "de") return "de-DE";
  if (value === "ja") return "ja-JP";
  if (value === "ko") return "ko-KR";
  if (value === "zh") return "zh-CN";
  if (value === "th") return "th-TH";
  if (value === "es") return "es-ES";
  if (value === "pt") return "pt-BR";
  if (value === "it") return "it-IT";
  if (value === "ru") return "ru-RU";
  if (value === "id") return "id-ID";
  if (value === "ms") return "ms-MY";
  if (value === "ar") return "ar-SA";
  if (value === "hi") return "hi-IN";
  return value;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371e3;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function routeCacheKey(startLat: number, startLng: number, endLat: number, endLng: number): string {
  const rounded = [startLat, startLng, endLat, endLng].map((value) => value.toFixed(4));
  return rounded.join("|");
}

function formatRouteDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatRouteDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return remainMinutes === 0 ? `${hours} giờ` : `${hours} giờ ${remainMinutes} phút`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeAdaptiveAlertRadius(
  profile: MovementProfile,
  accuracyMeters: number | null,
  speedMps: number | null
): number {
  let radius = profile.baseAlertRadius;
  if (accuracyMeters != null) {
    // GPS càng nhiễu thì cần nới bán kính để giảm bỏ sót POI.
    radius += clamp(accuracyMeters * profile.accuracyMultiplier, 0, profile.accuracyCap);
  }
  if (speedMps != null && speedMps > 0) {
    // Khi di chuyển nhanh, mở rộng ngưỡng để hỏi sớm hơn.
    radius += clamp(speedMps * profile.speedMultiplier, 0, profile.speedCap);
  }
  return clamp(radius, profile.minAlertRadius, profile.maxAlertRadius);
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs = NETWORK_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function toDistancePriority(poi: PoiMapItem, lat: number, lng: number): PoiMapItem {
  if (typeof poi.latitude !== "number" || typeof poi.longitude !== "number") return poi;

  const distanceMeters = haversineMeters(lat, lng, poi.latitude, poi.longitude);
  const basePriority = poi.priorityScore ?? distanceMeters;
  const priorityScore = distanceMeters * 0.7 + basePriority * 0.3;

  return {
    ...poi,
    distanceMeters,
    priorityScore,
  };
}

function sortPoiByPriority(a: PoiMapItem, b: PoiMapItem): number {
  if (a.priorityScore != null && b.priorityScore != null) return a.priorityScore - b.priorityScore;
  if (a.distanceMeters != null && b.distanceMeters != null)
    return a.distanceMeters - b.distanceMeters;
  return 0;
}

function buildClusterCandidates(
  nearbyPois: PoiMapItem[],
  alertedPoiAt: Record<string, number>,
  recentPromptCooldownMs: number
): ClusterCandidate[] {
  type MutableCluster = {
    members: PoiMapItem[];
    centerLat: number;
    centerLng: number;
  };

  const clusters: MutableCluster[] = [];

  for (const poi of nearbyPois) {
    if (typeof poi.latitude !== "number" || typeof poi.longitude !== "number") continue;

    let assigned = false;
    for (const cluster of clusters) {
      const distanceToCenter = haversineMeters(
        poi.latitude,
        poi.longitude,
        cluster.centerLat,
        cluster.centerLng
      );

      if (distanceToCenter <= CLUSTER_RADIUS_METERS) {
        cluster.members.push(poi);
        const size = cluster.members.length;
        cluster.centerLat =
          cluster.members.reduce((sum, item) => sum + (item.latitude ?? cluster.centerLat), 0) /
          size;
        cluster.centerLng =
          cluster.members.reduce((sum, item) => sum + (item.longitude ?? cluster.centerLng), 0) /
          size;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      clusters.push({
        members: [poi],
        centerLat: poi.latitude,
        centerLng: poi.longitude,
      });
    }
  }

  return clusters
    .map((cluster) => {
      const ranked = cluster.members
        .map((poi) => {
          const distance = poi.distanceMeters ?? 1_000_000;
          const priority = poi.priorityScore ?? distance;
          const hasNarrationBoost = poi.viNarration?.trim() ? -30 : 0;
          const hasAudioBoost = (poi.languagesWithAudio?.length ?? 0) > 0 ? -20 : 0;
          const recentlyPromptedPenalty =
            Date.now() - (alertedPoiAt[poi.id] ?? 0) < recentPromptCooldownMs ? 180 : 0;
          const score =
            distance * 0.65 +
            priority * 0.25 +
            recentlyPromptedPenalty +
            hasNarrationBoost +
            hasAudioBoost;
          return { poi, score };
        })
        .sort((a, b) => a.score - b.score);

      if (!ranked[0]) return null;

      const clusterId = cluster.members
        .map((item) => item.id)
        .sort((a, b) => a.localeCompare(b))
        .join("|");

      return {
        clusterId,
        centerLat: cluster.centerLat,
        centerLng: cluster.centerLng,
        topPoi: ranked[0].poi,
        score: ranked[0].score,
        memberCount: cluster.members.length,
      } satisfies ClusterCandidate;
    })
    .filter((item): item is ClusterCandidate => Boolean(item))
    .sort((a, b) => a.score - b.score);
}

function CustomerMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const poiMarkersRef = useRef<maplibregl.Marker[]>([]);
  const routeCacheRef = useRef<Record<string, RouteCacheItem>>({});
  const routedPoiRef = useRef<string | null>(null);
  const centeredOnceRef = useRef(false);

  const poiPromptedAtRef = useRef<Record<string, number>>({});
  const clusterPromptedAtRef = useRef<Record<string, number>>({});
  const promptDecisionRef = useRef<Record<string, { decision: "accepted" | "dismissed" | "viewed"; at: number }>>({});
  const proximityTicksRef = useRef<Record<string, number>>({});
  const nearPromptStartedAtRef = useRef<number>(0);
  const lastGlobalPromptAtRef = useRef<number>(0);
  const activeClusterRef = useRef<{ id: string; centerLat: number; centerLng: number } | null>(
    null
  );

  const queueRef = useRef<SpeechChunk[]>([]);
  const queueProcessingRef = useRef(false);
  const pauseRef = useRef(false);
  const pauseAfterSentenceRef = useRef(false);
  const currentChunkRef = useRef<SpeechChunk | null>(null);
  const currentNarrationPoiRef = useRef<string | null>(null);

  const narrationCacheRef = useRef<Record<string, string>>({});
  const poiDetailCacheRef = useRef<Record<string, PoiDetailNarration>>({});

  const watchIdRef = useRef<number | null>(null);
  const lastFetchRef = useRef<{ lat: number; lng: number; q: string; at: number } | null>(null);
  const handledFocusPoiRef = useRef<string | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<number | null>(null);
  const [locationSpeedMps, setLocationSpeedMps] = useState<number | null>(null);
  const [pois, setPois] = useState<PoiMapItem[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [nearPromptPoi, setNearPromptPoi] = useState<PoiMapItem | null>(null);
  const [promptClusterInfo, setPromptClusterInfo] = useState<{
    clusterId: string;
    memberCount: number;
  } | null>(null);
  const [language, setLanguage] = useState("vi");

  const [queueCount, setQueueCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentAudioLabel, setCurrentAudioLabel] = useState<string | null>(null);
  const [networkHint, setNetworkHint] = useState<string | null>(null);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [isLoadingPois, setIsLoadingPois] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [autoPromptEnabled, setAutoPromptEnabled] = useState(true);
  const [movementMode, setMovementMode] = useState<MovementMode>("walk");
  const [activeRoutePoiId, setActiveRoutePoiId] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  const focusPoiId = searchParams.get("focusPoi");
  const routeToPoiId = searchParams.get("routeTo");

  const selectedPoi = useMemo(
    () => pois.find((poi) => poi.id === selectedPoiId) ?? null,
    [pois, selectedPoiId]
  );

  const languageOptions = useMemo(() => {
    const options = new Set<string>(LANGUAGE_PRESETS);
    for (const poi of pois) {
      for (const lang of poi.availableLanguages ?? []) options.add(lang.toLowerCase());
    }
    return Array.from(options);
  }, [pois]);

  const movementProfile = useMemo(() => MOVEMENT_PROFILES[movementMode], [movementMode]);

  const effectiveAlertRadius = useMemo(
    () => computeAdaptiveAlertRadius(movementProfile, locationAccuracyMeters, locationSpeedMps),
    [locationAccuracyMeters, locationSpeedMps, movementProfile]
  );

  const effectiveExitRadius = useMemo(
    () => Math.max(movementProfile.exitFloor, effectiveAlertRadius + movementProfile.exitPadding),
    [effectiveAlertRadius, movementProfile]
  );

  const updateQueueCount = () => {
    setQueueCount(queueRef.current.length + (currentChunkRef.current ? 1 : 0));
  };

  const processSpeechQueue = () => {
    if (queueProcessingRef.current || pauseRef.current) return;
    if (typeof window === "undefined") return;

    const next = queueRef.current.shift();
    if (!next) {
      currentChunkRef.current = null;
      setIsSpeaking(false);
      setCurrentAudioLabel(null);
      updateQueueCount();
      return;
    }

    queueProcessingRef.current = true;
    currentChunkRef.current = next;
    updateQueueCount();

    setCurrentAudioLabel(next.label);

    // Dùng TTS utility (tự động fallback Google Translate nếu không có voice)
    ttsSpeak({
      text: next.text,
      lang: next.lang.split("-")[0] || next.lang,
      rate: 0.94,
      onStart: () => {
        setIsSpeaking(true);
        setIsPaused(false);
      },
      onEnd: () => {
        queueProcessingRef.current = false;
        currentChunkRef.current = null;
        setCurrentAudioLabel(null);

        if (pauseAfterSentenceRef.current) {
          pauseAfterSentenceRef.current = false;
          pauseRef.current = true;
          setIsPaused(true);
          setIsSpeaking(false);
          updateQueueCount();
          return;
        }

        processSpeechQueue();
      },
      onError: () => {
        queueProcessingRef.current = false;
        currentChunkRef.current = null;
        setCurrentAudioLabel(null);
        processSpeechQueue();
      },
    });
  };

  const enqueueSpeech = (items: SpeechChunk[]) => {
    const existingKeys = new Set<string>([
      ...queueRef.current.map((item) => item.key),
      ...(currentChunkRef.current ? [currentChunkRef.current.key] : []),
    ]);

    for (const item of items) {
      if (existingKeys.has(item.key)) continue;
      queueRef.current.push(item);
      existingKeys.add(item.key);
    }

    updateQueueCount();
    processSpeechQueue();
  };

  const enqueueSpeechBySentence = (
    text: string,
    lang: string,
    keyPrefix: string,
    label: string,
    poiId?: string
  ) => {
    const sentences = splitSentences(text);
    if (sentences.length === 0) return;

    const chunks: SpeechChunk[] = sentences.map((sentence, index) => ({
      id: `${keyPrefix}-${index}-${Date.now()}`,
      key: `${keyPrefix}-${index}`,
      text: sentence,
      lang,
      label,
      poiId,
    }));

    enqueueSpeech(chunks);
  };

  const stopAudioQueue = () => {
    queueRef.current = [];
    queueProcessingRef.current = false;
    pauseRef.current = false;
    pauseAfterSentenceRef.current = false;
    currentChunkRef.current = null;
    currentNarrationPoiRef.current = null;

    setIsPaused(false);
    setIsSpeaking(false);
    setCurrentAudioLabel(null);
    updateQueueCount();

    ttsStop();
  };

  const pauseAudioQueue = () => {
    if (pauseRef.current || pauseAfterSentenceRef.current) return;

    if (queueProcessingRef.current || currentChunkRef.current) {
      pauseAfterSentenceRef.current = true;
      setIsPaused(true);
      return;
    }

    pauseRef.current = true;
    setIsPaused(true);
  };

  const resumeAudioQueue = () => {
    if (!pauseRef.current && !pauseAfterSentenceRef.current) return;
    pauseAfterSentenceRef.current = false;
    pauseRef.current = false;
    setIsPaused(false);
    processSpeechQueue();
  };

  const loadNearbyPois = async (lat: number, lng: number, keyword = "") => {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      mode: "map",
      take: "80",
    });

    if (keyword.trim()) params.set("q", keyword.trim());

    setIsLoadingPois(true);
    try {
      const res = await fetchWithTimeout(
        `/api/customer/pois?${params.toString()}`,
        { method: "GET" },
        NETWORK_TIMEOUT_MS
      );
      if (!res.ok) throw new Error("network");

      const data = (await res.json().catch(() => null)) as { pois?: PoiMapItem[] } | null;
      if (data?.pois) {
        const merged = data.pois
          .map((poi) => toDistancePriority(poi, lat, lng))
          .sort(sortPoiByPriority);
        setPois(merged);
      }
      setNetworkHint(null);
    } catch {
      setNetworkHint(
        "Mạng yếu, hệ thống đang giữ dữ liệu gần nhất để không gián đoạn trải nghiệm."
      );
    } finally {
      setIsLoadingPois(false);
    }
  };

  const getNarrationText = async (poi: PoiMapItem, targetLanguage: string): Promise<string> => {
    const lang = targetLanguage.toLowerCase();
    const cacheKey = `${poi.id}:${lang}`;
    if (narrationCacheRef.current[cacheKey]) return narrationCacheRef.current[cacheKey];

    const viFallback = (
      poi.viNarration?.trim() ||
      poi.description?.trim() ||
      `Bạn đang đến gần ${poi.name}`
    ).trim();
    if (lang === "vi") {
      narrationCacheRef.current[cacheKey] = viFallback;
      return viFallback;
    }

    if (!isOnline) {
      return narrationCacheRef.current[`${poi.id}:vi`] || viFallback;
    }

    let detail: PoiDetailNarration | undefined = poiDetailCacheRef.current[poi.id];
    if (!detail) {
      try {
        const res = await fetchWithTimeout(
          `/api/customer/pois/${poi.id}`,
          { method: "GET" },
          NETWORK_TIMEOUT_MS
        );
        if (res.ok) {
          const data = (await res.json().catch(() => null)) as { poi?: PoiDetailNarration } | null;
          detail = data?.poi;
          if (detail) poiDetailCacheRef.current[poi.id] = detail;
        }
      } catch {
        // keep fallback
      }
    }

    const translatedFromSource =
      detail?.translations
        ?.find((item) => item.language.toLowerCase() === lang)
        ?.audioScript?.trim() ||
      detail?.translations
        ?.find((item) => item.language.toLowerCase() === lang)
        ?.description?.trim() ||
      "";

    if (translatedFromSource) {
      narrationCacheRef.current[cacheKey] = translatedFromSource;
      return translatedFromSource;
    }

    const viSource =
      detail?.translations
        ?.find((item) => item.language.toLowerCase() === "vi")
        ?.audioScript?.trim() ||
      detail?.translations
        ?.find((item) => item.language.toLowerCase() === "vi")
        ?.description?.trim() ||
      detail?.description?.trim() ||
      viFallback;

    try {
      const translate = await fetchWithTimeout(
        "/api/tools/translate",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ q: viSource, source: "vi", target: lang }),
        },
        NETWORK_TIMEOUT_MS
      );

      if (translate.ok) {
        const translated = (await translate.json().catch(() => null)) as {
          translatedText?: string;
        } | null;
        const text = translated?.translatedText?.trim() || viSource;
        narrationCacheRef.current[cacheKey] = text;
        return text;
      }
    } catch {
      // fallback to vi
    }

    return viSource;
  };

  const clearRouteLine = () => {
    routedPoiRef.current = null;
    const map = mapRef.current;
    setIsRouting(false);
    if (!map) {
      setRouteInfo(null);
      return;
    }

    if (map.getLayer(ROUTE_LINE_LAYER_ID)) map.removeLayer(ROUTE_LINE_LAYER_ID);
    if (map.getLayer(ROUTE_LINE_OUTLINE_LAYER_ID)) map.removeLayer(ROUTE_LINE_OUTLINE_LAYER_ID);
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
    setRouteInfo(null);
  };

  const upsertRouteLine = (
    coordinates: [number, number][],
    info: RouteInfo,
    fitToRoute = false
  ) => {
    const map = mapRef.current;
    if (!map || coordinates.length < 2) return;

    if (!map.isStyleLoaded()) {
      map.once("load", () => upsertRouteLine(coordinates, info, fitToRoute));
      return;
    }

    const sourceData = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates,
      },
    } as const;

    const existing = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(sourceData);
    } else {
      map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: sourceData,
      });

      map.addLayer({
        id: ROUTE_LINE_OUTLINE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#1e293b",
          "line-width": 7,
          "line-opacity": 0.45,
        },
      });

      map.addLayer({
        id: ROUTE_LINE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#f97316",
          "line-width": 4.5,
          "line-opacity": 0.95,
        },
      });
    }

    if (fitToRoute) {
      const bounds = new maplibregl.LngLatBounds(
        [coordinates[0][0], coordinates[0][1]],
        [coordinates[0][0], coordinates[0][1]]
      );
      for (const coordinate of coordinates) bounds.extend(coordinate);
      map.fitBounds(bounds, { padding: 70, maxZoom: 16, duration: 700 });
    }

    setRouteInfo(info);
  };

  const fetchRouteToPoi = async (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<RouteCacheItem> => {
    const key = routeCacheKey(from.lat, from.lng, to.lat, to.lng);
    if (routeCacheRef.current[key]) return routeCacheRef.current[key];

    try {
      const response = await fetchWithTimeout(
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`,
        { method: "GET" },
        NETWORK_TIMEOUT_MS
      );

      if (response.ok) {
        const data = (await response.json().catch(() => null)) as {
          routes?: Array<{
            distance?: number;
            duration?: number;
            geometry?: { coordinates?: [number, number][] };
          }>;
        } | null;

        const firstRoute = data?.routes?.[0];
        const coordinates = firstRoute?.geometry?.coordinates ?? [];
        if (coordinates.length >= 2) {
          const payload: RouteCacheItem = {
            coordinates,
            info: {
              distanceMeters: firstRoute?.distance ?? haversineMeters(from.lat, from.lng, to.lat, to.lng),
              durationSeconds:
                firstRoute?.duration ??
                Math.max(240, haversineMeters(from.lat, from.lng, to.lat, to.lng) / 6),
              source: "osrm",
            },
          };
          routeCacheRef.current[key] = payload;
          return payload;
        }
      }
    } catch {
      // fallback bên dưới
    }

    const straightDistance = haversineMeters(from.lat, from.lng, to.lat, to.lng);
    const fallback: RouteCacheItem = {
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
      info: {
        distanceMeters: straightDistance,
        durationSeconds: Math.max(240, straightDistance / 6),
        source: "straight",
      },
    };
    routeCacheRef.current[key] = fallback;
    return fallback;
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const onOnline = () => {
      setIsOnline(true);
      setNetworkHint(null);
    };

    const onOffline = () => {
      setIsOnline(false);
      setNetworkHint("Bạn đang offline. Hệ thống dùng dữ liệu đã lưu cục bộ.");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(MOVEMENT_MODE_STORAGE_KEY);
    if (stored === "walk" || stored === "motorbike") {
      setMovementMode(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MOVEMENT_MODE_STORAGE_KEY, movementMode);
  }, [movementMode]);

  useEffect(() => {
    setNearPromptPoi(null);
    setPromptClusterInfo(null);
    proximityTicksRef.current = {};
    activeClusterRef.current = null;
  }, [movementMode]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center: DEFAULT_CENTER,
      zoom: 14,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    mapRef.current = map;

    return () => {
      for (const marker of poiMarkersRef.current) {
        marker.remove();
      }
      poiMarkersRef.current = [];
      if (map.getLayer(ROUTE_LINE_LAYER_ID)) map.removeLayer(ROUTE_LINE_LAYER_ID);
      if (map.getLayer(ROUTE_LINE_OUTLINE_LAYER_ID)) map.removeLayer(ROUTE_LINE_OUTLINE_LAYER_ID);
      if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;

      if (typeof window !== "undefined") {
        ttsStop();
      }
    };
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setUserLocation({ lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] });
      setLocationHint("Thiết bị không hỗ trợ GPS, đang dùng vị trí mặc định.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationAccuracyMeters(Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null);
        setLocationSpeedMps(
          typeof pos.coords.speed === "number" && Number.isFinite(pos.coords.speed)
            ? Math.max(0, pos.coords.speed)
            : null
        );
        setLocationHint(null);
        setIsLocating(false);
      },
      () => {
        setUserLocation({ lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] });
        setLocationHint("Không lấy được GPS chính xác, đang dùng vị trí dự phòng.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 10_000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationAccuracyMeters(Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null);
        setLocationSpeedMps(
          typeof pos.coords.speed === "number" && Number.isFinite(pos.coords.speed)
            ? Math.max(0, pos.coords.speed)
            : null
        );
        setLocationHint(null);
      },
      () => {
        setLocationHint("GPS tạm thời yếu, hệ thống vẫn giữ vị trí gần nhất.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 4_000,
      }
    );

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!userLocation) return;

    setPois((prev) =>
      prev
        .map((poi) => toDistancePriority(poi, userLocation.lat, userLocation.lng))
        .sort(sortPoiByPriority)
    );
  }, [userLocation]);

  useEffect(() => {
    if (!userLocation) return;

    const last = lastFetchRef.current;
    const now = Date.now();
    const movedMeters = last
      ? haversineMeters(last.lat, last.lng, userLocation.lat, userLocation.lng)
      : Number.POSITIVE_INFINITY;
    const shouldFetch =
      !last || last.q !== appliedQuery || movedMeters > 45 || now - last.at > 15_000;

    if (!shouldFetch) return;

    lastFetchRef.current = {
      lat: userLocation.lat,
      lng: userLocation.lng,
      q: appliedQuery,
      at: now,
    };

    void loadNearbyPois(userLocation.lat, userLocation.lng, appliedQuery);
  }, [appliedQuery, userLocation]);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new maplibregl.Marker({ color: "#2563eb" })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText("Vị trí của bạn"))
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }

    if (!centeredOnceRef.current) {
      centeredOnceRef.current = true;
      mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 15, speed: 0.9 });
    }
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of poiMarkersRef.current) {
      marker.remove();
    }
    poiMarkersRef.current = [];

    for (const poi of pois) {
      if (typeof poi.latitude !== "number" || typeof poi.longitude !== "number") continue;

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 18,
      }).setText(poi.name);
      const isSelected = poi.id === selectedPoiId;

      const marker = new maplibregl.Marker({
        color: isSelected ? "#f97316" : "#dc2626",
        scale: isSelected ? 1.08 : 0.95,
      })
        .setLngLat([poi.longitude, poi.latitude])
        .setPopup(popup)
        .addTo(map);

      const element = marker.getElement();
      element.style.cursor = "pointer";
      element.addEventListener("mouseenter", () => popup.addTo(map));
      element.addEventListener("mouseleave", () => popup.remove());
      element.addEventListener("click", () => {
        setSelectedPoiId(poi.id);
        stopAudioQueue();
        router.push(`/customer/pois/${poi.id}`);
      });

      poiMarkersRef.current.push(marker);
    }
  }, [pois, router, selectedPoiId]);

  useEffect(() => {
    if (!selectedPoi || !mapRef.current) return;
    if (typeof selectedPoi.latitude !== "number" || typeof selectedPoi.longitude !== "number")
      return;

    mapRef.current.flyTo({
      center: [selectedPoi.longitude, selectedPoi.latitude],
      zoom: 15.5,
      speed: 0.8,
      essential: true,
    });
  }, [selectedPoi]);

  useEffect(() => {
    if (!activeRoutePoiId || !userLocation) {
      clearRouteLine();
      return;
    }

    const routePoi =
      pois.find((item) => item.id === activeRoutePoiId) ??
      (selectedPoi?.id === activeRoutePoiId ? selectedPoi : null);

    if (
      !routePoi ||
      typeof routePoi.latitude !== "number" ||
      typeof routePoi.longitude !== "number"
    ) {
      clearRouteLine();
      return;
    }
    const routeLat = routePoi.latitude;
    const routeLng = routePoi.longitude;

    let cancelled = false;
    setIsRouting(true);

    void (async () => {
      const route = await fetchRouteToPoi(userLocation, {
        lat: routeLat,
        lng: routeLng,
      });
      if (cancelled) return;
      const shouldFit = routedPoiRef.current !== routePoi.id;
      upsertRouteLine(route.coordinates, route.info, shouldFit);
      routedPoiRef.current = routePoi.id;
      setIsRouting(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeRoutePoiId, pois, selectedPoi, userLocation]);

  useEffect(() => {
    if (!focusPoiId || handledFocusPoiRef.current === focusPoiId) return;

    const localPoi = pois.find((item) => item.id === focusPoiId);
    if (localPoi) {
      handledFocusPoiRef.current = focusPoiId;
      setSelectedPoiId(localPoi.id);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetchWithTimeout(
          `/api/customer/pois/${focusPoiId}`,
          { method: "GET" },
          NETWORK_TIMEOUT_MS
        );
        if (!res.ok) return;

        const data = (await res.json().catch(() => null)) as {
          poi?: {
            id: string;
            name: string;
            description?: string | null;
            latitude?: number | null;
            longitude?: number | null;
          };
        } | null;

        if (cancelled || !data?.poi) return;

        const focusPoi: PoiMapItem = {
          id: data.poi.id,
          name: data.poi.name,
          description: data.poi.description ?? undefined,
          viNarration: data.poi.description ?? undefined,
          latitude: data.poi.latitude,
          longitude: data.poi.longitude,
          availableLanguages: ["vi"],
        };

        setPois((prev) => {
          const merged = [...prev.filter((item) => item.id !== focusPoi.id), focusPoi];
          if (!userLocation) return merged;
          return merged
            .map((item) => toDistancePriority(item, userLocation.lat, userLocation.lng))
            .sort(sortPoiByPriority);
        });

        setSelectedPoiId(focusPoi.id);
        handledFocusPoiRef.current = focusPoiId;

        if (
          mapRef.current &&
          typeof focusPoi.latitude === "number" &&
          typeof focusPoi.longitude === "number"
        ) {
          mapRef.current.flyTo({
            center: [focusPoi.longitude, focusPoi.latitude],
            zoom: 16,
            speed: 0.8,
          });
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [focusPoiId, pois, userLocation]);

  useEffect(() => {
    if (!routeToPoiId) return;
    setSelectedPoiId(routeToPoiId);
    setActiveRoutePoiId(routeToPoiId);
  }, [routeToPoiId]);

  useEffect(() => {
    if (autoPromptEnabled) return;
    setNearPromptPoi(null);
    setPromptClusterInfo(null);
  }, [autoPromptEnabled]);

  useEffect(() => {
    if (!nearPromptPoi || !userLocation) return;
    if (typeof nearPromptPoi.latitude !== "number" || typeof nearPromptPoi.longitude !== "number")
      return;

    const distance = haversineMeters(
      userLocation.lat,
      userLocation.lng,
      nearPromptPoi.latitude,
      nearPromptPoi.longitude
    );
    if (distance > effectiveExitRadius) {
      setNearPromptPoi(null);
      setPromptClusterInfo(null);
    }
  }, [effectiveExitRadius, nearPromptPoi, userLocation]);

  useEffect(() => {
    if (!autoPromptEnabled || !userLocation) return;

    const active = activeClusterRef.current;
    if (active) {
      const distanceFromActive = haversineMeters(
        userLocation.lat,
        userLocation.lng,
        active.centerLat,
        active.centerLng
      );
      if (distanceFromActive > effectiveExitRadius) {
        activeClusterRef.current = null;
      }
    }

    if (nearPromptPoi || (activeRoutePoiId && !isRouting)) return;

    const nearby = pois.filter((poi) => {
      if (typeof poi.latitude !== "number" || typeof poi.longitude !== "number") return false;
      const distance =
        poi.distanceMeters ??
        haversineMeters(userLocation.lat, userLocation.lng, poi.latitude, poi.longitude);
      return distance <= effectiveAlertRadius;
    });

    const nearbyIds = new Set<string>(nearby.map((item) => item.id));
    for (const poiId of Object.keys(proximityTicksRef.current)) {
      if (!nearbyIds.has(poiId)) delete proximityTicksRef.current[poiId];
    }
    for (const poi of nearby) {
      proximityTicksRef.current[poi.id] = (proximityTicksRef.current[poi.id] ?? 0) + 1;
    }

    const stableNearby = nearby.filter(
      (poi) => (proximityTicksRef.current[poi.id] ?? 0) >= movementProfile.stabilityTicks
    );

    if (stableNearby.length === 0) return;

    const candidates = buildClusterCandidates(
      stableNearby,
      poiPromptedAtRef.current,
      movementProfile.poiCooldownMs
    );
    if (candidates.length === 0) return;

    const now = Date.now();
    if (now - lastGlobalPromptAtRef.current < movementProfile.globalPromptIntervalMs) return;

    const selectedCandidate = candidates.find((candidate) => {
      const clusterCooldown = now - (clusterPromptedAtRef.current[candidate.clusterId] ?? 0);
      const poiCooldown = now - (poiPromptedAtRef.current[candidate.topPoi.id] ?? 0);
      const decision = promptDecisionRef.current[candidate.topPoi.id];
      if (
        decision?.decision === "dismissed" &&
        now - decision.at < movementProfile.dismissPromptCooldownMs
      )
        return false;
      if (clusterCooldown < movementProfile.clusterCooldownMs) return false;
      if (poiCooldown < movementProfile.poiCooldownMs) return false;
      if (activeClusterRef.current?.id === candidate.clusterId) return false;
      return true;
    });

    if (!selectedCandidate) return;

    clusterPromptedAtRef.current[selectedCandidate.clusterId] = now;
    poiPromptedAtRef.current[selectedCandidate.topPoi.id] = now;
    lastGlobalPromptAtRef.current = now;
    activeClusterRef.current = {
      id: selectedCandidate.clusterId,
      centerLat: selectedCandidate.centerLat,
      centerLng: selectedCandidate.centerLng,
    };

    nearPromptStartedAtRef.current = now;
    setNearPromptPoi(selectedCandidate.topPoi);
    setPromptClusterInfo({
      clusterId: selectedCandidate.clusterId,
      memberCount: selectedCandidate.memberCount,
    });

    // Preload narration trước để người dùng bấm "Nghe" sẽ phản hồi nhanh hơn.
    void getNarrationText(selectedCandidate.topPoi, language.toLowerCase());

    if (!isSpeaking && queueRef.current.length === 0 && !pauseRef.current) {
      enqueueSpeechBySentence(
        `Bạn đang đến gần ${selectedCandidate.topPoi.name}. Bạn có muốn nghe thuyết minh không?`,
        speechLang("vi"),
        `cluster-alert-${selectedCandidate.clusterId}`,
        "Cảnh báo POI",
        selectedCandidate.topPoi.id
      );
    }
  }, [
    activeRoutePoiId,
    autoPromptEnabled,
    effectiveAlertRadius,
    effectiveExitRadius,
    isRouting,
    isSpeaking,
    language,
    nearPromptPoi,
    pois,
    movementProfile,
    userLocation,
  ]);

  useEffect(() => {
    if (!nearPromptPoi) return;

    const timer = setTimeout(() => {
      promptDecisionRef.current[nearPromptPoi.id] = { decision: "dismissed", at: Date.now() };
      setNearPromptPoi(null);
      setPromptClusterInfo(null);
    }, movementProfile.promptTimeoutMs);

    return () => clearTimeout(timer);
  }, [movementProfile.promptTimeoutMs, nearPromptPoi]);

  const handleApplySearch = () => {
    setAppliedQuery(queryInput.trim());

    if (userLocation) {
      void loadNearbyPois(userLocation.lat, userLocation.lng, queryInput.trim());
    }
  };

  const handleRouteToPoi = (poi: PoiMapItem) => {
    if (typeof poi.latitude !== "number" || typeof poi.longitude !== "number") return;
    setSelectedPoiId(poi.id);
    setActiveRoutePoiId(poi.id);
  };

  const handleClearRoute = () => {
    setActiveRoutePoiId(null);
    clearRouteLine();
  };

  const handleListenNearbyPoi = async () => {
    if (!nearPromptPoi) return;

    const targetPoi = nearPromptPoi;
    const preferredLanguage = language.toLowerCase();
    const resolvedLanguage = !isOnline && preferredLanguage !== "vi" ? "vi" : preferredLanguage;

    if (!isOnline && preferredLanguage !== "vi") {
      setNetworkHint("Mạng đang yếu, tạm phát thuyết minh tiếng Việt đã lưu.");
    }

    promptDecisionRef.current[targetPoi.id] = { decision: "accepted", at: Date.now() };
    setNearPromptPoi(null);
    setPromptClusterInfo(null);

    const text = await getNarrationText(targetPoi, resolvedLanguage);
    if (!text.trim()) return;

    const currentPoiId = currentNarrationPoiRef.current;
    if (currentPoiId && currentPoiId !== targetPoi.id) {
      const currentPoi = pois.find((item) => item.id === currentPoiId);
      const currentDistance = currentPoi?.distanceMeters ?? Number.POSITIVE_INFINITY;
      const nextDistance = targetPoi.distanceMeters ?? Number.POSITIVE_INFINITY;

      // Nếu POI mới gần hơn đáng kể thì ngắt queue cũ để ưu tiên điểm sắp chạm tới.
      if (nextDistance + 30 < currentDistance) {
        stopAudioQueue();
      } else if (queueRef.current.length > 8) {
        return;
      }
    }

    currentNarrationPoiRef.current = targetPoi.id;
    setSelectedPoiId(targetPoi.id);

    enqueueSpeechBySentence(
      text,
      speechLang(resolvedLanguage),
      `poi-narration-${targetPoi.id}-${resolvedLanguage}`,
      `Thuyết minh: ${targetPoi.name}`,
      targetPoi.id
    );
  };

  const nearbyList = useMemo(() => pois.slice(0, 30), [pois]);

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* Glassmorphism Header */}
      <header className="glass-header sticky top-0 z-40 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-slate-900">Bản đồ POI</h1>
            <p className="text-xs text-slate-500">Vị trí: xanh / POI: cam</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoPromptEnabled((prev) => !prev)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition ${
                autoPromptEnabled
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {autoPromptEnabled ? "Auto hỏi: Bật" : "Auto hỏi: Tắt"}
            </button>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {(["walk", "motorbike"] as MovementMode[]).map((mode) => {
                const active = movementMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setMovementMode(mode)}
                    title={MOVEMENT_PROFILES[mode].hint}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {MOVEMENT_PROFILES[mode].label}
                  </button>
                );
              })}
            </div>
            <Link
              href="/customer"
              className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-shadow hover:shadow-md"
            >
              Về trang tìm
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplySearch();
              }}
              placeholder="Nhập từ khóa POI..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[15px] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleApplySearch}
            className="min-h-11 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-md hover:bg-orange-600 active:scale-[0.97] transition-all"
          >
            Tìm
          </button>
        </div>

        {/* Status Indicators */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${
              isOnline ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {isOnline ? "Online" : "Offline"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1.5 text-blue-700">
            <MapPin className="h-3.5 w-3.5" />
            {isLoadingPois ? "Đang cập nhật..." : `${pois.length} POI`}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1.5 text-orange-700">
            <Navigation className="h-3.5 w-3.5" />
            Radius: ~{Math.round(effectiveAlertRadius)}m
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-violet-700">
            Chế độ: {movementProfile.label}
          </span>
          {locationAccuracyMeters != null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1.5 text-indigo-700">
              GPS ±{Math.round(locationAccuracyMeters)}m
            </span>
          ) : null}
          {isLocating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1.5 text-purple-700 animate-pulse-soft">
              <Navigation className="h-3.5 w-3.5" />
              Đang định vị...
            </span>
          ) : null}
        </div>
        {locationHint ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            <Navigation className="h-3.5 w-3.5" />
            {locationHint}
          </p>
        ) : null}
        {networkHint ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            <WifiOff className="h-3.5 w-3.5" />
            {networkHint}
          </p>
        ) : null}
        <p className="mt-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700">
          {movementProfile.hint}
          {movementMode === "walk" && locationSpeedMps != null && locationSpeedMps > 7
            ? " Tốc độ hiện tại khá cao, nếu bạn đang đi xe máy thì nên đổi chế độ để hệ thống hỏi sớm hơn."
            : ""}
        </p>
        {!autoPromptEnabled ? (
          <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
            Auto hỏi thuyết minh đang tắt. Bạn vẫn có thể bấm POI để nghe thủ công.
          </p>
        ) : null}
      </header>

      <main className="space-y-4 p-4">
        {/* Map Container with enhanced styling */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elevated">
          <div ref={mapContainerRef} className="h-[48vh] w-full sm:h-[52vh]" />
        </div>

        {(isRouting || routeInfo) && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-blue-900">
                {isRouting ? (
                  <span className="font-semibold">Đang tính tuyến đường trong ứng dụng...</span>
                ) : routeInfo ? (
                  <span className="font-semibold">
                    Tuyến đường: {formatRouteDistance(routeInfo.distanceMeters)} -{" "}
                    {formatRouteDuration(routeInfo.durationSeconds)}
                    {routeInfo.source === "straight" ? " (ước lượng)" : ""}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleClearRoute}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                Xóa tuyến
              </button>
            </div>
          </div>
        )}

        {/* Nearby POI Alert - Enhanced */}
        {nearPromptPoi ? (
          <div className="animate-fade-in-up rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-medium">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-white animate-pulse-soft">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-orange-900">
                  Bạn đang đến gần {nearPromptPoi.name}
                </p>
                <p className="mt-1 text-sm text-orange-700">
                  {promptClusterInfo && promptClusterInfo.memberCount > 1
                    ? `Có ${promptClusterInfo.memberCount} POI trong cụm gần nhau.`
                    : "Hệ thống phát hiện bạn đang đến gần POI này."}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleListenNearbyPoi();
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-orange-600 active:scale-[0.97] transition-all"
              >
                <Play className="h-4 w-4" /> Nghe thuyết minh
              </button>
              <button
                type="button"
                onClick={() => {
                  if (nearPromptPoi) {
                    promptDecisionRef.current[nearPromptPoi.id] = {
                      decision: "dismissed",
                      at: Date.now(),
                    };
                  }
                  setNearPromptPoi(null);
                  setPromptClusterInfo(null);
                }}
                className="min-h-11 rounded-xl border-2 border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 active:scale-[0.97] transition-all"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                onClick={() => {
                  promptDecisionRef.current[nearPromptPoi.id] = {
                    decision: "viewed",
                    at: Date.now(),
                  };
                  router.push(`/customer/pois/${nearPromptPoi.id}`);
                }}
                className="min-h-11 rounded-xl border-2 border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 active:scale-[0.97] transition-all"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        ) : null}

        {/* Audio Controls - Enhanced */}
        <div className="card-elevated">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="speech-language">
              Ngôn ngữ:
            </label>
            <select
              id="speech-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            >
              {languageOptions.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>

            <div className="flex-1" />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={pauseAudioQueue}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  isPaused
                    ? "bg-amber-100 text-amber-700"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Pause className="h-4 w-4" /> Tạm dừng
              </button>
              <button
                type="button"
                onClick={resumeAudioQueue}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  !isPaused && isSpeaking
                    ? "bg-emerald-100 text-emerald-700"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Play className="h-4 w-4" /> Tiếp tục
              </button>
              <button
                type="button"
                onClick={stopAudioQueue}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
              >
                <Square className="h-4 w-4" /> Dừng
              </button>
            </div>
          </div>

          {/* Audio Status with visual indicator */}
          <div className="mt-3 flex items-center gap-3">
            <div
              className={`flex-1 rounded-full p-1 ${
                isSpeaking ? "bg-gradient-to-r from-orange-400 to-amber-400" : "bg-slate-100"
              }`}
            >
              <div className="flex h-2 items-center gap-0.5 rounded-full bg-white/30 px-2">
                {isSpeaking ? (
                  <>
                    <span
                      className="h-3 w-1 rounded-full bg-white animate-pulse"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-4 w-1 rounded-full bg-white animate-pulse"
                      style={{ animationDelay: "100ms" }}
                    />
                    <span
                      className="h-2 w-1 rounded-full bg-white animate-pulse"
                      style={{ animationDelay: "200ms" }}
                    />
                    <span
                      className="h-4 w-1 rounded-full bg-white animate-pulse"
                      style={{ animationDelay: "300ms" }}
                    />
                    <span
                      className="h-3 w-1 rounded-full bg-white animate-pulse"
                      style={{ animationDelay: "400ms" }}
                    />
                  </>
                ) : (
                  <span className="h-2 w-full rounded-full bg-slate-200" />
                )}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <p className="text-slate-600">
              {isSpeaking
                ? `Đang phát: ${currentAudioLabel ?? "thuyết minh"}`
                : isPaused
                  ? "Đang tạm dừng..."
                  : "Sẵn sàng phát thuyết minh"}
            </p>
            <span className="text-xs font-medium text-slate-500">Hàng đợi: {queueCount} câu</span>
          </div>
        </div>

        {/* Nearby POIs List - Enhanced */}
        <div className="card-elevated">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">POI gần bạn</h2>
            {selectedPoi ? (
              <span className="text-xs font-medium text-orange-600 bg-orange-50 rounded-full px-2 py-1">
                {selectedPoi.name}
              </span>
            ) : null}
          </div>

          {nearbyList.length === 0 ? (
            <div className="py-8 text-center">
              <MapPin className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">
                Không có POI phù hợp trong phạm vi hiện tại.
              </p>
            </div>
          ) : (
            <div className="flex snap-x gap-3 overflow-x-auto pb-2 scrollbar-horizontal">
              {nearbyList.map((poi, index) => (
                <button
                  key={poi.id}
                  type="button"
                  onTouchStart={() => setSelectedPoiId(poi.id)}
                  onMouseEnter={() => setSelectedPoiId(poi.id)}
                  onClick={() => router.push(`/customer/pois/${poi.id}`)}
                  className={`min-w-[220px] snap-start rounded-xl border-2 p-3 text-left transition-all duration-200 animate-fade-in-up opacity-0 ${
                    selectedPoiId === poi.id
                      ? "border-orange-400 bg-orange-50 shadow-medium scale-105"
                      : "border-slate-200 bg-white hover:border-orange-200 hover:shadow-soft"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <p className="font-semibold text-slate-900 line-clamp-1">{poi.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {poi.description ?? "-"}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                      <Navigation className="h-3 w-3" />
                      {poi.distanceMeters != null
                        ? poi.distanceMeters < 1000
                          ? `${Math.round(poi.distanceMeters)}m`
                          : `${(poi.distanceMeters / 1000).toFixed(1)}km`
                        : "-"}
                    </span>
                    {poi.rating != null ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600">
                        ⭐ {poi.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected POI Detail - Enhanced */}
        {selectedPoi ? (
          <div className="card-featured animate-scale-in">
            {selectedPoi.imageUrl && (
              <div className="relative aspect-video w-full">
                <img
                  src={selectedPoi.imageUrl}
                  alt={selectedPoi.name}
                  className="h-full w-full object-cover"
                />
                <div className="gradient-overlay absolute inset-0" />
                <div className="absolute top-3 right-3">
                  <span className="badge-primary shadow-sm">{selectedPoi.category ?? "POI"}</span>
                </div>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{selectedPoi.name}</h3>
                  <p className="text-sm text-slate-500">{selectedPoi.category ?? "POI"}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/customer/pois/${selectedPoi.id}`)}
                  className="flex-1 min-h-11 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-orange-600 active:scale-[0.97] transition-all"
                >
                  Xem chi tiết POI
                </button>
                {typeof selectedPoi.latitude === "number" &&
                typeof selectedPoi.longitude === "number" ? (
                  <button
                    type="button"
                    onClick={() => handleRouteToPoi(selectedPoi)}
                    className="inline-flex min-h-11 items-center gap-1 rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] transition-all"
                  >
                    <Navigation className="h-4 w-4" /> Dẫn đường
                  </button>
                ) : null}
                {activeRoutePoiId === selectedPoi.id ? (
                  <button
                    type="button"
                    onClick={handleClearRoute}
                    className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 active:scale-[0.97] transition-all"
                  >
                    <Square className="h-4 w-4" /> Xóa tuyến
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function CustomerMapPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            fontSize: 16,
          }}
        >
          Loading map...
        </div>
      }
    >
      <CustomerMapContent />
    </Suspense>
  );
}
