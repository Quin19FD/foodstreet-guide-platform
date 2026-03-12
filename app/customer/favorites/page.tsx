"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MapPin,
  Star,
  Navigation,
  Trash2,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { mockPlatformService } from "@/application/services/mock-platform";

// Mock favorite data using actual POI IDs
const mockFavoritePOIIds = ["p1", "p4", "p7", "p10"];

function FavoritePOICard({
  poi,
  onRemove,
}: {
  poi: {
    id: string;
    name: string;
    description: string;
    type: "FOOD_STALL" | "SUPPORTING_FACILITY";
    imageUrl?: string;
  };
  onRemove: () => void;
}) {
  return (
    <Link
      href={`/customer/pois/${poi.id}`}
      className="block rounded-2xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3">
        {/* Image */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {poi.imageUrl ? (
            <img src={poi.imageUrl} alt={poi.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <MapPin className="h-8 w-8 text-slate-300" />
            </div>
          )}
          <div className="absolute left-1 top-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {poi.type === "FOOD_STALL" ? "Đồ ăn" : "Tiện ích"}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col">
          <h3 className="line-clamp-1 font-semibold text-slate-900">{poi.name}</h3>
          <p className="mt-1 line-clamp-2 flex-1 text-xs text-slate-500">
            {poi.description}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <Navigation className="h-3 w-3" />
              <span>Chỉ đường</span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                onRemove();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500"
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
  // Get favorite POIs from mock service
  const allPOIs = mockPlatformService.poi.listAll();
  const favoritePOIs = allPOIs.filter((poi) => mockFavoritePOIIds.includes(poi.id));

  const [favorites, setFavorites] = useState(
    favoritePOIs.map((poi) => ({
      id: `fav-${poi.id}`,
      poi,
      createdAt: new Date(),
    }))
  );

  const handleRemove = (id: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Yêu thích</h1>
            <p className="text-xs text-slate-500">
              {favorites.length} điểm đến đã lưu
            </p>
          </div>
          {favorites.length > 0 && (
            <button className="text-sm font-medium text-orange-600">
              Chỉnh sửa
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <Heart className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="mt-4 font-semibold text-slate-700">
              Chưa có điểm yêu thích
            </h2>
            <p className="mt-1 text-center text-sm text-slate-500">
              Lưu những điểm đến bạn thích để dễ dàng tìm lại sau này
            </p>
            <Link
              href="/customer"
              className="mt-4 rounded-xl bg-orange-500 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Khám phá ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <FavoritePOICard
                key={fav.id}
                poi={fav.poi}
                onRemove={() => handleRemove(fav.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
