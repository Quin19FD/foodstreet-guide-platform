import { readJsonFromStorage, writeJsonToStorage } from "./storage";

const AUDIO_CACHE_KEY = "fs_offline_audio_urls_v1";
const MAX_AUDIO_CACHE = 500;

function readCachedUrls(): string[] {
  const raw = readJsonFromStorage<unknown>(AUDIO_CACHE_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

function writeCachedUrls(urls: string[]): void {
  writeJsonToStorage(AUDIO_CACHE_KEY, urls.slice(0, MAX_AUDIO_CACHE));
}

export function markAudioUrlsCached(urls: string[]): void {
  if (urls.length === 0) return;
  const merged = new Set(readCachedUrls());
  for (const item of urls) merged.add(item);
  writeCachedUrls([...merged]);
}

export function isAudioUrlMarkedCached(url: string): boolean {
  return readCachedUrls().includes(url);
}

export async function preloadAudioUrls(urls: string[]): Promise<void> {
  if (typeof window === "undefined") return;
  if (urls.length === 0) return;

  const unique = Array.from(new Set(urls)).slice(0, 8);
  await Promise.allSettled(
    unique.map(async (url) => {
      try {
        const response = await fetch(url, { method: "GET", cache: "force-cache" });
        if (response.ok) {
          markAudioUrlsCached([url]);
        }
      } catch {
        // keep silent to avoid breaking online flow
      }
    })
  );
}
