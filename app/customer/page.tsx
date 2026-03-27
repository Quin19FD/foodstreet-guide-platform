"use client";

import Link from "next/link";
import { Search, MapPin, Navigation, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SearchType = "poi" | "tour";

type PoiItem = {
  id: string;
  name: string;
  description?: string;
  type: "FOOD_STALL" | "SUPPORTING_FACILITY";
  imageUrl?: string | null;
  distanceMeters?: number | null;
};

type TourItem = {
  id: string;
  name: string;
  description?: string | null;
  poiCount?: number;
};

export default function CustomerHomePage() {
  const [searchType, setSearchType] = useState<SearchType>("poi");
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pois, setPois] = useState<PoiItem[]>([]);
  const [tours, setTours] = useState<TourItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 10.7769, lng: 106.7009 })
    );
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
          const data = (await res.json().catch(() => null)) as { pois?: PoiItem[] } | null;
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
          const data = (await res.json().catch(() => null)) as { tours?: TourItem[] } | null;
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
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchType, searchQuery, searchType === "poi" ? userLocation?.lat : null, searchType === "poi" ? userLocation?.lng : null]);

  const emptyMessage = useMemo(() => {
    if (isLoading) return "Đang tìm kiếm...";
    return "Không tìm thấy kết quả phù hợp.";
  }, [isLoading]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Khám phá</h1>
            <p className="text-xs text-slate-500">Tìm POI hoặc TOUR</p>
          </div>
          <Link href="/customer/map" className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
            <MapPin className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => setSearchType("poi")} className={`min-h-11 rounded-xl px-3 py-2 text-sm font-semibold ${searchType === "poi" ? "bg-orange-500 text-white shadow-sm" : "bg-slate-100 text-slate-700"}`}>
            Tìm POI
          </button>
          <button onClick={() => setSearchType("tour")} className={`min-h-11 rounded-xl px-3 py-2 text-sm font-semibold ${searchType === "tour" ? "bg-orange-500 text-white shadow-sm" : "bg-slate-100 text-slate-700"}`}>
            Tìm TOUR
          </button>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchType === "poi" ? "Tìm theo tên POI..." : "Tìm theo tên TOUR..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[15px] outline-none focus:border-orange-400"
          />
        </div>
      </header>

      <main className="p-4">
        {searchType === "poi" ? (
          pois.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">{emptyMessage}</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {pois.map((poi) => (
                <Link key={poi.id} href={`/customer/pois/${poi.id}`} className="rounded-2xl bg-white p-4 shadow-sm transition-shadow active:shadow md:hover:shadow">
                  <h3 className="text-[15px] font-semibold text-slate-900">{poi.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{poi.description ?? "-"}</p>
                  {poi.distanceMeters != null ? (
                    <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
                      <Navigation className="h-3 w-3" />
                      {poi.distanceMeters < 1000 ? `${Math.round(poi.distanceMeters)}m` : `${(poi.distanceMeters / 1000).toFixed(1)}km`}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          )
        ) : tours.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">{emptyMessage}</div>
        ) : (
          <div className="space-y-3">
            {tours.map((tour) => (
              <Link key={tour.id} href={`/customer/tours/${tour.id}`} className="block rounded-2xl bg-white p-4 shadow-sm transition-shadow active:shadow md:hover:shadow">
                <h3 className="text-[15px] font-semibold text-slate-900">{tour.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{tour.description ?? "-"}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{tour.poiCount ?? 0} điểm dừng</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
