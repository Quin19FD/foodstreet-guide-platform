import { preloadAudioUrls } from "./audio-cache";
import { poiCacheRepo } from "./poi-cache-repo";
import { poiDetailCacheRepo } from "./poi-detail-cache-repo";
import type { CachedPoi, OfflineLayerStatus } from "./types";

export type PoiMapResponseItem = {
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
  updatedAt?: string;
  version?: number;
};

type PoiDetailNarrationResponse = {
  updatedAt?: string | null;
  version?: number | null;
  description?: string | null;
  translations?: Array<{
    language?: string | null;
    description?: string | null;
    audioScript?: string | null;
    audios?: Array<{ audioUrl?: string | null }>;
  }>;
};

type NearbyRequest = {
  lat: number;
  lng: number;
  q?: string;
  take?: number;
  timeoutMs?: number;
};

type NearbyResult = {
  pois: PoiMapResponseItem[];
  source: "network" | "cache";
  status: OfflineLayerStatus;
};

type NarrationRequest = {
  poiId: string;
  targetLanguage: string;
  viFallback: string;
  canUseNetwork: boolean;
  timeoutMs?: number;
};

function toCachedPoi(input: PoiMapResponseItem): CachedPoi | null {
  if (typeof input.latitude !== "number" || typeof input.longitude !== "number") return null;
  const updatedAt = input.updatedAt ?? new Date().toISOString();
  const version = input.version ?? Math.max(1, Date.parse(updatedAt) || 1);

  return {
    id: input.id,
    name: input.name,
    description: input.description,
    viNarration: input.viNarration,
    availableLanguages: input.availableLanguages ?? [],
    languagesWithAudio: input.languagesWithAudio ?? [],
    latitude: input.latitude,
    longitude: input.longitude,
    imageUrl: input.imageUrl ?? null,
    category: input.category ?? null,
    rating: input.rating ?? null,
    priorityScore: input.priorityScore ?? null,
    updatedAt,
    version,
    cachedAt: new Date().toISOString(),
  };
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class PoiDataProvider {
  constructor(private readonly offlineEnabled: boolean) {}

  async getNearbyPois(request: NearbyRequest): Promise<NearbyResult> {
    const take = request.take ?? 80;
    const timeoutMs = request.timeoutMs ?? 5000;
    const params = new URLSearchParams({
      lat: String(request.lat),
      lng: String(request.lng),
      mode: "map",
      take: String(take),
    });

    if (request.q?.trim()) params.set("q", request.q.trim());

    try {
      const response = await fetchWithTimeout(
        `/api/customer/pois?${params.toString()}`,
        { method: "GET" },
        timeoutMs
      );
      if (!response.ok) throw new Error(`network_${response.status}`);

      const payload = (await response.json().catch(() => null)) as {
        pois?: PoiMapResponseItem[];
      } | null;
      const pois = payload?.pois ?? [];

      if (this.offlineEnabled) {
        poiCacheRepo.upsertMany(
          pois.map((item) => toCachedPoi(item)).filter((item): item is CachedPoi => item !== null)
        );
      }

      return {
        pois,
        source: "network",
        status: "online",
      };
    } catch (error) {
      if (!this.offlineEnabled) throw error;

      const cached = poiCacheRepo.findNearby({
        lat: request.lat,
        lng: request.lng,
        q: request.q,
        take,
      });

      if (cached.length === 0) {
        return { pois: [], source: "cache", status: "failed" };
      }

      return {
        pois: cached.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          viNarration: item.viNarration,
          availableLanguages: item.availableLanguages,
          languagesWithAudio: item.languagesWithAudio,
          latitude: item.latitude,
          longitude: item.longitude,
          imageUrl: item.imageUrl,
          category: item.category,
          rating: item.rating,
          priorityScore: item.priorityScore,
          updatedAt: item.updatedAt,
          version: item.version,
        })),
        source: "cache",
        status: "offline",
      };
    }
  }

  async getNarrationText(request: NarrationRequest): Promise<string> {
    const lang = request.targetLanguage.toLowerCase();
    const cachedNarration = poiDetailCacheRepo.getNarration(request.poiId, lang);
    if (cachedNarration?.trim()) return cachedNarration.trim();

    if (lang === "vi") return request.viFallback;
    if (!this.offlineEnabled && !request.canUseNetwork) return request.viFallback;
    if (!request.canUseNetwork) return request.viFallback;

    try {
      const response = await fetchWithTimeout(
        `/api/customer/pois/${request.poiId}`,
        { method: "GET" },
        request.timeoutMs ?? 5000
      );
      if (!response.ok) throw new Error(`detail_${response.status}`);

      const payload = (await response.json().catch(() => null)) as {
        poi?: PoiDetailNarrationResponse;
      } | null;
      if (!payload?.poi) return request.viFallback;

      poiDetailCacheRepo.upsertFromDetail(request.poiId, payload.poi);
      const narration = poiDetailCacheRepo.getNarration(request.poiId, lang);

      // Warm 1-2 audio URLs so browser HTTP cache can help when network is unstable.
      const preferredAudio = poiDetailCacheRepo.getPreferredAudioUrl(request.poiId, lang);
      if (preferredAudio) {
        void preloadAudioUrls([preferredAudio]);
      }

      return narration?.trim() || request.viFallback;
    } catch {
      return request.viFallback;
    }
  }

  async getPreferredAudioUrl(input: {
    poiId: string;
    language: string;
    canUseNetwork: boolean;
    timeoutMs?: number;
  }): Promise<string | null> {
    const lang = input.language.toLowerCase();
    const cached = poiDetailCacheRepo.getPreferredAudioUrl(input.poiId, lang);
    if (cached) return cached;
    if (!input.canUseNetwork) return null;

    try {
      const response = await fetchWithTimeout(
        `/api/customer/pois/${input.poiId}`,
        { method: "GET" },
        input.timeoutMs ?? 5000
      );
      if (!response.ok) return null;

      const payload = (await response.json().catch(() => null)) as {
        poi?: PoiDetailNarrationResponse;
      } | null;
      if (!payload?.poi) return null;

      poiDetailCacheRepo.upsertFromDetail(input.poiId, payload.poi);
      return poiDetailCacheRepo.getPreferredAudioUrl(input.poiId, lang);
    } catch {
      return null;
    }
  }
}
