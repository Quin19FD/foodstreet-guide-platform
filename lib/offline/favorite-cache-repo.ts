import { readJsonFromStorage, writeJsonToStorage } from "./storage";

const FAVORITES_CACHE_KEY = "fs_offline_favorites_v1";

function readAll(): string[] {
  const raw = readJsonFromStorage<unknown>(FAVORITES_CACHE_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

function writeAll(items: string[]): void {
  writeJsonToStorage(FAVORITES_CACHE_KEY, Array.from(new Set(items)));
}

export const favoriteCacheRepo = {
  getAll(): string[] {
    return readAll();
  },

  replace(items: Iterable<string>): void {
    writeAll(Array.from(items));
  },

  add(poiId: string): void {
    const set = new Set(readAll());
    set.add(poiId);
    writeAll([...set]);
  },

  remove(poiId: string): void {
    const set = new Set(readAll());
    set.delete(poiId);
    writeAll([...set]);
  },
};
