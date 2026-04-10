"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { favoriteCacheRepo } from "@/lib/offline/favorite-cache-repo";
import { isOfflineModeEnabled } from "@/lib/offline/flags";
import { flushFavoriteSyncQueue } from "@/lib/offline/sync-engine";
import { syncQueueRepo } from "@/lib/offline/sync-queue-repo";
import type { FavoriteSyncStatus } from "@/lib/offline/types";

type FavoritesContextType = {
  isFavorited: (poiId: string) => boolean;
  toggleFavorite: (poiId: string) => Promise<boolean>;
  favorites: Set<string>;
  isLoading: boolean;
  isAuthenticated: boolean;
  syncStatus: FavoriteSyncStatus;
  pendingSyncCount: number;
  offlineModeEnabled: boolean;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);
const AUTH_SEEN_STORAGE_KEY = "fs_customer_auth_seen";
const FAVORITES_SYNC_POLL_INTERVAL_MS = 25_000;

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const offlineModeEnabled = useMemo(() => isOfflineModeEnabled(), []);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<FavoriteSyncStatus>("idle");
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const isFavorited = useCallback((poiId: string) => favorites.has(poiId), [favorites]);

  const refreshPendingSyncCount = useCallback(() => {
    setPendingSyncCount(syncQueueRepo.count("favorite"));
  }, []);

  const setAuthSeen = useCallback((seen: boolean) => {
    if (typeof window === "undefined") return;
    if (seen) {
      window.localStorage.setItem(AUTH_SEEN_STORAGE_KEY, "1");
      return;
    }
    window.localStorage.removeItem(AUTH_SEEN_STORAGE_KEY);
  }, []);

  const applyFavoriteLocalState = useCallback((poiId: string, nextFavorited: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (nextFavorited) next.add(poiId);
      else next.delete(poiId);
      favoriteCacheRepo.replace(next);
      return next;
    });
  }, []);

  const restoreFavoritesFromLocal = useCallback(() => {
    const cached = favoriteCacheRepo.getAll();
    setFavorites(new Set(cached));

    if (typeof window !== "undefined") {
      const authSeen = window.localStorage.getItem(AUTH_SEEN_STORAGE_KEY) === "1";
      if (authSeen) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const redirectToLogin = useCallback(() => {
    if (typeof window === "undefined") return;
    window.location.href = `/customer/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }, []);

  const flushQueuedFavorites = useCallback(async () => {
    if (!offlineModeEnabled) return;
    if (typeof window === "undefined" || !navigator.onLine) return;

    await flushFavoriteSyncQueue({
      onStatusChange: setSyncStatus,
      onAuthError: () => {
        setIsAuthenticated(false);
        setAuthSeen(false);
      },
    });
    refreshPendingSyncCount();
  }, [offlineModeEnabled, refreshPendingSyncCount, setAuthSeen]);

  const sendFavoriteMutation = useCallback(
    async (
      action: "ADD" | "REMOVE",
      poiId: string
    ): Promise<{ ok: boolean; authError: boolean }> => {
      try {
        const res = await fetch("/api/customer/favorites", {
          method: action === "ADD" ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ poiId }),
        });

        if (res.status === 401) return { ok: false, authError: true };
        if (res.ok) return { ok: true, authError: false };
        if (action === "REMOVE" && res.status === 404) return { ok: true, authError: false };
        return { ok: false, authError: false };
      } catch {
        return { ok: false, authError: false };
      }
    },
    []
  );

  // Load favorites on mount - only if user is authenticated
  const loadFavorites = useCallback(async () => {
    if (isInitialized) return;

    try {
      const res = await fetch("/api/customer/favorites");

      if (res.status === 401) {
        // Not authenticated - this is expected for guest users
        setIsAuthenticated(false);
        setAuthSeen(false);
        if (offlineModeEnabled && typeof window !== "undefined" && !navigator.onLine) {
          restoreFavoritesFromLocal();
        }
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const favoriteIds: Set<string> = new Set(data.favorites.map((f: { id: string }) => f.id));
        setFavorites(favoriteIds);
        favoriteCacheRepo.replace(favoriteIds);
        setIsAuthenticated(true);
        setAuthSeen(true);
      } else if (offlineModeEnabled) {
        restoreFavoritesFromLocal();
      }
    } catch (error) {
      if (offlineModeEnabled) {
        restoreFavoritesFromLocal();
      } else {
        console.error("Error loading favorites:", error);
      }
    } finally {
      setIsInitialized(true);
      refreshPendingSyncCount();
    }
  }, [
    isInitialized,
    offlineModeEnabled,
    refreshPendingSyncCount,
    restoreFavoritesFromLocal,
    setAuthSeen,
  ]);

  // Load favorites when provider mounts
  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    if (!offlineModeEnabled) return;

    const onOnline = () => {
      void flushQueuedFavorites();
    };

    void flushQueuedFavorites();
    window.addEventListener("online", onOnline);
    const timer = window.setInterval(() => {
      void flushQueuedFavorites();
    }, FAVORITES_SYNC_POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
    };
  }, [flushQueuedFavorites, offlineModeEnabled]);

  const toggleFavorite = useCallback(
    async (poiId: string): Promise<boolean> => {
      // Check authentication first
      if (!isAuthenticated && isInitialized) {
        // Redirect to login or show login modal
        redirectToLogin();
        return false;
      }

      setIsLoading(true);

      try {
        const isCurrentlyFavorited = favorites.has(poiId);
        const nextFavorited = !isCurrentlyFavorited;

        if (offlineModeEnabled) {
          applyFavoriteLocalState(poiId, nextFavorited);

          const action = nextFavorited ? "ADD" : "REMOVE";
          const enqueueForLater = () => {
            syncQueueRepo.enqueue("favorite", action, { poiId });
            refreshPendingSyncCount();
            setSyncStatus("failed");
          };

          if (typeof window !== "undefined" && !navigator.onLine) {
            enqueueForLater();
            return nextFavorited;
          }

          const mutation = await sendFavoriteMutation(action, poiId);
          if (mutation.authError) {
            applyFavoriteLocalState(poiId, isCurrentlyFavorited);
            setIsAuthenticated(false);
            setAuthSeen(false);
            redirectToLogin();
            return isCurrentlyFavorited;
          }

          if (!mutation.ok) {
            enqueueForLater();
            return nextFavorited;
          }

          setSyncStatus("idle");
          void flushQueuedFavorites();
          return nextFavorited;
        }

        if (isCurrentlyFavorited) {
          // Remove from favorites
          const res = await fetch("/api/customer/favorites", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ poiId }),
          });

          if (res.ok) {
            applyFavoriteLocalState(poiId, false);
            return false; // Removed
          }
          if (res.status === 401) {
            // Session expired - redirect to login
            setIsAuthenticated(false);
            setAuthSeen(false);
            redirectToLogin();
            return false;
          }
        } else {
          // Add to favorites
          const res = await fetch("/api/customer/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ poiId }),
          });

          if (res.ok) {
            applyFavoriteLocalState(poiId, true);
            return true; // Added
          }
          if (res.status === 401) {
            // Session expired - redirect to login
            setIsAuthenticated(false);
            setAuthSeen(false);
            redirectToLogin();
            return false;
          }
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
      } finally {
        setIsLoading(false);
      }

      return favorites.has(poiId);
    },
    [
      applyFavoriteLocalState,
      favorites,
      flushQueuedFavorites,
      isAuthenticated,
      isInitialized,
      offlineModeEnabled,
      redirectToLogin,
      refreshPendingSyncCount,
      sendFavoriteMutation,
      setAuthSeen,
    ]
  );

  return (
    <FavoritesContext.Provider
      value={{
        isFavorited,
        toggleFavorite,
        favorites,
        isLoading,
        isAuthenticated,
        syncStatus,
        pendingSyncCount,
        offlineModeEnabled,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
