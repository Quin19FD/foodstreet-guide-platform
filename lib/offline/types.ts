export type OfflineLayerStatus = "online" | "offline" | "syncing" | "failed";

export type CachedPoi = {
  id: string;
  name: string;
  description?: string;
  viNarration?: string;
  availableLanguages?: string[];
  languagesWithAudio?: string[];
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  category?: string | null;
  rating?: number | null;
  priorityScore?: number | null;
  updatedAt: string;
  version: number;
  cachedAt: string;
};

export type PoiDetailCache = {
  poiId: string;
  updatedAt: string;
  version: number;
  narrationsByLang: Record<string, string>;
  audioUrlsByLang: Record<string, string[]>;
};

export type SyncQueueEntity = "favorite";
export type SyncQueueAction = "ADD" | "REMOVE";

export type SyncQueueItem = {
  id: string;
  entity: SyncQueueEntity;
  action: SyncQueueAction;
  payload: {
    poiId: string;
  };
  updatedAt: string;
  retryCount: number;
  nextRetryAt: number;
};

export type FavoriteSyncStatus = "idle" | "syncing" | "failed";
