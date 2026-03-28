"use client";

import Link from "next/link";
import maplibregl from "maplibre-gl";
import {
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Search,
  Upload,
  MapPin,
  Clock,
  ChevronUp,
  ChevronDown,
  X,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  GripVertical,
} from "lucide-react";
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
  return date.toLocaleString();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
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
      <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
        Các POI trong tour chưa có tọa độ để hiển thị map.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div ref={mapContainerRef} className="h-[260px] w-full" />
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
    if (!confirm(`Ẩn tour \"${tour.name}\"?`)) return;

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Food Tour</h1>
          <p className="mt-1 text-sm text-slate-500">
            Chọn ảnh từ máy, tìm nhà hàng theo từ khóa và chỉ lưu khi nhấn Tạo/Lưu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Tạo tour
          </button>

          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => void loadTours()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Tìm theo tên hoặc mô tả..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none ring-orange-500 transition focus:ring-2"
          />
        </div>

        <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          Hiện cả tour đã ẩn
        </label>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="overflow-x-auto rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Danh sách tour ({tours.length})</h2>
          <span className="text-xs text-slate-500">{isLoading ? "Đang tải..." : ""}</span>
        </div>

        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tour</th>
              <th className="px-4 py-3">Thời lượng</th>
              <th className="px-4 py-3">Điểm dừng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tours.map((tour) => (
              <tr key={tour.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{tour.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {tour.description ?? "-"}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {tour.durationMinutes ? `${tour.durationMinutes} phút` : "-"}
                </td>
                <td className="px-4 py-3 text-slate-700">{tour.stops.length}</td>
                <td className="px-4 py-3">
                  {tour.isActive ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Đang hiển thị
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      Đã ẩn
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">{formatDate(tour.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => void openDetail(tour)}
                    >
                      <Eye className="h-3.5 w-3.5" /> Chi tiết
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        onClick={() => void hideTour(tour)}
                      >
                        <EyeOff className="h-3.5 w-3.5" /> Ẩn
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        onClick={() => void restoreTour(tour)}
                      >
                        <Eye className="h-3.5 w-3.5" /> Hiện lại
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={createOpen} title="Tạo tour mới" onClose={() => setCreateOpen(false)}>
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
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => setCreateOpen(false)}
          >
            Hủy
          </button>
          <button
            type="button"
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            onClick={() => void createTour()}
          >
            Tạo tour
          </button>
        </div>
      </Modal>

      <Modal open={editOpen} title="Sửa tour" onClose={() => setEditOpen(false)}>
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
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => setEditOpen(false)}
          >
            Hủy
          </button>
          <button
            type="button"
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            onClick={() => void saveEdit()}
          >
            Lưu thay đổi
          </button>
        </div>
      </Modal>

      <Modal open={detailOpen} title="Chi tiết tour" onClose={() => setDetailOpen(false)}>
        {detailTour ? (
          <div className="space-y-4 text-sm">
            <p className="font-semibold text-slate-800">{detailTour.name}</p>
            {detailTour.imageUrl ? (
              <img
                src={detailTour.imageUrl}
                alt={detailTour.name}
                className="h-48 w-full rounded-xl border border-slate-200 object-cover"
              />
            ) : null}
            <p className="text-slate-700">{detailTour.description ?? "-"}</p>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-800">Bản đồ POI trong Tour</p>
              <p className="mb-2 text-xs text-slate-500">
                Di chuột vào marker để xem tên nhà hàng. Nhấn marker để mở chi tiết POI.
              </p>
              <TourStopsMap stops={detailTour.stops} />
            </div>

            <div className="rounded-xl border border-slate-200">
              <div className="border-b border-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                Danh sách POI trong Tour ({detailTour.stops.length})
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[680px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Thứ tự</th>
                      <th className="px-3 py-2">Tên nhà hàng</th>
                      <th className="px-3 py-2">Danh mục</th>
                      <th className="px-3 py-2">Tọa độ</th>
                      <th className="px-3 py-2">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailTour.stops.map((stop) => (
                      <tr key={stop.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">#{stop.stopOrder}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">{stop.poi.name}</td>
                        <td className="px-3 py-2 text-slate-700">{stop.poi.category ?? "-"}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {typeof stop.poi.latitude === "number" &&
                          typeof stop.poi.longitude === "number"
                            ? `${stop.poi.latitude.toFixed(6)}, ${stop.poi.longitude.toFixed(6)}`
                            : "-"}
                        </td>
                        <td className="px-3 py-2">
                          <Link
                            href={`/admin/pois/${stop.poiId}`}
                            className="text-xs font-semibold text-orange-600 hover:underline"
                          >
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
          <p className="text-sm text-slate-500">Không có dữ liệu.</p>
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
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="tour-name" className="text-xs font-semibold text-slate-600">
            Tên tour
          </label>
          <input
            id="tour-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="tour-duration" className="text-xs font-semibold text-slate-600">
            Thời lượng (phút)
          </label>
          <input
            id="tour-duration"
            value={durationMinutes}
            onChange={(event) => onDurationChange(event.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600">Ảnh tour</p>
        <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-700 hover:bg-slate-100">
          <Upload className="h-4 w-4" /> Chọn ảnh từ máy
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onImageFileChange(event.target.files?.[0] ?? null)}
          />
        </label>
        {imagePreviewUrl ? (
          <img
            src={imagePreviewUrl}
            alt="preview"
            className="mt-2 h-40 w-full rounded-xl border border-slate-200 object-cover"
          />
        ) : existingImageUrl ? (
          <img
            src={existingImageUrl}
            alt="current"
            className="mt-2 h-40 w-full rounded-xl border border-slate-200 object-cover"
          />
        ) : null}
      </div>

      <div>
        <label htmlFor="tour-description" className="text-xs font-semibold text-slate-600">
          Mô tả
        </label>
        <textarea
          id="tour-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className="mt-1 min-h-[88px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
        />
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tìm nhà hàng theo từ khóa
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={restaurantKeyword}
            onChange={(event) => onRestaurantKeywordChange(event.target.value)}
            className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
            placeholder="Nhập từ khóa..."
          />
          <button
            type="button"
            className="rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900"
            onClick={onSearchRestaurants}
            disabled={isPoiSearching}
          >
            {isPoiSearching ? "Đang tìm..." : "Tìm"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Kết quả nhà hàng
          </p>
          <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
            {poiSearchResults.map((poi) => (
              <label
                key={poi.id}
                className="flex items-start gap-2 rounded-lg border border-slate-100 px-2 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={selectedPoiIds.includes(poi.id)}
                  onChange={(event) => onTogglePoi(poi.id, event.target.checked)}
                />
                <span>
                  <span className="font-medium text-slate-800">{poi.name}</span>
                  <span className="block text-xs text-slate-500">{poi.category ?? "-"}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Thứ tự điểm dừng
          </p>
          <div className="mt-2 space-y-2">
            {selectedPoiList.map((poi, index) => (
              <div
                key={poi.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-2 py-2"
              >
                <p className="text-sm text-slate-700">
                  #{index + 1} - {poi.name}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
                    onClick={() => onMovePoi(index, -1)}
                    disabled={index === 0}
                  >
                    Lên
                  </button>
                  <button
                    type="button"
                    className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
                    onClick={() => onMovePoi(index, 1)}
                    disabled={index === selectedPoiList.length - 1}
                  >
                    Xuống
                  </button>
                  <button
                    type="button"
                    className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700"
                    onClick={() => onRemovePoi(poi.id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
