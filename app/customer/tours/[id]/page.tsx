"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

type TourDetail = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  durationMinutes?: number | null;
  stops: Array<{
    id: string;
    poiId: string;
    stopOrder: number;
    poi: {
      id: string;
      name: string;
      description?: string | null;
      imageUrl?: string | null;
    };
  }>;
};

export default function TourDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.id as string;

  const [tour, setTour] = useState<TourDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/customer/tours/${tourId}`);
        if (!res.ok) {
          if (mounted) setTour(null);
          return;
        }
        const data = (await res.json().catch(() => null)) as { tour?: TourDetail } | null;
        if (mounted) setTour(data?.tour ?? null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tourId]);

  if (isLoading) return <div className="p-6 text-sm text-slate-500">Đang tải tour...</div>;
  if (!tour) return <div className="p-6 text-sm text-slate-500">Không tìm thấy tour.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <h1 className="font-semibold text-slate-900">Chi tiết Tour</h1>
        </div>
      </header>

      <div className="relative aspect-video bg-slate-100">
        {tour.imageUrl ? (
          <img src={tour.imageUrl} alt={tour.name} className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
          <h2 className="text-xl font-bold">{tour.name}</h2>
          <p className="mt-1 text-sm text-white/90">{tour.description ?? "-"}</p>
        </div>
      </div>

      <main className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <Clock className="mx-auto h-5 w-5 text-orange-500" />
            <p className="mt-1 text-xs text-slate-500">Thời lượng</p>
            <p className="text-sm font-semibold text-slate-800">{tour.durationMinutes ?? "-"} phút</p>
          </div>
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <MapPin className="mx-auto h-5 w-5 text-orange-500" />
            <p className="mt-1 text-xs text-slate-500">Điểm dừng</p>
            <p className="text-sm font-semibold text-slate-800">{tour.stops.length}</p>
          </div>
        </div>

        <div className="space-y-3">
          {tour.stops.map((stop, index) => (
            <Link
              key={stop.id}
              href={`/customer/pois/${stop.poiId}`}
              className="flex min-h-20 gap-3 rounded-xl bg-white p-4 shadow-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-slate-900">{stop.poi.name}</h3>
                <p className="line-clamp-2 text-sm text-slate-500">{stop.poi.description ?? "-"}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
