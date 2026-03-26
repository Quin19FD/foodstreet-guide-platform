"use client";

import { useState } from "react";
import { mockPlatformService } from "@/application/services/mock-platform";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { MapboxMap } from "@/components/ui/mapbox-map";

export default function AdminPOIsPage() {
  const pois = mockPlatformService.poi.listAll();
  const [selectedPOI, setSelectedPOI] = useState<string | null>(null);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Quản lý POI</h1>
        <p className="text-muted-foreground">
          CRUD POI, loại POI, tọa độ GPS và bán kính hiển thị.
        </p>

        {/* Map and POI List - Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* POI List - Left column */}
          <div className="lg:col-span-1 overflow-y-auto rounded-lg border bg-card">
            <div className="sticky top-0 bg-card border-b p-4 z-10">
              <h2 className="font-semibold">Danh sách POI ({pois.length})</h2>
            </div>
            <div className="space-y-2 p-4">
              {pois.map((poi) => (
                <button
                  key={poi.id}
                  onClick={() => setSelectedPOI(poi.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${
                    selectedPOI === poi.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-transparent bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm">{poi.name}</h3>
                    <span className="text-xs bg-slate-200 text-slate-800 px-2 py-1 rounded whitespace-nowrap">
                      {poi.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {poi.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    📍 {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Map - Right columns */}
          <div className="lg:col-span-2 rounded-lg border overflow-hidden">
            <MapboxMap
              pois={pois}
              selectedPOI={selectedPOI}
              onPOIClick={setSelectedPOI}
              zoom={13}
            />
          </div>
        </div>

        {/* Selected POI Details */}
        {selectedPOI && (
          <div className="rounded-lg border bg-card p-6">
            {(() => {
              const poi = pois.find((p) => p.id === selectedPOI);
              return poi ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{poi.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {poi.type}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedPOI(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm">{poi.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Vĩ độ</p>
                      <p className="font-mono">{poi.latitude}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Kinh độ</p>
                      <p className="font-mono">{poi.longitude}</p>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
