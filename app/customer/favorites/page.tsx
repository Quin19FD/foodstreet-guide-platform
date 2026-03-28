"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Heart, MapPin, Navigation, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/shared/utils";

type PoiItem = {
  id: string;
  name: string;
  description: string;
  type: "FOOD_STALL" | "SUPPORTING_FACILITY";
  category?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  favoritedAt: Date;
};

function FavoritePOICard({
  poi,
  onRemove,
}: {
  poi: PoiItem;
  onRemove: () => void;
}) {
  return (
    <Link
      href={`/customer/pois/${poi.id}`}
      className="block card-interactive group"
    >
      <div className="flex gap-3">
        {/* Image */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {poi.imageUrl ? (
            <img
              src={poi.imageUrl}
              alt={poi.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <MapPin className="h-8 w-8 text-slate-300" />
            </div>
          )}
          <div className="absolute left-1 top-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            {poi.type === "FOOD_STALL" ? "Đồ ăn" : "Tiện ích"}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col">
          <h3 className="line-clamp-1 font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
            {poi.name}
          </h3>
          <p className="mt-1 line-clamp-2 flex-1 text-xs text-slate-500">
            {poi.description}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-medium text-orange-600">
              <Navigation className="h-3 w-3" />
              <span>Chỉ đường</span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                onRemove();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              aria-label="Xóa khỏi yêu thích"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CustomerFavoritesPage() {
  const [favorites, setFavorites] = useState<PoiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch favorites from API
  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/customer/favorites");
      const data = (await res.json()) as {
        favorites?: PoiItem[];
        total?: number;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "Không thể tải danh sách yêu thích");
      }

      setFavorites(data.favorites ?? []);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError(err instanceof Error ? err.message : "Lỗi khi tải danh sách");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Handle remove favorite
  const handleRemove = async (poiId: string) => {
    setIsRemoving(poiId);

    try {
      const res = await fetch("/api/customer/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poiId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể xóa khỏi yêu thích");
      }

      // Optimistically remove from list
      setFavorites((prev) => prev.filter((poi) => poi.id !== poiId));
    } catch (err) {
      console.error("Error removing favorite:", err);
      // Re-fetch on error
      fetchFavorites();
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Yêu thích</h1>
            <p className="text-xs text-slate-500">
              {isLoading ? "Đang tải..." : `${favorites.length} điểm đến đã lưu`}
            </p>
          </div>
          {favorites.length > 0 && !isLoading && (
            <button className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
              Chỉnh sửa
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {isLoading ? (
          // Loading state
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-slate-200"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <Heart className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="mt-4 font-semibold text-slate-700">Có lỗi xảy ra</h2>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              onClick={fetchFavorites}
              className="mt-4 rounded-xl bg-orange-500 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Thử lại
            </button>
          </div>
        ) : favorites.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center py-16 animate-fade-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <Heart className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="mt-4 font-semibold text-slate-700">Chưa có điểm yêu thích</h2>
            <p className="mt-1 text-center text-sm text-slate-500">
              Lưu những điểm đến bạn thích để dễ dàng tìm lại sau này
            </p>
            <Link
              href="/customer"
              className="mt-4 rounded-xl bg-orange-500 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600 shadow-md"
            >
              Khám phá ngay
            </Link>
          </div>
        ) : (
          // Favorites list
          <div className="space-y-3">
            {favorites.map((poi) => (
              <FavoritePOICard
                key={poi.id}
                poi={poi}
                onRemove={() => handleRemove(poi.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
