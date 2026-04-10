import { readJsonFromStorage, writeJsonToStorage } from "./storage";
import type { CachedPoi } from "./types";

const POI_CACHE_KEY = "fs_offline_poi_cache_v1";
const MAX_POI_CACHE = 400;

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

function normalizePoi(input: Partial<CachedPoi>): CachedPoi | null {
  if (
    typeof input.id !== "string" ||
    typeof input.name !== "string" ||
    typeof input.latitude !== "number" ||
    typeof input.longitude !== "number"
  ) {
    return null;
  }

  const updatedAt = input.updatedAt ?? new Date().toISOString();
  const version =
    typeof input.version === "number" ? input.version : Math.max(1, Date.parse(updatedAt) || 1);

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
    cachedAt: input.cachedAt ?? new Date().toISOString(),
  };
}

function readAll(): CachedPoi[] {
  const raw = readJsonFromStorage<Partial<CachedPoi>[]>(POI_CACHE_KEY, []);
  return raw.map((item) => normalizePoi(item)).filter((item): item is CachedPoi => item !== null);
}

function writeAll(items: CachedPoi[]): void {
  writeJsonToStorage(POI_CACHE_KEY, items.slice(0, MAX_POI_CACHE));
}

export const poiCacheRepo = {
  upsertMany(items: Array<Partial<CachedPoi>>): void {
    if (items.length === 0) return;

    const existing = readAll();
    const byId = new Map<string, CachedPoi>(existing.map((item) => [item.id, item]));

    for (const raw of items) {
      const normalized = normalizePoi(raw);
      if (!normalized) continue;
      const prev = byId.get(normalized.id);
      if (!prev || normalized.version >= prev.version) {
        byId.set(normalized.id, normalized);
      }
    }

    const merged = [...byId.values()].sort((a, b) => {
      const updatedDelta = Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      if (updatedDelta !== 0) return updatedDelta;
      return Date.parse(b.cachedAt) - Date.parse(a.cachedAt);
    });

    writeAll(merged);
  },

  findNearby(input: { lat: number; lng: number; q?: string; take?: number }): CachedPoi[] {
    const query = input.q?.trim().toLowerCase() ?? "";
    const take = Math.max(1, Math.min(input.take ?? 80, 200));

    return readAll()
      .filter((poi) => {
        if (!query) return true;
        return (
          poi.name.toLowerCase().includes(query) ||
          (poi.description ?? "").toLowerCase().includes(query) ||
          (poi.category ?? "").toLowerCase().includes(query)
        );
      })
      .map((poi) => {
        const distance = haversineMeters(input.lat, input.lng, poi.latitude, poi.longitude);
        const basePriority = poi.priorityScore ?? distance;
        return {
          ...poi,
          priorityScore: distance * 0.7 + basePriority * 0.3,
          distanceMeters: distance,
        };
      })
      .sort((a, b) => {
        const scoreA = a.priorityScore ?? Number.POSITIVE_INFINITY;
        const scoreB = b.priorityScore ?? Number.POSITIVE_INFINITY;
        return scoreA - scoreB;
      })
      .slice(0, take);
  },
};
