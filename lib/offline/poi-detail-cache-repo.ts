import { readJsonFromStorage, writeJsonToStorage } from "./storage";
import type { PoiDetailCache } from "./types";

const POI_DETAIL_CACHE_KEY = "fs_offline_poi_detail_cache_v1";
const MAX_POI_DETAIL_CACHE = 240;

type DetailPayload = {
  updatedAt?: string | null;
  version?: number | null;
  translations?: Array<{
    language?: string | null;
    description?: string | null;
    audioScript?: string | null;
    audios?: Array<{ audioUrl?: string | null }>;
  }>;
  description?: string | null;
};

function normalize(items: unknown): PoiDetailCache[] {
  if (!Array.isArray(items)) return [];
  const result: PoiDetailCache[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const value = item as PoiDetailCache;
    if (typeof value.poiId !== "string") continue;
    if (typeof value.updatedAt !== "string") continue;
    if (typeof value.version !== "number") continue;
    if (!value.narrationsByLang || typeof value.narrationsByLang !== "object") continue;
    if (!value.audioUrlsByLang || typeof value.audioUrlsByLang !== "object") continue;
    result.push(value);
  }

  return result;
}

function readAll(): PoiDetailCache[] {
  return normalize(readJsonFromStorage<unknown>(POI_DETAIL_CACHE_KEY, []));
}

function writeAll(items: PoiDetailCache[]): void {
  writeJsonToStorage(POI_DETAIL_CACHE_KEY, items.slice(0, MAX_POI_DETAIL_CACHE));
}

export const poiDetailCacheRepo = {
  upsertFromDetail(poiId: string, payload: DetailPayload): void {
    const nowIso = new Date().toISOString();
    const updatedAt = payload.updatedAt ?? nowIso;
    const version =
      typeof payload.version === "number"
        ? payload.version
        : Math.max(1, Date.parse(updatedAt) || 1);
    const narrationsByLang: Record<string, string> = {};
    const audioUrlsByLang: Record<string, string[]> = {};

    for (const item of payload.translations ?? []) {
      const lang = (item.language ?? "").trim().toLowerCase();
      if (!lang) continue;

      const narration = item.audioScript?.trim() || item.description?.trim() || "";
      if (narration) narrationsByLang[lang] = narration;

      const urls = (item.audios ?? [])
        .map((audio) => audio.audioUrl?.trim() ?? "")
        .filter((url): url is string => Boolean(url));
      if (urls.length > 0) audioUrlsByLang[lang] = urls;
    }

    if (!narrationsByLang.vi && payload.description?.trim()) {
      narrationsByLang.vi = payload.description.trim();
    }

    const existing = readAll();
    const byId = new Map(existing.map((item) => [item.poiId, item]));
    const previous = byId.get(poiId);

    if (previous && previous.version > version) return;

    byId.set(poiId, {
      poiId,
      updatedAt,
      version,
      narrationsByLang: { ...previous?.narrationsByLang, ...narrationsByLang },
      audioUrlsByLang: { ...previous?.audioUrlsByLang, ...audioUrlsByLang },
    });

    writeAll([...byId.values()].sort((a, b) => b.version - a.version));
  },

  getNarration(poiId: string, language: string): string | null {
    const lang = language.toLowerCase();
    const detail = readAll().find((item) => item.poiId === poiId);
    if (!detail) return null;
    return detail.narrationsByLang[lang] ?? detail.narrationsByLang.vi ?? null;
  },

  getPreferredAudioUrl(poiId: string, language: string): string | null {
    const lang = language.toLowerCase();
    const detail = readAll().find((item) => item.poiId === poiId);
    if (!detail) return null;

    const preferred = detail.audioUrlsByLang[lang]?.[0];
    if (preferred) return preferred;

    return detail.audioUrlsByLang.vi?.[0] ?? null;
  },
};
