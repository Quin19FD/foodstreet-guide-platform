import { syncQueueRepo } from "./sync-queue-repo";
import type { FavoriteSyncStatus } from "./types";

type FlushOptions = {
  onStatusChange?: (status: FavoriteSyncStatus) => void;
  onAuthError?: () => void;
};

function updateStatus(cb: FlushOptions["onStatusChange"], value: FavoriteSyncStatus): void {
  cb?.(value);
}

export async function flushFavoriteSyncQueue(options: FlushOptions = {}): Promise<boolean> {
  if (typeof window === "undefined") return true;
  if (!navigator.onLine) return false;

  const ready = syncQueueRepo.listReady("favorite");
  if (ready.length === 0) {
    updateStatus(options.onStatusChange, "idle");
    return true;
  }

  updateStatus(options.onStatusChange, "syncing");
  let hasFailure = false;

  for (const item of ready) {
    try {
      const response = await fetch("/api/customer/favorites", {
        method: item.action === "ADD" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poiId: item.payload.poiId }),
      });

      if (response.status === 401) {
        options.onAuthError?.();
        hasFailure = true;
        break;
      }

      // DELETE 404 is idempotent success for queue compaction case.
      if (response.ok || (item.action === "REMOVE" && response.status === 404)) {
        syncQueueRepo.remove(item.id);
        continue;
      }

      throw new Error(`sync_failed_${response.status}`);
    } catch {
      hasFailure = true;
      syncQueueRepo.markRetry(item.id);
    }
  }

  updateStatus(options.onStatusChange, hasFailure ? "failed" : "idle");
  return !hasFailure;
}
