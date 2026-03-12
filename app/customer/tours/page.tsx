"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  MapPin,
  Star,
  ArrowRight,
  Filter,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { mockPlatformService } from "@/application/services/mock-platform";

// Tour Card Component
function TourCard({
  tour,
  pois,
}: {
  tour: {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    poiIds: string[];
  };
  pois: Array<{ id: string; name: string; imageUrl?: string }>;
}) {
  const tourPOIs = pois.filter((poi) => tour.poiIds.includes(poi.id));
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <Link
      href={`/customer/tours/${tour.id}`}
      className="block rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Header Image */}
      <div className="relative mb-3 aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-orange-100 to-amber-100">
        {tourPOIs.length > 0 && tourPOIs[0].imageUrl ? (
          <img
            src={tourPOIs[0].imageUrl}
            alt={tour.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-12 w-12 text-orange-300" />
          </div>
        )}
        {/* Duration Badge */}
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold backdrop-blur">
          <Clock className="inline h-3 w-3" />
          {tour.durationMinutes} phút
        </div>
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsFavorited(!isFavorited);
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur"
        >
          <Star
            className={cn(
              "h-4 w-4 transition-colors",
              isFavorited ? "fill-amber-400 text-amber-400" : "text-slate-400"
            )}
          />
        </button>
      </div>

      {/* Content */}
      <div>
        <h3 className="font-semibold text-slate-900">{tour.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{tour.description}</p>

        {/* POI Preview */}
        <div className="mt-3 flex items-center gap-2 overflow-hidden">
          <div className="flex -space-x-2">
            {tourPOIs.slice(0, 3).map((poi, index) => (
              <div
                key={poi.id}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white",
                  index === 0 && "bg-orange-500",
                  index === 1 && "bg-amber-500",
                  index === 2 && "bg-yellow-500"
                )}
              >
                {poi.name.charAt(0)}
              </div>
            ))}
          </div>
          <span className="text-xs text-slate-500">
            {tourPOIs.length} điểm đến
          </span>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" />
            <span>Khu phố ẩm thực</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
            <span>Khám phá</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

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

export default function CustomerToursPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const tours = mockPlatformService.tour.list();
  const pois = mockPlatformService.poi.listAll();

  // Filter tours
  const filteredTours = tours.filter((tour) => {
    const matchesSearch =
      searchQuery === "" ||
      tour.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Food Tours</h1>
        <p className="text-xs text-slate-500">
          {filteredTours.length} tour có sẵn
        </p>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tour..."
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
            label="Phổ biến"
            isActive={selectedCategory === "popular"}
            onClick={() => setSelectedCategory("popular")}
          />
          <CategoryButton
            label="Ngắn"
            isActive={selectedCategory === "short"}
            onClick={() => setSelectedCategory("short")}
          />
          <CategoryButton
            label="Dài"
            isActive={selectedCategory === "long"}
            onClick={() => setSelectedCategory("long")}
          />
        </div>
      </header>

      {/* Tours List */}
      <main className="p-4">
        {filteredTours.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Search className="h-8 w-8 text-slate-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">
              Không tìm thấy tour nào
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} pois={pois} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
