"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Filter,
  Navigation,
  Star,
  Heart,
  Clock,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { mockPlatformService } from "@/application/services/mock-platform";

// Types
interface POICardProps {
  poi: {
    id: string;
    name: string;
    description: string;
    type: "FOOD_STALL" | "SUPPORTING_FACILITY";
    imageUrl?: string;
  };
  distance?: number;
}

// POI Card Component
function POICard({ poi, distance }: POICardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <Link
      href={`/customer/pois/${poi.id}`}
      className="block rounded-2xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-slate-100">
        {poi.imageUrl ? (
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-12 w-12 text-slate-300" />
          </div>
        )}
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsFavorited(!isFavorited);
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isFavorited ? "fill-red-500 text-red-500" : "text-slate-400"
            )}
          />
        </button>
        {/* Type Badge */}
        <div className="absolute left-2 top-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">
          {poi.type === "FOOD_STALL" ? "Đồ ăn" : "Tiện ích"}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="line-clamp-1 font-semibold text-slate-900">
          {poi.name}
        </h3>
        <p className="line-clamp-2 text-xs text-slate-500">{poi.description}</p>
        {distance !== undefined && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Navigation className="h-3 w-3" />
            <span>{distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// Category Filter Button
function CategoryButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-orange-500 text-white"
          : "bg-white text-slate-600 hover:bg-slate-100"
      )}
    >
      {label}
    </button>
  );
}

export default function CustomerHomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const pois = mockPlatformService.poi.listAll();
  const districts = mockPlatformService.districts.list();

  // Get user location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default to Ho Chi Minh City center if permission denied
          setUserLocation({ lat: 10.7769, lng: 106.7009 });
        }
      );
    }
  }, []);

  // Filter POIs
  const filteredPOIs = pois.filter((poi) => {
    const matchesSearch =
      searchQuery === "" ||
      poi.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "food" && poi.type === "FOOD_STALL") ||
      (selectedCategory === "facility" && poi.type === "SUPPORTING_FACILITY");
    return matchesSearch && matchesCategory;
  });

  // Calculate distance (simplified)
  const poisWithDistance = filteredPOIs.map((poi) => {
    const distance =
      userLocation && poi.latitude && poi.longitude
        ? Math.sqrt(
            Math.pow((poi.latitude - userLocation.lat) * 111, 2) +
              Math.pow((poi.longitude - userLocation.lng) * 111, 2)
          ) * 1000
        : undefined;
    return { ...poi, distance };
  });

  // Sort by distance if available
  poisWithDistance.sort((a, b) => {
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Khám phá</h1>
            <p className="text-xs text-slate-500">
              {districts.length} khu phố • {pois.length} điểm đến
            </p>
          </div>
          <Link
            href="/customer/map"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg"
          >
            <MapPin className="h-5 w-5" />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm món ăn, quán ăn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Category Filter */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <CategoryButton
            label="Tất cả"
            isActive={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
          />
          <CategoryButton
            label="Đồ ăn"
            isActive={selectedCategory === "food"}
            onClick={() => setSelectedCategory("food")}
          />
          <CategoryButton
            label="Tiện ích"
            isActive={selectedCategory === "facility"}
            onClick={() => setSelectedCategory("facility")}
          />
        </div>
      </header>

      {/* POI Grid */}
      <main className="p-4">
        {poisWithDistance.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Search className="h-8 w-8 text-slate-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">
              Không tìm thấy kết quả
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Thử tìm kiếm với từ khóa khác
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {poisWithDistance.map((poi) => (
              <POICard key={poi.id} poi={poi} distance={poi.distance} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
