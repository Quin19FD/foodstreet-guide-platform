"use client";

import Link from "next/link";
import {
  Search,
  MapPin,
  Navigation,
  Clock,
  Utensils,
  Coffee,
  IceCream,
  Beef,
  Star,
  Compass,
  Heart,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  SkeletonPOICard,
  SkeletonTourCard,
  EmptyState,
} from "@/components/ui/loading-skeleton";
import { useFavorites } from "@/components/contexts/favorites-context";

type SearchType = "poi" | "tour";

type PoiItem = {
  id: string;
  name: string;
  description?: string;
  type: "FOOD_STALL" | "SUPPORTING_FACILITY";
  imageUrl?: string | null;
  distanceMeters?: number | null;
  category?: string | null;
  rating?: number | null;
};

type TourItem = {
  id: string;
  name: string;
  description?: string | null;
  poiCount?: number;
  imageUrl?: string | null;
};

// Category filters for POIs
const categories = [
  { id: "all", label: "Tất cả", icon: Utensils },
  { id: "food", label: "Đồ ăn", icon: Beef },
  { id: "drink", label: "Đồ uống", icon: Coffee },
  { id: "snack", label: "Ăn vặt", icon: IceCream },
];

export default function CustomerHomePage() {
  const [searchType, setSearchType] = useState<SearchType>("poi");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [pois, setPois] = useState<PoiItem[]>([]);
  const [tours, setTours] = useState<TourItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Favorites hook
  const { isFavorited, toggleFavorite, isLoading: isTogglingFavorite } = useFavorites();

  // Set default location immediately, then try to get actual location
  useEffect(() => {
    // Set default location first so POIs load immediately
    setUserLocation({ lat: 10.7769, lng: 106.7009 });

    // Then try to get actual location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          // Error handler - keep default location, no action needed
        }
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        if (searchType === "poi") {
          const params = new URLSearchParams();
          params.set("mode", "summary");
          params.set("take", "36");
          if (searchQuery.trim()) params.set("q", searchQuery.trim());
          if (userLocation) {
            params.set("lat", String(userLocation.lat));
            params.set("lng", String(userLocation.lng));
          }
          const res = await fetch(`/api/customer/pois?${params.toString()}`, {
            signal: controller.signal,
          });
          const data = (await res.json().catch(() => null)) as {
            pois?: PoiItem[];
          } | null;
          if (controller.signal.aborted) return;
          setPois(data?.pois ?? []);
          setTours([]);
        } else {
          const params = new URLSearchParams();
          params.set("take", "24");
          if (searchQuery.trim()) params.set("q", searchQuery.trim());
          const res = await fetch(`/api/customer/tours?${params.toString()}`, {
            signal: controller.signal,
          });
          const data = (await res.json().catch(() => null)) as {
            tours?: TourItem[];
          } | null;
          if (controller.signal.aborted) return;
          setTours(data?.tours ?? []);
          setPois([]);
        }
      } catch {
        if (!controller.signal.aborted) {
          setPois([]);
          setTours([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsInitialLoad(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    searchType,
    searchQuery,
    userLocation, // Use entire object instead of conditional properties
  ]);

  const filteredPois = useMemo(() => {
    if (selectedCategory === "all") return pois;
    return pois.filter((poi) => {
      const categoryLower = poi.category?.toLowerCase() ?? "";
      if (selectedCategory === "food")
        return categoryLower.includes("food") ||
               categoryLower.includes("đồ ăn") ||
               categoryLower.includes("món");
      if (selectedCategory === "drink")
        return categoryLower.includes("drink") ||
               categoryLower.includes("đồ uống") ||
               categoryLower.includes("cafe") ||
               categoryLower.includes("nước");
      if (selectedCategory === "snack")
        return categoryLower.includes("snack") ||
               categoryLower.includes("ăn vặt") ||
               categoryLower.includes("bánh");
      return true;
    });
  }, [pois, selectedCategory]);

  const featuredPois = useMemo(() => {
    return pois
      .filter((poi) => poi.rating && poi.rating >= 4.5)
      .slice(0, 3);
  }, [pois]);

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Hero Header with Gradient */}
      <header className="gradient-animated px-4 pt-6 pb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="animate-fade-in-up">
            <h1 className="text-2xl font-bold tracking-tight">Khám phá</h1>
            <p className="text-sm text-white/80">Tìm POI hoặc TOUR gần bạn</p>
          </div>
          <Link
            href="/customer/map"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-105 active:scale-95"
          >
            <MapPin className="h-6 w-6" />
          </Link>
        </div>

        {/* Search Type Toggle */}
        <div className="mt-5 grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <button
            onClick={() => {
              setSearchType("poi");
              setSelectedCategory("all");
            }}
            className={`min-h-12 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              searchType === "poi"
                ? "bg-white text-orange-500 shadow-lg scale-105"
                : "bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
            }`}
          >
            Tìm POI
          </button>
          <button
            onClick={() => setSearchType("tour")}
            className={`min-h-12 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              searchType === "tour"
                ? "bg-white text-orange-500 shadow-lg scale-105"
                : "bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
            }`}
          >
            Tìm TOUR
          </button>
        </div>

        {/* Search Bar */}
        <div
          className="relative mt-4 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
          <input
            type="text"
            placeholder={
              searchType === "poi" ? "Tìm theo tên POI..." : "Tìm theo tên TOUR..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-2xl border-0 bg-white/95 pl-12 pr-4 text-[15px] shadow-lg outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-400/50"
          />
        </div>
      </header>

      <main className="px-4 py-5 space-y-6">
        {/* Category Filters - Only show for POI search */}
        {searchType === "poi" && (
          <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-horizontal">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? "bg-orange-500 text-white shadow-md scale-105"
                        : "bg-white text-slate-600 shadow-sm hover:bg-orange-50 hover:text-orange-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Featured Section - Only on initial load with POI results */}
        {isInitialLoad && searchType === "poi" && featuredPois.length > 0 && (
          <section className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                ⭐ Được đánh giá cao
              </h2>
              <Link
                href="/customer?featured=1"
                className="text-xs font-medium text-orange-500 hover:text-orange-600"
              >
                Xem tất cả
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-horizontal">
              {featuredPois.map((poi, index) => (
                <Link
                  key={poi.id}
                  href={`/customer/pois/${poi.id}`}
                  className="min-w-[200px] flex-1 animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <div className="card-featured overflow-hidden">
                    {poi.imageUrl ? (
                      <div className="relative aspect-video w-full">
                        <img
                          src={poi.imageUrl}
                          alt={poi.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="gradient-overlay absolute inset-0" />
                        {poi.rating && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-orange-600 backdrop-blur-sm">
                            <Star className="h-3 w-3 fill-orange-500" />
                            {poi.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    ) : null}
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {poi.name}
                      </h3>
                      {poi.distanceMeters != null ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                          <Navigation className="h-3 w-3" />
                          {poi.distanceMeters < 1000
                            ? `${Math.round(poi.distanceMeters)}m`
                            : `${(poi.distanceMeters / 1000).toFixed(1)}km`}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Results Section */}
        <section className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
          {/* Loading State */}
          {isLoading && isInitialLoad ? (
            searchType === "poi" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <SkeletonPOICard />
                <SkeletonPOICard />
                <SkeletonPOICard />
                <SkeletonPOICard />
              </div>
            ) : (
              <div className="space-y-3">
                <SkeletonTourCard />
                <SkeletonTourCard />
                <SkeletonTourCard />
              </div>
            )
          ) : searchType === "poi" ? (
            filteredPois.length === 0 ? (
              <EmptyState
                icon={Search}
                title={
                  searchQuery.trim()
                    ? "Không tìm thấy kết quả"
                    : "Chưa có POI nào"
                }
                description={
                  searchQuery.trim()
                    ? "Thử tìm kiếm với từ khóa khác"
                    : "Kéo xuống để tải danh sách POI"
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredPois.map((poi, index) => {
                  const favorited = isFavorited(poi.id);
                  return (
                    <div
                      key={poi.id}
                      className="animate-fade-in-up opacity-0"
                      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                    >
                      <Link
                        href={`/customer/pois/${poi.id}`}
                        className="block card-interactive group relative overflow-hidden rounded-2xl bg-white p-4"
                      >
                        {/* Image thumbnail */}
                        {poi.imageUrl && (
                          <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-3">
                            <img
                              src={poi.imageUrl}
                              alt={poi.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="gradient-overlay absolute inset-0" />
                            {poi.rating && (
                              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-orange-600 backdrop-blur-sm shadow-sm">
                                <Star className="h-3 w-3 fill-orange-500" />
                                {poi.rating.toFixed(1)}
                              </div>
                            )}
                            {/* Category badge */}
                            {poi.category && (
                              <span className="absolute bottom-2 left-2 badge-primary">
                                {poi.category}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Content */}
                        <h3 className="text-[15px] font-semibold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {poi.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {poi.description ?? "Không có mô tả"}
                        </p>

                        {/* Footer with favorite button */}
                        <div className="mt-3 flex items-center justify-between">
                          {poi.distanceMeters != null ? (
                            <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Navigation className="h-3.5 w-3.5 text-orange-500" />
                              {poi.distanceMeters < 1000
                                ? `${Math.round(poi.distanceMeters)}m`
                                : `${(poi.distanceMeters / 1000).toFixed(1)}km`}
                            </p>
                          ) : (
                            <span className="badge-secondary">{poi.type === "FOOD_STALL" ? "Gian hàng" : "Tiện ích"}</span>
                          )}
                          {/* Favorite button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(poi.id);
                            }}
                            disabled={isTogglingFavorite}
                            className={`
                              flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 active:scale-90
                              ${favorited
                                ? "bg-red-500 text-white"
                                : "bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500"}
                              ${isTogglingFavorite ? "opacity-60" : ""}
                            `}
                            aria-label={favorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                          >
                            <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
                          </button>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )
          ) : tours.length === 0 ? (
            <EmptyState
              icon={Compass}
              title={searchQuery.trim() ? "Không tìm thấy tour" : "Chưa có tour nào"}
              description={searchQuery.trim() ? "Thử tìm kiếm với từ khóa khác" : ""}
            />
          ) : (
            <div className="space-y-3">
              {tours.map((tour, index) => (
                <Link
                  key={tour.id}
                  href={`/customer/tours/${tour.id}`}
                  className="animate-fade-in-up opacity-0 block"
                  style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                >
                  <div className="card-interactive group">
                    {tour.imageUrl && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl">
                        <img
                          src={tour.imageUrl}
                          alt={tour.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="gradient-overlay absolute inset-0" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-[15px] font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {tour.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {tour.description ?? "Không có mô tả"}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <Clock className="h-3.5 w-3.5" />
                        {tour.poiCount ?? 0} điểm dừng
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick Stats - Bottom section */}
        {searchType === "poi" && !isLoading && pois.length > 0 && (
          <section className="animate-fade-in-up pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center rounded-2xl bg-white p-3 shadow-soft">
                <p className="text-xl font-bold text-orange-500">{pois.length}</p>
                <p className="text-[10px] text-slate-500">POI</p>
              </div>
              <div className="text-center rounded-2xl bg-white p-3 shadow-soft">
                <p className="text-xl font-bold text-emerald-500">
                  {pois.filter((p) => p.rating && p.rating >= 4).length}
                </p>
                <p className="text-[10px] text-slate-500">4+ sao</p>
              </div>
              <div className="text-center rounded-2xl bg-white p-3 shadow-soft">
                <p className="text-xl font-bold text-blue-500">
                  {pois.filter((p) => p.distanceMeters && p.distanceMeters < 500).length}
                </p>
                <p className="text-[10px] text-slate-500">Gần bạn</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
