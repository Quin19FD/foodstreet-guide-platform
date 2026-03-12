"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Navigation,
  Filter,
  X,
  Info,
  Layers,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { mockPlatformService } from "@/application/services/mock-platform";

// Placeholder map component - replace with actual Mapbox implementation
function SimpleMap({
  pois,
  selectedPOI,
  onPOIClick,
  userLocation,
}: {
  pois: Array<{ id: string; name: string; latitude: number; longitude: number; type: "FOOD_STALL" | "SUPPORTING_FACILITY" }>;
  selectedPOI: string | null;
  onPOIClick: (id: string) => void;
  userLocation: { lat: number; lng: number } | null;
}) {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-green-100 via-green-50 to-amber-50">
      {/* Grid pattern background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, #166534 1px, transparent 1px), linear-gradient(to bottom, #166534 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* User location marker */}
      {userLocation && (
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute -inset-4 animate-ping rounded-full bg-blue-500/30" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-blue-500 shadow-lg">
              <div className="h-3 w-3 rounded-full bg-white" />
            </div>
          </div>
        </div>
      )}

      {/* POI Markers */}
      {pois.map((poi) => {
        // Calculate relative position from user location (center)
        const latDiff = (poi.latitude - (userLocation?.lat || 10.7769)) * 50000;
        const lngDiff = (poi.longitude - (userLocation?.lng || 106.7009)) * 50000;

        const isFood = poi.type === "FOOD_STALL";
        const isSelected = selectedPOI === poi.id;

        return (
          <button
            key={poi.id}
            onClick={() => onPOIClick(poi.id)}
            className="absolute transition-transform hover:scale-110 active:scale-95"
            style={{
              left: `calc(50% + ${lngDiff}px)`,
              top: `calc(50% - ${latDiff}px)`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all",
                isSelected
                  ? "scale-125 ring-4 ring-orange-300"
                  : "ring-2 ring-white",
                isFood ? "bg-orange-500" : "bg-slate-500"
              )}
            >
              <MapPin className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            {isSelected && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full">
                <div className="whitespace-nowrap rounded-lg bg-white px-2 py-1 text-xs font-semibold shadow-lg">
                  {poi.name}
                </div>
              </div>
            )}
          </button>
        );
      })}

      {/* Zoom controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg text-slate-600">
          <span className="text-lg font-bold">+</span>
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg text-slate-600">
          <span className="text-lg font-bold">−</span>
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg text-slate-600">
          <Layers className="h-5 w-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute left-3 bottom-3 rounded-lg bg-white/90 backdrop-blur px-3 py-2 text-xs shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-orange-500">
            <MapPin className="h-2 w-2 text-white" />
          </div>
          <span>Đồ ăn</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-slate-500">
            <MapPin className="h-2 w-2 text-white" />
          </div>
          <span>Tiện ích</span>
        </div>
      </div>
    </div>
  );
}

// POI Bottom Sheet
function POIBottomSheet({
  poi,
  onClose,
}: {
  poi: {
    id: string;
    name: string;
    description: string;
    type: "FOOD_STALL" | "SUPPORTING_FACILITY";
    imageUrl?: string;
  } | null;
  onClose: () => void;
}) {
  if (!poi) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-3xl bg-white p-4 shadow-2xl md:bottom-0">
      {/* Handle */}
      <button
        onClick={onClose}
        className="mx-auto mb-3 flex h-1 w-12 rounded-full bg-slate-200"
      />

      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {poi.imageUrl ? (
            <img src={poi.imageUrl} alt={poi.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <MapPin className="h-8 w-8 text-slate-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{poi.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{poi.description}</p>
          <div className="mt-2 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
            {poi.type === "FOOD_STALL" ? "Đồ ăn" : "Tiện ích"}
          </div>
        </div>
      </div>

      {/* View Detail Button */}
      <Link
        href={`/customer/pois/${poi.id}`}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
      >
        <Info className="h-4 w-4" />
        Xem chi tiết
      </Link>
    </div>
  );
}

export default function CustomerMapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPOI, setSelectedPOI] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const pois = mockPlatformService.poi.listAll();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
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

  const selectedPOIData = selectedPOI
    ? (pois.find((p) => p.id === selectedPOI) ?? null)
    : null;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="relative z-30 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
              showFilters ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Pills */}
        {showFilters && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                selectedCategory === "all"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSelectedCategory("food")}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                selectedCategory === "food"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              Đồ ăn
            </button>
            <button
              onClick={() => setSelectedCategory("facility")}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                selectedCategory === "facility"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              Tiện ích
            </button>
          </div>
        )}
      </header>

      {/* Map */}
      <div className="flex-1">
        <SimpleMap
          pois={filteredPOIs}
          selectedPOI={selectedPOI}
          onPOIClick={setSelectedPOI}
          userLocation={userLocation}
        />
      </div>

      {/* POI Bottom Sheet */}
      <POIBottomSheet
        poi={selectedPOIData}
        onClose={() => setSelectedPOI(null)}
      />
    </div>
  );
}
