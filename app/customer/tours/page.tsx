"use client";

import Link from "next/link";
import { Search, Clock, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TourItem = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  durationMinutes?: number | null;
  poiCount: number;
};

export default function CustomerToursPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tours, setTours] = useState<TourItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("take", "30");
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        const res = await fetch(`/api/customer/tours?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => null)) as { tours?: TourItem[] } | null;
        setTours(data?.tours ?? []);
      } catch {
        if (!controller.signal.aborted) setTours([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const emptyMessage = useMemo(() => {
    if (isLoading) return "Đang tải danh sách tour...";
    if (!searchQuery.trim()) return "Hiện chưa có tour phù hợp.";
    return "Không tìm thấy tour nào.";
  }, [isLoading, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <h1 className="text-lg font-bold text-slate-900">Food Tours</h1>
        <p className="text-xs text-slate-500">{tours.length} tour</p>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tour..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[15px] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </header>

      <main className="p-4">
        {tours.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-500">{emptyMessage}</div>
        ) : (
          <div className="space-y-4">
            {tours.map((tour) => (
              <Link
                key={tour.id}
                href={`/customer/tours/${tour.id}`}
                className="block rounded-2xl bg-white p-4 shadow-sm transition-shadow active:shadow md:hover:shadow-md"
              >
                <div className="relative mb-3 aspect-video overflow-hidden rounded-xl bg-slate-100">
                  {tour.imageUrl ? (
                    <img
                      src={tour.imageUrl}
                      alt={tour.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <MapPin className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900">{tour.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {tour.description ?? "-"}
                </p>
                <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tour.durationMinutes ?? "-"} phút
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {tour.poiCount} điểm dừng
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
