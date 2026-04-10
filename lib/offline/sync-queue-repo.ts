import { readJsonFromStorage, writeJsonToStorage } from "./storage";
import type { SyncQueueAction, SyncQueueEntity, SyncQueueItem } from "./types";

const SYNC_QUEUE_KEY = "fs_offline_sync_queue_v1";
const MAX_SYNC_QUEUE = 500;

function safeItems(): SyncQueueItem[] {
  const raw = readJsonFromStorage<unknown>(SYNC_QUEUE_KEY, []);
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => item as Partial<SyncQueueItem>)
    .filter(
      (item): item is SyncQueueItem =>
        typeof item.id === "string" &&
        item.entity === "favorite" &&
        (item.action === "ADD" || item.action === "REMOVE") &&
        typeof item.updatedAt === "string" &&
        typeof item.retryCount === "number" &&
        typeof item.nextRetryAt === "number" &&
        typeof item.payload?.poiId === "string"
    );
}

function save(items: SyncQueueItem[]): void {
  writeJsonToStorage(SYNC_QUEUE_KEY, items.slice(0, MAX_SYNC_QUEUE));
}

function scopeKey(item: Pick<SyncQueueItem, "entity" | "payload">): string {
  return `${item.entity}:${item.payload.poiId}`;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getBackoffDelayMs(retryCount: number): number {
  const capped = Math.min(6, Math.max(0, retryCount));
  const base = 1_000 * 2 ** capped;
  const jitter = Math.floor(Math.random() * 350);
  return base + jitter;
}

export const syncQueueRepo = {
  enqueue(
    entity: SyncQueueEntity,
    action: SyncQueueAction,
    payload: { poiId: string }
  ): SyncQueueItem {
    const now = Date.now();
    const next: SyncQueueItem = {
      id: newId(),
      entity,
      action,
      payload,
      updatedAt: new Date(now).toISOString(),
      retryCount: 0,
      nextRetryAt: now,
    };

    const current = safeItems();
    const key = scopeKey(next);
    const compacted = current.filter((item) => scopeKey(item) !== key);
    const merged = [next, ...compacted].sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    );
    save(merged);
    return next;
  },

  listReady(entity?: SyncQueueEntity): SyncQueueItem[] {
    const now = Date.now();
    return safeItems()
      .filter((item) => (entity ? item.entity === entity : true))
      .filter((item) => item.nextRetryAt <= now)
      .sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
  },

  remove(id: string): void {
    save(safeItems().filter((item) => item.id !== id));
  },

  markRetry(id: string): void {
    const items = safeItems().map((item) => {
      if (item.id !== id) return item;
      const retryCount = item.retryCount + 1;
      return {
        ...item,
        retryCount,
        nextRetryAt: Date.now() + getBackoffDelayMs(retryCount),
      };
    });
    save(items);
  },

  count(entity?: SyncQueueEntity): number {
    return safeItems().filter((item) => (entity ? item.entity === entity : true)).length;
  },
};
