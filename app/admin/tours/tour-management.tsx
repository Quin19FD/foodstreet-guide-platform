"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  MapPin,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TourStop = {
  id: string;
  stopOrder: number;
  poiId: string;
  poi: {
    id: string;
    name: string;
    category?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    status: string;
    isActive: boolean;
  };
};

type Tour = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  durationMinutes?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  poiIds: string[];
  stops: TourStop[];
};

type TourListResponse = {
  total: number;
  tours: Tour[];
};

type PoiOption = {
  id: string;
  name: string;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type PoiListResponse = {
  pois?: Array<{
    id: string;
    name: string;
    category?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }>;
};

type ApiErrorResponse = {
  error?: string;
  issues?: Array<{ message?: string }>;
};

function pickErrorMessage(input: unknown, fallback: string): string {
  if (!input || typeof input !== "object") return fallback;
  const data = input as ApiErrorResponse;
  return data.issues?.[0]?.message ?? data.error ?? fallback;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gradient-to-r from-orange-50 via-white to-orange-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-6 py-5 scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400">
          {children}
        </div>
      </div>
    </div>
  );
}

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

function TourStopsMap({ stops }: { stops: TourStop[] }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const points = useMemo(
    () =>
      stops.filter(
        (stop) =>
          typeof stop.poi.latitude === "number" &&
          Number.isFinite(stop.poi.latitude) &&
          typeof stop.poi.longitude === "number" &&
          Number.isFinite(stop.poi.longitude)
      ),
    [stops]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center: [106.7009, 10.7769],
      zoom: 13,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    return () => {
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];

    if (points.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    for (const point of points) {
      const lat = point.poi.latitude as number;
      const lng = point.poi.longitude as number;

      const popup = new maplibregl.Popup({ offset: 24 }).setText(point.poi.name);
      const marker = new maplibregl.Marker({ color: "#f97316" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      const markerElement = marker.getElement();
      markerElement.style.cursor = "pointer";
      markerElement.addEventListener("mouseenter", () => {
        marker.togglePopup();
      });
      markerElement.addEventListener("mouseleave", () => {
        if (marker.getPopup()?.isOpen()) marker.togglePopup();
      });
      markerElement.addEventListener("click", () => {
        window.location.href = `/admin/pois/${point.poiId}`;
      });

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
    }
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 text-sm">
        <MapPin className="mb-2 h-10 w-10 text-slate-300" />
        <p className="font-medium text-slate-600">Các POI trong tour chưa có tọa độ</p>
        <p className="mt-1 text-xs text-slate-500">Không thể hiển thị bản đồ</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50">
      <div ref={mapContainerRef} className="h-[300px] w-full" />
    </div>
  );
}

export function AdminTourManagement() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [poiSearchResults, setPoiSearchResults] = useState<PoiOption[]>([]);
  const [poiLookup, setPoiLookup] = useState<Record<string, PoiOption>>({});

  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isPoiSearching, setIsPoiSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [detailTour, setDetailTour] = useState<Tour | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [selectedPoiIds, setSelectedPoiIds] = useState<string[]>([]);
  const [restaurantKeyword, setRestaurantKeyword] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (includeInactive) params.set("includeInactive", "1");
    params.set("take", "100");
    params.set("skip", "0");
    return params.toString();
  }, [q, includeInactive]);

  const stats = useMemo(() => {
    const total = tours.length;
    const active = tours.filter((t) => t.isActive).length;
    const inactive = total - active;
    const totalStops = tours.reduce((sum, t) => sum + t.stops.length, 0);
    return { total, active, inactive, totalStops };
  }, [tours]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setDurationMinutes("");
    setSelectedPoiIds([]);
    setRestaurantKeyword("");
    setPoiSearchResults([]);
    setImageFile(null);
    setImagePreviewUrl(null);
    setExistingImageUrl(null);
  };

  const applyFormFromTour = (tour: Tour) => {
    setName(tour.name);
    setDescription(tour.description ?? "");
    setDurationMinutes(tour.durationMinutes ? String(tour.durationMinutes) : "");
    setSelectedPoiIds(tour.poiIds ?? []);
    setRestaurantKeyword("");
    setPoiSearchResults([]);
    setImageFile(null);
    setImagePreviewUrl(null);
    setExistingImageUrl(tour.imageUrl ?? null);

    setPoiLookup((prev) => {
      const next = { ...prev };
      for (const stop of tour.stops) {
        next[stop.poiId] = {
          id: stop.poiId,
          name: stop.poi.name,
          category: stop.poi.category,
          latitude: stop.poi.latitude,
          longitude: stop.poi.longitude,
        };
      }
      return next;
    });
  };

  const loadTours = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/tours?${queryString}`, { method: "GET" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể tải danh sách tour"));
      }

      const data = (await res.json().catch(() => null)) as TourListResponse | null;
      const nextTours = data?.tours ?? [];
      setTours(nextTours);

      setPoiLookup((prev) => {
        const next = { ...prev };
        for (const tour of nextTours) {
          for (const stop of tour.stops) {
            next[stop.poiId] = {
              id: stop.poiId,
              name: stop.poi.name,
              category: stop.poi.category,
              latitude: stop.poi.latitude,
              longitude: stop.poi.longitude,
            };
          }
        }
        return next;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void loadTours();
    }, 200);

    return () => clearTimeout(handle);
  }, [loadTours]);

  const searchRestaurants = useCallback(async () => {
    const keyword = restaurantKeyword.trim();
    if (!keyword) {
      setPoiSearchResults([]);
      return;
    }

    setIsPoiSearching(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        q: keyword,
        status: "APPROVED",
        includeLocked: "0",
        take: "100",
        skip: "0",
      });

      const res = await fetch(`/api/admin/pois?${params.toString()}`, { method: "GET" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể tìm nhà hàng"));
      }

      const data = (await res.json().catch(() => null)) as PoiListResponse | null;
      const pois = (data?.pois ?? []).map((poi) => ({
        id: poi.id,
        name: poi.name,
        category: poi.category,
        latitude: poi.latitude,
        longitude: poi.longitude,
      }));

      setPoiSearchResults(pois);
      setPoiLookup((prev) => {
        const next = { ...prev };
        for (const poi of pois) next[poi.id] = poi;
        return next;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsPoiSearching(false);
    }
  }, [restaurantKeyword]);

  const togglePoi = (poiId: string, checked: boolean) => {
    if (checked) {
      if (selectedPoiIds.includes(poiId)) return;
      setSelectedPoiIds((prev) => [...prev, poiId]);
      return;
    }

    setSelectedPoiIds((prev) => prev.filter((id) => id !== poiId));
  };

  const movePoi = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectedPoiIds.length) return;

    setSelectedPoiIds((prev) => {
      const next = [...prev];
      const current = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = current;
      return next;
    });
  };

  const removePoi = (poiId: string) => {
    setSelectedPoiIds((prev) => prev.filter((id) => id !== poiId));
  };

  const onSelectImageFile = (file: File | null) => {
    setImageFile(file);
    if (!file) {
      setImagePreviewUrl(null);
      return;
    }

    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const createTour = async () => {
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Tên tour không được để trống");
      return;
    }

    if (selectedPoiIds.length === 0) {
      setErrorMessage("Tour phải có ít nhất 1 điểm dừng");
      return;
    }

    const parsedDuration = durationMinutes.trim() ? Number(durationMinutes.trim()) : null;
    if (parsedDuration !== null && (!Number.isFinite(parsedDuration) || parsedDuration <= 0)) {
      setErrorMessage("Thời lượng phải là số dương");
      return;
    }

    try {
      const formData = new FormData();
      formData.set("name", trimmedName);
      formData.set("description", description.trim());
      if (parsedDuration !== null) formData.set("durationMinutes", String(parsedDuration));
      formData.set("poiIds", JSON.stringify(selectedPoiIds));
      if (imageFile) formData.set("file", imageFile);

      const res = await fetch("/api/admin/tours", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể tạo tour"));
      }

      setCreateOpen(false);
      resetForm();
      await loadTours();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const saveEdit = async () => {
    if (!selectedTour) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Tên tour không được để trống");
      return;
    }

    if (selectedPoiIds.length === 0) {
      setErrorMessage("Tour phải có ít nhất 1 điểm dừng");
      return;
    }

    const parsedDuration = durationMinutes.trim() ? Number(durationMinutes.trim()) : null;
    if (parsedDuration !== null && (!Number.isFinite(parsedDuration) || parsedDuration <= 0)) {
      setErrorMessage("Thời lượng phải là số dương");
      return;
    }

    try {
      const formData = new FormData();
      formData.set("name", trimmedName);
      formData.set("description", description.trim());
      if (parsedDuration !== null) formData.set("durationMinutes", String(parsedDuration));
      formData.set("poiIds", JSON.stringify(selectedPoiIds));
      if (imageFile) formData.set("file", imageFile);

      const res = await fetch(`/api/admin/tours/${selectedTour.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể cập nhật tour"));
      }

      setEditOpen(false);
      setSelectedTour(null);
      resetForm();
      await loadTours();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const hideTour = async (tour: Tour) => {
    if (!confirm(`Ẩn tour "${tour.name}"?`)) return;

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/tours/${tour.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể ẩn tour"));
      }

      await loadTours();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const restoreTour = async (tour: Tour) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/tours/${tour.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể hiện lại tour"));
      }

      await loadTours();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const openDetail = async (tour: Tour) => {
    const res = await fetch(`/api/admin/tours/${tour.id}`);
    if (!res.ok) return;
    const data = (await res.json().catch(() => null)) as { tour?: Tour } | null;
    if (!data?.tour) return;
    setDetailTour(data.tour);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-lg shadow-orange-100/50 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Quản lý Food Tour
              </h1>
              <p className="text-xs text-slate-500">Tạo và quản lý các tour ẩm thực đường phố</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-orange-500/40"
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Tạo tour mới
          </button>

          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            onClick={() => void loadTours()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tổng tour
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200/50">
              <MapPin className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Đang hoạt động
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.active}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-200/50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã ẩn</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{stats.inactive}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200/50">
              <EyeOff className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                Tổng điểm dừng
              </p>
              <p className="mt-1 text-2xl font-bold text-orange-700">{stats.totalStops}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-200/50">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Tìm theo tên hoặc mô tả tour..."
            className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:bg-white focus:ring-2"
          />
        </div>

        <label className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-all hover:border-orange-300 hover:bg-orange-50">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          Hiển thị tour đã ẩn
        </label>
      </div>

      {/* Error Message */}
      {errorMessage ? (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-800">Lỗi</p>
            <p className="mt-1 text-sm text-rose-700">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="rounded-xl p-1.5 text-rose-400 transition-colors hover:bg-rose-100 hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Tours Table */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/50">
              <MapPin className="h-4 w-4 text-slate-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Danh sách Tour <span className="text-slate-400">({tours.length})</span>
            </h2>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Đang tải...
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Thông tin Tour</th>
                <th className="px-5 py-4">Thời lượng</th>
                <th className="px-5 py-4">Điểm dừng</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Cập nhật</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tours.length === 0 ? (
                <tr>
                  <td className="px-5 py-12 text-center" colSpan={6}>
                    <div className="flex flex-col items-center">
                      <MapPin className="mb-3 h-12 w-12 text-slate-300" />
                      <p className="font-medium text-slate-600">Không tìm thấy tour nào</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {q.trim() ? "Thử thay đổi từ khóa tìm kiếm" : "Bắt đầu tạo tour mới"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tours.map((tour) => (
                  <tr key={tour.id} className="group transition-all hover:bg-orange-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        {tour.imageUrl ? (
                          <div className="flex h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 border-slate-200">
                            <img
                              src={tour.imageUrl}
                              alt={tour.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
                            <ImageIcon className="h-6 w-6 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-800">{tour.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {tour.description ?? "Không có mô tả"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {tour.durationMinutes ? `${tour.durationMinutes} phút` : "-"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-orange-500" />
                        <span className="font-semibold text-slate-700">{tour.stops.length}</span>
                        <span className="text-xs text-slate-500">điểm</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {tour.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                          <EyeOff className="h-3 w-3" />
                          Đã ẩn
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formatDate(tour.updatedAt)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 hover:scale-105"
                          onClick={() => void openDetail(tour)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:scale-105 hover:shadow-lg"
                          onClick={() => {
                            setSelectedTour(tour);
                            applyFormFromTour(tour);
                            setEditOpen(true);
                          }}
                        >
                          Sửa
                        </button>
                        {tour.isActive ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100 hover:scale-105"
                            onClick={() => void hideTour(tour)}
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            Ẩn
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100 hover:scale-105"
                            onClick={() => void restoreTour(tour)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Hiện
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create Modal */}
      <Modal open={createOpen} title="Tạo Tour Mới" onClose={() => setCreateOpen(false)}>
        <TourForm
          name={name}
          description={description}
          durationMinutes={durationMinutes}
          selectedPoiIds={selectedPoiIds}
          poiSearchResults={poiSearchResults}
          poiLookup={poiLookup}
          restaurantKeyword={restaurantKeyword}
          isPoiSearching={isPoiSearching}
          imagePreviewUrl={imagePreviewUrl}
          existingImageUrl={existingImageUrl}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onDurationChange={setDurationMinutes}
          onTogglePoi={togglePoi}
          onMovePoi={movePoi}
          onRemovePoi={removePoi}
          onRestaurantKeywordChange={setRestaurantKeyword}
          onSearchRestaurants={() => void searchRestaurants()}
          onImageFileChange={onSelectImageFile}
        />
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            className="rounded-2xl border-2 border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:scale-105"
            onClick={() => setCreateOpen(false)}
          >
            Hủy
          </button>
          <button
            type="button"
            className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-xl"
            onClick={() => void createTour()}
          >
            <Plus className="inline h-4 w-4" /> Tạo Tour
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} title="Sửa Thông Tin Tour" onClose={() => setEditOpen(false)}>
        <TourForm
          name={name}
          description={description}
          durationMinutes={durationMinutes}
          selectedPoiIds={selectedPoiIds}
          poiSearchResults={poiSearchResults}
          poiLookup={poiLookup}
          restaurantKeyword={restaurantKeyword}
          isPoiSearching={isPoiSearching}
          imagePreviewUrl={imagePreviewUrl}
          existingImageUrl={existingImageUrl}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onDurationChange={setDurationMinutes}
          onTogglePoi={togglePoi}
          onMovePoi={movePoi}
          onRemovePoi={removePoi}
          onRestaurantKeywordChange={setRestaurantKeyword}
          onSearchRestaurants={() => void searchRestaurants()}
          onImageFileChange={onSelectImageFile}
        />
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            className="rounded-2xl border-2 border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:scale-105"
            onClick={() => setEditOpen(false)}
          >
            Hủy
          </button>
          <button
            type="button"
            className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-xl"
            onClick={() => void saveEdit()}
          >
            Lưu Thay Đổi
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailOpen} title="Chi Tiết Tour" onClose={() => setDetailOpen(false)}>
        {detailTour ? (
          <div className="space-y-5">
            {/* Tour Header */}
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 to-white p-5">
              {detailTour.imageUrl ? (
                <div className="flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-lg">
                  <img
                    src={detailTour.imageUrl}
                    alt={detailTour.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white">
                  <ImageIcon className="h-10 w-10 text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800">{detailTour.name}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {detailTour.description ?? "Không có mô tả"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {detailTour.durationMinutes && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <Clock className="h-3 w-3" />
                      {detailTour.durationMinutes} phút
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    <MapPin className="h-3 w-3" />
                    {detailTour.stops.length} điểm dừng
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">Bản Đồ POI Trong Tour</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  <span>Di chuột để xem tên • Click để mở chi tiết</span>
                </div>
              </div>
              <TourStopsMap stops={detailTour.stops} />
            </div>

            {/* POI List */}
            <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
                <p className="text-sm font-bold text-slate-800">
                  Danh Sách POI <span className="text-slate-400">({detailTour.stops.length})</span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Thứ tự</th>
                      <th className="px-4 py-3">Nhà hàng</th>
                      <th className="px-4 py-3">Danh mục</th>
                      <th className="px-4 py-3">Tọa độ</th>
                      <th className="px-4 py-3 text-right">Liên kết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailTour.stops.map((stop) => (
                      <tr key={stop.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-2.5 py-1 text-xs font-bold text-white">
                            #{stop.stopOrder}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{stop.poi.name}</td>
                        <td className="px-4 py-3 text-slate-600">{stop.poi.category ?? "-"}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {typeof stop.poi.latitude === "number" &&
                          typeof stop.poi.longitude === "number"
                            ? `${stop.poi.latitude.toFixed(6)}, ${stop.poi.longitude.toFixed(6)}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/pois/${stop.poiId}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700 transition-all hover:bg-orange-200 hover:scale-105"
                          >
                            <Eye className="h-3 w-3" />
                            Xem POI
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8">
            <AlertCircle className="mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Không có dữ liệu</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TourForm({
  name,
  description,
  durationMinutes,
  selectedPoiIds,
  poiSearchResults,
  poiLookup,
  restaurantKeyword,
  isPoiSearching,
  imagePreviewUrl,
  existingImageUrl,
  onNameChange,
  onDescriptionChange,
  onDurationChange,
  onTogglePoi,
  onMovePoi,
  onRemovePoi,
  onRestaurantKeywordChange,
  onSearchRestaurants,
  onImageFileChange,
}: {
  name: string;
  description: string;
  durationMinutes: string;
  selectedPoiIds: string[];
  poiSearchResults: PoiOption[];
  poiLookup: Record<string, PoiOption>;
  restaurantKeyword: string;
  isPoiSearching: boolean;
  imagePreviewUrl: string | null;
  existingImageUrl: string | null;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onTogglePoi: (poiId: string, checked: boolean) => void;
  onMovePoi: (index: number, direction: -1 | 1) => void;
  onRemovePoi: (poiId: string) => void;
  onRestaurantKeywordChange: (value: string) => void;
  onSearchRestaurants: () => void;
  onImageFileChange: (file: File | null) => void;
}) {
  const selectedPoiList = selectedPoiIds.map(
    (id) => poiLookup[id] ?? { id, name: id, category: null }
  );

  return (
    <div className="space-y-5">
      {/* Name & Duration */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="tour-name"
            className="block text-xs font-bold text-slate-600 uppercase tracking-wider"
          >
            Tên Tour <span className="text-rose-500">*</span>
          </label>
          <input
            id="tour-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Nhập tên tour..."
            className="h-12 w-full rounded-2xl border-2 border-slate-200 px-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="tour-duration"
            className="block text-xs font-bold text-slate-600 uppercase tracking-wider"
          >
            Thời Lượng (phút)
          </label>
          <input
            id="tour-duration"
            value={durationMinutes}
            onChange={(event) => onDurationChange(event.target.value)}
            placeholder="Ví dụ: 120"
            className="h-12 w-full rounded-2xl border-2 border-slate-200 px-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:ring-2"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <p className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Ảnh Tour</p>
        <label className="group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-6 text-sm font-medium text-slate-600 transition-all hover:border-orange-400 hover:bg-orange-50">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onImageFileChange(event.target.files?.[0] ?? null)}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200/50 transition-colors group-hover:bg-orange-200/50">
            <Upload className="h-6 w-6 text-slate-500 transition-colors group-hover:text-orange-600" />
          </div>
          <span className="font-semibold">Chọn ảnh từ máy</span>
          <span className="text-xs text-slate-500">PNG, JPG, WEBP (tối đa 5MB)</span>
        </label>
        {(imagePreviewUrl || existingImageUrl) && (
          <div className="relative mt-3 overflow-hidden rounded-2xl border-2 border-slate-200 shadow-lg">
            <img
              src={imagePreviewUrl ?? existingImageUrl ?? ""}
              alt="Preview"
              className="h-48 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onImageFileChange(null)}
              className="absolute right-3 top-3 rounded-xl bg-rose-500 p-2 text-white shadow-lg transition-all hover:bg-rose-600 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor="tour-description"
          className="block text-xs font-bold text-slate-600 uppercase tracking-wider"
        >
          Mô Tả
        </label>
        <textarea
          id="tour-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Mô tả về tour này..."
          rows={4}
          className="min-h-[100px] w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:ring-2 resize-none"
        />
      </div>

      {/* POI Search */}
      <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            <MapPin className="mr-1 inline h-4 w-4" />
            Tìm Nhà Hàng
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={restaurantKeyword}
            onChange={(event) => onRestaurantKeywordChange(event.target.value)}
            className="h-11 flex-1 rounded-xl border-2 border-slate-200 px-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:ring-2"
            placeholder="Nhập từ khóa tìm kiếm..."
            onKeyDown={(e) => e.key === "Enter" && onSearchRestaurants()}
          />
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 px-5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50"
            onClick={onSearchRestaurants}
            disabled={isPoiSearching}
          >
            {isPoiSearching ? (
              <>
                <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />
                Đang tìm...
              </>
            ) : (
              <>
                <Search className="mr-2 inline h-4 w-4" />
                Tìm
              </>
            )}
          </button>
        </div>
      </div>

      {/* POI Selection */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Search Results */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
            Kết Quả Tìm Kiếm <span className="text-slate-400">({poiSearchResults.length})</span>
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400">
            {poiSearchResults.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Search className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs text-slate-500">
                  {restaurantKeyword.trim() ? "Không tìm thấy kết quả" : "Nhập từ khóa để tìm kiếm"}
                </p>
              </div>
            ) : (
              poiSearchResults.map((poi) => (
                <label
                  key={poi.id}
                  className="group flex items-start gap-3 rounded-xl border-2 border-slate-100 px-3 py-3 transition-all hover:border-orange-200 hover:bg-orange-50/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                    checked={selectedPoiIds.includes(poi.id)}
                    onChange={(event) => onTogglePoi(poi.id, event.target.checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{poi.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {poi.category ?? "Không có danh mục"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(`/admin/pois/${poi.id}`, "_blank");
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Selected POIs */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
            Điểm Dừng Đã Chọn <span className="text-slate-400">({selectedPoiList.length})</span>
          </p>
          <div className="space-y-2">
            {selectedPoiList.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <MapPin className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs text-slate-500">Chưa chọn điểm dừng nào</p>
              </div>
            ) : (
              selectedPoiList.map((poi, index) => (
                <div
                  key={poi.id}
                  className="group flex items-center justify-between rounded-xl border-2 border-slate-100 bg-gradient-to-r from-slate-50 to-white px-3 py-3 transition-all hover:border-orange-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="truncate text-sm font-semibold text-slate-800">{poi.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100 disabled:opacity-50"
                      onClick={() => onMovePoi(index, -1)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100 disabled:opacity-50"
                      onClick={() => onMovePoi(index, 1)}
                      disabled={index === selectedPoiList.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border-2 border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100 hover:scale-105"
                      onClick={() => onRemovePoi(poi.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
