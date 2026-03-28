"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

type FavoritesContextType = {
  isFavorited: (poiId: string) => boolean;
  toggleFavorite: (poiId: string) => Promise<boolean>;
  favorites: Set<string>;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isFavorited = useCallback(
    (poiId: string) => favorites.has(poiId),
    [favorites]
  );

  // Load favorites on mount - only if user is authenticated
  const loadFavorites = useCallback(async () => {
    if (isInitialized) return;

    try {
      const res = await fetch("/api/customer/favorites");
      
      if (res.status === 401) {
        // Not authenticated - this is expected for guest users
        setIsAuthenticated(false);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const favoriteIds: Set<string> = new Set(data.favorites.map((f: { id: string }) => f.id));
        setFavorites(favoriteIds);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Load favorites when provider mounts
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(
    async (poiId: string): Promise<boolean> => {
      // Check authentication first
      if (!isAuthenticated && isInitialized) {
        // Redirect to login or show login modal
        window.location.href = "/customer/login?redirect=" + encodeURIComponent(window.location.pathname);
        return false;
      }

      setIsLoading(true);

      try {
        const isCurrentlyFavorited = favorites.has(poiId);

        if (isCurrentlyFavorited) {
          // Remove from favorites
          const res = await fetch("/api/customer/favorites", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ poiId }),
          });

          if (res.ok) {
            setFavorites((prev) => {
              const next = new Set(prev);
              next.delete(poiId);
              return next;
            });
            return false; // Removed
          } else if (res.status === 401) {
            // Session expired - redirect to login
            window.location.href = "/customer/login?redirect=" + encodeURIComponent(window.location.pathname);
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
            setFavorites((prev) => {
              const next = new Set(prev);
              next.add(poiId);
              return next;
            });
            return true; // Added
          } else if (res.status === 401) {
            // Session expired - redirect to login
            window.location.href = "/customer/login?redirect=" + encodeURIComponent(window.location.pathname);
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
    [favorites, isAuthenticated, isInitialized]
  );

  return (
    <FavoritesContext.Provider value={{ isFavorited, toggleFavorite, favorites, isLoading, isAuthenticated }}>
      {children}
    </FavoritesContext.Provider>
  );
}
