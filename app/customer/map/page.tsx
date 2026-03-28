"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import maplibregl from "maplibre-gl";
import { MapPin, Navigation, Pause, Play, Search, Square, Wifi, WifiOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { speak as ttsSpeak, stopSpeaking as ttsStop } from "@/lib/tts";

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
const CLUSTER_COOLDOWN_MS = 4 * 60_000;
const POI_COOLDOWN_MS = 8 * 60_000;
const CLUSTER_EXIT_RADIUS_METERS = 180;
const NETWORK_TIMEOUT_MS = 5000;
const DEFAULT_CENTER: [number, number] = [106.7009, 10.7769];

function speechLang(code: string): string {
  const value = code.toLowerCase();
  if (value === "vi") return "vi-VN";
  if (value === "en") return "en-US";
  if (value === "fr") return "fr-FR";
  if (value === "ja") return "ja-JP";
  return value;
}

function splitSentences(text: string): string[] {
  return voice || null;
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
  if (a.distanceMeters != null && b.distanceMeters != null) return a.distanceMeters - b.distanceMeters;
  return 0;
}

function buildClusterCandidates(
  nearbyPois: PoiMapItem[],
  alertedPoiAt: Record<string, number>
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
        cluster.centerLat = cluster.members.reduce((sum, item) => sum + (item.latitude ?? cluster.centerLat), 0) / size;
        cluster.centerLng = cluster.members.reduce((sum, item) => sum + (item.longitude ?? cluster.centerLng), 0) / size;
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
          const recentlyPromptedPenalty = Date.now() - (alertedPoiAt[poi.id] ?? 0) < POI_COOLDOWN_MS ? 180 : 0;
          const score = distance * 0.65 + priority * 0.25 + recentlyPromptedPenalty + hasNarrationBoost + hasAudioBoost;
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

export default function CustomerMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const poiMarkersRef = useRef<maplibregl.Marker[]>([]);
  const centeredOnceRef = useRef(false);

  const poiPromptedAtRef = useRef<Record<string, number>>({});
  const clusterPromptedAtRef = useRef<Record<string, number>>({});
  const activeClusterRef = useRef<{ id: string; centerLat: number; centerLng: number } | null>(null);

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
  const [pois, setPois] = useState<PoiMapItem[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [nearPromptPoi, setNearPromptPoi] = useState<PoiMapItem | null>(null);
  const [promptClusterInfo, setPromptClusterInfo] = useState<{ clusterId: string; memberCount: number } | null>(null);
  const [language, setLanguage] = useState("vi");

  const [queueCount, setQueueCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentAudioLabel, setCurrentAudioLabel] = useState<string | null>(null);
  const [networkHint, setNetworkHint] = useState<string | null>(null);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [isLoadingPois, setIsLoadingPois] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const focusPoiId = searchParams.get("focusPoi");

  const selectedPoi = useMemo(
    () => pois.find((poi) => poi.id === selectedPoiId) ?? null,
    [pois, selectedPoiId]
  );

  const languageOptions = useMemo(() => {
    const options = new Set<string>(["vi", "en"]);
    for (const poi of pois) {
      for (const lang of poi.availableLanguages ?? []) options.add(lang.toLowerCase());
    }
    return Array.from(options);
  }, [pois]);

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

  const enqueueSpeechBySentence = (text: string, lang: string, keyPrefix: string, label: string, poiId?: string) => {
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
      const res = await fetchWithTimeout(`/api/customer/pois?${params.toString()}`, { method: "GET" }, NETWORK_TIMEOUT_MS);
      if (!res.ok) throw new Error("network");

      const data = (await res.json().catch(() => null)) as { pois?: PoiMapItem[] } | null;
      if (data?.pois) {
        const merged = data.pois.map((poi) => toDistancePriority(poi, lat, lng)).sort(sortPoiByPriority);
        setPois(merged);
      }
      setNetworkHint(null);
    } catch {
      setNetworkHint("Mạng yếu, hệ thống đang giữ dữ liệu gần nhất để không gián đoạn trải nghiệm.");
    } finally {
      setIsLoadingPois(false);
    }
  };

  const getNarrationText = async (poi: PoiMapItem, targetLanguage: string): Promise<string> => {
    const lang = targetLanguage.toLowerCase();
    const cacheKey = `${poi.id}:${lang}`;
    if (narrationCacheRef.current[cacheKey]) return narrationCacheRef.current[cacheKey];

    const viFallback = (poi.viNarration?.trim() || poi.description?.trim() || `Bạn đang đến gần ${poi.name}`).trim();
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
        const res = await fetchWithTimeout(`/api/customer/pois/${poi.id}`, { method: "GET" }, NETWORK_TIMEOUT_MS);
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
      detail?.translations?.find((item) => item.language.toLowerCase() === lang)?.audioScript?.trim() ||
      detail?.translations?.find((item) => item.language.toLowerCase() === lang)?.description?.trim() ||
      "";

    if (translatedFromSource) {
      narrationCacheRef.current[cacheKey] = translatedFromSource;
      return translatedFromSource;
    }

    const viSource =
      detail?.translations?.find((item) => item.language.toLowerCase() === "vi")?.audioScript?.trim() ||
      detail?.translations?.find((item) => item.language.toLowerCase() === "vi")?.description?.trim() ||
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
        const translated = (await translate.json().catch(() => null)) as { translatedText?: string } | null;
        const text = translated?.translatedText?.trim() || viSource;
        narrationCacheRef.current[cacheKey] = text;
        return text;
      }
    } catch {
      // fallback to vi
    }

    return viSource;
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

    setPois((prev) => prev.map((poi) => toDistancePriority(poi, userLocation.lat, userLocation.lng)).sort(sortPoiByPriority));
  }, [userLocation]);

  useEffect(() => {
    if (!userLocation) return;

    const last = lastFetchRef.current;
    const now = Date.now();
    const movedMeters = last ? haversineMeters(last.lat, last.lng, userLocation.lat, userLocation.lng) : Number.POSITIVE_INFINITY;
    const shouldFetch = !last || last.q !== appliedQuery || movedMeters > 45 || now - last.at > 15_000;

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

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 18 }).setText(poi.name);
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
    if (typeof selectedPoi.latitude !== "number" || typeof selectedPoi.longitude !== "number") return;

    mapRef.current.flyTo({
      center: [selectedPoi.longitude, selectedPoi.latitude],
      zoom: 15.5,
      speed: 0.8,
      essential: true,
    });
  }, [selectedPoi]);

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
        const res = await fetchWithTimeout(`/api/customer/pois/${focusPoiId}`, { method: "GET" }, NETWORK_TIMEOUT_MS);
        if (!res.ok) return;

        const data = (await res.json().catch(() => null)) as
          | {
              poi?: {
                id: string;
                name: string;
                description?: string | null;
                latitude?: number | null;
                longitude?: number | null;
              };
            }
          | null;

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
          return merged.map((item) => toDistancePriority(item, userLocation.lat, userLocation.lng)).sort(sortPoiByPriority);
        });

        setSelectedPoiId(focusPoi.id);
        handledFocusPoiRef.current = focusPoiId;

        if (mapRef.current && typeof focusPoi.latitude === "number" && typeof focusPoi.longitude === "number") {
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
    if (!nearPromptPoi || !userLocation) return;
    if (typeof nearPromptPoi.latitude !== "number" || typeof nearPromptPoi.longitude !== "number") return;

    const distance = haversineMeters(userLocation.lat, userLocation.lng, nearPromptPoi.latitude, nearPromptPoi.longitude);
    if (distance > CLUSTER_EXIT_RADIUS_METERS) {
      setNearPromptPoi(null);
      setPromptClusterInfo(null);
    }
  }, [nearPromptPoi, userLocation]);

  useEffect(() => {
    if (!userLocation) return;

    const active = activeClusterRef.current;
    if (active) {
      const distanceFromActive = haversineMeters(
        userLocation.lat,
        userLocation.lng,
        active.centerLat,
        active.centerLng
      );
      if (distanceFromActive > CLUSTER_EXIT_RADIUS_METERS) {
        activeClusterRef.current = null;
      }
    }

    if (nearPromptPoi) return;

    const nearby = pois.filter((poi) => {
      if (typeof poi.latitude !== "number" || typeof poi.longitude !== "number") return false;
      const distance = poi.distanceMeters ?? haversineMeters(userLocation.lat, userLocation.lng, poi.latitude, poi.longitude);
      return distance <= ALERT_TRIGGER_RADIUS_METERS;
    });

    if (nearby.length === 0) return;

    const candidates = buildClusterCandidates(nearby, poiPromptedAtRef.current);
    if (candidates.length === 0) return;

    const now = Date.now();
    const selectedCandidate = candidates.find((candidate) => {
      const clusterCooldown = now - (clusterPromptedAtRef.current[candidate.clusterId] ?? 0);
      const poiCooldown = now - (poiPromptedAtRef.current[candidate.topPoi.id] ?? 0);
      if (clusterCooldown < CLUSTER_COOLDOWN_MS) return false;
      if (poiCooldown < POI_COOLDOWN_MS) return false;
      if (activeClusterRef.current?.id === candidate.clusterId) return false;
      return true;
    });

    if (!selectedCandidate) return;

    clusterPromptedAtRef.current[selectedCandidate.clusterId] = now;
    poiPromptedAtRef.current[selectedCandidate.topPoi.id] = now;
    activeClusterRef.current = {
      id: selectedCandidate.clusterId,
      centerLat: selectedCandidate.centerLat,
      centerLng: selectedCandidate.centerLng,
    };

    setNearPromptPoi(selectedCandidate.topPoi);
    setPromptClusterInfo({
      clusterId: selectedCandidate.clusterId,
      memberCount: selectedCandidate.memberCount,
    });

    if (!isSpeaking && queueRef.current.length === 0 && !pauseRef.current) {
      enqueueSpeechBySentence(
        `Bạn đang đến gần ${selectedCandidate.topPoi.name}. Bạn có muốn nghe thuyết minh không?`,
        speechLang("vi"),
        `cluster-alert-${selectedCandidate.clusterId}`,
        "Cảnh báo POI",
        selectedCandidate.topPoi.id
      );
    }
  }, [isSpeaking, nearPromptPoi, pois, userLocation]);

  const handleApplySearch = () => {
    setAppliedQuery(queryInput.trim());

    if (userLocation) {
      void loadNearbyPois(userLocation.lat, userLocation.lng, queryInput.trim());
    }
  };

  const handleListenNearbyPoi = async () => {
    if (!nearPromptPoi) return;

    const targetPoi = nearPromptPoi;
    const preferredLanguage = language.toLowerCase();
    const resolvedLanguage = !isOnline && preferredLanguage !== "vi" ? "vi" : preferredLanguage;

    if (!isOnline && preferredLanguage !== "vi") {
      setNetworkHint("Mạng đang yếu, tạm phát thuyết minh tiếng Việt đã lưu.");
    }

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
      <header className="sticky top-0 z-40 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Bản đồ POI</h1>
            <p className="text-xs text-slate-500">Vị trí người dùng: xanh, POI: đỏ</p>
          </div>
          <Link href="/customer" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            Về trang tìm
          </Link>
        </div>

        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplySearch();
              }}
              placeholder="Nhập từ khóa POI..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-[15px] outline-none focus:border-orange-500"
            />
          </div>
          <button
            type="button"
            onClick={handleApplySearch}
            className="min-h-11 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
          >
            Tìm
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {isOnline ? "Online" : "Offline"}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
            {isLoadingPois ? "Đang cập nhật POI..." : `${pois.length} POI`}
          </span>
          {isLocating ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Đang định vị...</span> : null}
        </div>
        {locationHint ? <p className="mt-1 text-xs text-amber-600">{locationHint}</p> : null}
        {networkHint ? <p className="mt-1 text-xs text-amber-600">{networkHint}</p> : null}
      </header>

      <main className="space-y-3 p-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div ref={mapContainerRef} className="h-[48vh] w-full sm:h-[52vh]" />
        </div>

        {nearPromptPoi ? (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-base font-semibold text-orange-900">Bạn đang đến gần {nearPromptPoi.name}</p>
            <p className="mt-1 text-sm text-orange-800">
              {promptClusterInfo && promptClusterInfo.memberCount > 1
                ? `Có ${promptClusterInfo.memberCount} POI trong cụm gần nhau, hệ thống ưu tiên ${nearPromptPoi.name}.`
                : "Hệ thống phát hiện bạn đang đến gần POI này."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleListenNearbyPoi();
                }}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
              >
                <Play className="h-3.5 w-3.5" /> Nghe thuyết minh
              </button>
              <button
                type="button"
                onClick={() => {
                  setNearPromptPoi(null);
                  setPromptClusterInfo(null);
                }}
                className="min-h-11 rounded-xl border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-800"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                onClick={() => router.push(`/customer/pois/${nearPromptPoi.id}`)}
                className="min-h-11 rounded-xl border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-800"
              >
                Xem chi tiết POI
              </button>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-semibold text-slate-600" htmlFor="speech-language">
              Ngôn ngữ thuyết minh
            </label>
            <select
              id="speech-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-2 text-sm"
            >
              {languageOptions.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={pauseAudioQueue}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
            <button
              type="button"
              onClick={resumeAudioQueue}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <Play className="h-3.5 w-3.5" /> Resume
            </button>
            <button
              type="button"
              onClick={stopAudioQueue}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <Square className="h-3.5 w-3.5" /> Stop
            </button>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {isSpeaking
              ? `Đang phát: ${currentAudioLabel ?? "thuyết minh"}`
              : isPaused
                ? "Đang tạm dừng sau câu hiện tại."
                : "Sẵn sàng phát thuyết minh."}
          </p>
          <p className="mt-1 text-sm text-slate-500">Hàng đợi audio: {queueCount} câu</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">POI gần bạn</h2>
            {selectedPoi ? <span className="text-xs text-slate-500">Đang chọn: {selectedPoi.name}</span> : null}
          </div>

          {nearbyList.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">Không có POI phù hợp trong phạm vi hiện tại.</p>
          ) : (
            <div className="flex snap-x gap-3 overflow-x-auto pb-1">
              {nearbyList.map((poi) => (
                <button
                  key={poi.id}
                  type="button"
                  onTouchStart={() => setSelectedPoiId(poi.id)}
                  onMouseEnter={() => setSelectedPoiId(poi.id)}
                  onClick={() => router.push(`/customer/pois/${poi.id}`)}
                  className={`min-w-[250px] snap-start rounded-xl border p-4 text-left transition active:scale-[0.99] ${
                    selectedPoiId === poi.id ? "border-orange-300 bg-orange-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{poi.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{poi.description ?? "-"}</p>
                  <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Navigation className="h-3.5 w-3.5" />
                      {poi.distanceMeters != null
                        ? poi.distanceMeters < 1000
                          ? `${Math.round(poi.distanceMeters)}m`
                          : `${(poi.distanceMeters / 1000).toFixed(1)}km`
                        : "-"}
                    </span>
                    {poi.rating != null ? <span>⭐ {poi.rating.toFixed(1)}</span> : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPoi ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{selectedPoi.name}</h3>
                <p className="text-xs text-slate-500">{selectedPoi.category ?? "POI"}</p>
              </div>
              <MapPin className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/customer/pois/${selectedPoi.id}`)}
                className="min-h-11 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Xem chi tiết POI
              </button>
              {typeof selectedPoi.latitude === "number" && typeof selectedPoi.longitude === "number" ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPoi.latitude},${selectedPoi.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <Navigation className="h-3.5 w-3.5" /> Chỉ đường
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
