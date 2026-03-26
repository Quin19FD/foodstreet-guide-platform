"use client";

import { Edit3, Eye, Lock, Plus, RefreshCw, RotateCcw, Trash2, Unlock, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PoiLocationPicker } from "./poi-location-picker";

type PoiStatus = "PENDING" | "APPROVED" | "REJECTED";

type PoiTranslation = {
  id: string;
  language: string;
  name?: string | null;
  description?: string | null;
};

type Poi = {
  id: string;
  name: string;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  status: PoiStatus;
  isActive?: boolean;
  rejectionReason?: string | null;
  submitCount?: number;
  updatedAt: string;
  createdAt: string;
  translations: PoiTranslation[];
};

type PoiListResponse = {
  total: number;
  pois: Poi[];
};

type VendorMeResponse = {
  user: {
    id: string;
    email: string;
    name: string;
  };
};

type CreatePoiImageInput = {
  id: string;
  file: File;
  previewUrl: string;
  fileName: string;
  description: string;
};

type CreateMenuItemInput = {
  id: string;
  name: string;
  description: string;
  price: string;
  imageFile: File | null;
  imagePreviewUrl: string;
  imageFileName: string;
};

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function pickError(input: unknown, fallback: string): string {
  if (!input || typeof input !== "object") return fallback;
  const maybe = input as { error?: string; issues?: Array<{ message?: string }> };
  return maybe.issues?.[0]?.message ?? maybe.error ?? fallback;
}

function createTempId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function statusBadge(status: PoiStatus): string {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

export function VendorPoiManagement() {
  const router = useRouter();

  const [me, setMe] = useState<VendorMeResponse["user"] | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<PoiStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Poi | null>(null);

  const [createName, setCreateName] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const [createLatitude, setCreateLatitude] = useState("");
  const [createLongitude, setCreateLongitude] = useState("");
  const [createPriceMin, setCreatePriceMin] = useState("");
  const [createPriceMax, setCreatePriceMax] = useState("");
  const [createViDescription, setCreateViDescription] = useState("");
  const [createImages, setCreateImages] = useState<CreatePoiImageInput[]>([]);
  const [createImageDraft, setCreateImageDraft] = useState<{
    file: File | null;
    previewUrl: string;
    fileName: string;
    description: string;
  }>({
    file: null,
    previewUrl: "",
    fileName: "",
    description: "",
  });

  const [createMenuItems, setCreateMenuItems] = useState<CreateMenuItemInput[]>([]);
  const [createMenuDraft, setCreateMenuDraft] = useState<{
    name: string;
    description: string;
    price: string;
    imageFile: File | null;
    imagePreviewUrl: string;
    imageFileName: string;
  }>({
    name: "",
    description: "",
    price: "",
    imageFile: null,
    imagePreviewUrl: "",
    imageFileName: "",
  });

  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");
  const [editPriceMin, setEditPriceMin] = useState("");
  const [editPriceMax, setEditPriceMax] = useState("");
  const [editViDescription, setEditViDescription] = useState("");

  const [isUploadingKey, setIsUploadingKey] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [audioUploadUrl, setAudioUploadUrl] = useState("");
  const [audioTranslationId, setAudioTranslationId] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/vendor/pois?take=100&skip=0&includeLocked=1", { method: "GET" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể tải danh sách POI"));
      }
      const data = (await res.json().catch(() => null)) as PoiListResponse | null;
      setPois(data?.pois ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsCheckingAuth(true);
      const meRes = await fetch("/api/vendor/auth/me", { method: "GET" }).catch(() => null);
      if (meRes?.ok) {
        const data = (await meRes.json().catch(() => null)) as VendorMeResponse | null;
        if (isMounted) setMe(data?.user ?? null);
        if (isMounted) setIsCheckingAuth(false);
        if (isMounted) await load();
        return;
      }

      const refreshed = await fetch("/api/vendor/auth/refresh", { method: "POST" }).catch(() => null);
      if (!refreshed?.ok) {
        router.replace("/vendor/login");
        return;
      }

      const meAfter = await fetch("/api/vendor/auth/me", { method: "GET" }).catch(() => null);
      if (!meAfter?.ok) {
        router.replace("/vendor/login");
        return;
      }

      const data = (await meAfter.json().catch(() => null)) as VendorMeResponse | null;
      if (isMounted) setMe(data?.user ?? null);
      if (isMounted) setIsCheckingAuth(false);
      if (isMounted) await load();
    })();

    return () => {
      isMounted = false;
    };
  }, [load, router]);

  const filteredPois = useMemo(() => {
    if (statusFilter === "ALL") return pois;
    return pois.filter((poi) => poi.status === statusFilter);
  }, [pois, statusFilter]);

  const resetCreateForm = () => {
    setCreateName("");
    setCreateCategory("");
    setCreateLatitude("");
    setCreateLongitude("");
    setCreatePriceMin("");
    setCreatePriceMax("");
    setCreateViDescription("");
    createImages.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });
    if (createImageDraft.previewUrl) URL.revokeObjectURL(createImageDraft.previewUrl);
    createMenuItems.forEach((item) => {
      if (item.imagePreviewUrl) URL.revokeObjectURL(item.imagePreviewUrl);
    });
    if (createMenuDraft.imagePreviewUrl) URL.revokeObjectURL(createMenuDraft.imagePreviewUrl);

    setCreateImages([]);
    setCreateImageDraft({ file: null, previewUrl: "", fileName: "", description: "" });
    setCreateMenuItems([]);
    setCreateMenuDraft({
      name: "",
      description: "",
      price: "",
      imageFile: null,
      imagePreviewUrl: "",
      imageFileName: "",
    });
  };

  const uploadVendorFile = async (file: File, kind: "image" | "audio", uploadKey: string) => {
    setErrorMessage(null);
    setIsUploadingKey(uploadKey);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);

      const res = await fetch("/api/vendor/media/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Upload Cloudinary thất bại"));
      }

      const data = (await res.json().catch(() => null)) as { url?: string } | null;
      if (!data?.url) {
        throw new Error("Không nhận được URL từ Cloudinary");
      }

      return data.url;
    } finally {
      setIsUploadingKey(null);
    }
  };

  const createPoi = async () => {
    setErrorMessage(null);

    const name = createName.trim();
    const description = createViDescription.trim();

    if (!name) {
      setErrorMessage("Tên POI không được để trống");
      return;
    }

    if (!description) {
      setErrorMessage("Bản thuyết minh tiếng Việt không được để trống");
      return;
    }

    setIsSubmittingCreate(true);

    try {
      const imagesPayload = await Promise.all(
        createImages.map(async (image, index) => {
          const imageUrl = await uploadVendorFile(image.file, "image", `submit-image-${index}`);
          return {
            imageUrl,
            ...(image.description.trim() ? { description: image.description.trim() } : {}),
          };
        })
      );

      const menuPayload = await Promise.all(
        createMenuItems.map(async (item, index) => {
          let imageUrl: string | undefined;
          if (item.imageFile) {
            imageUrl = await uploadVendorFile(item.imageFile, "image", `submit-menu-image-${index}`);
          }

          return {
            name: item.name.trim(),
            ...(item.description.trim() ? { description: item.description.trim() } : {}),
            ...(item.price.trim() ? { price: Number(item.price) } : {}),
            ...(imageUrl ? { imageUrl } : {}),
          };
        })
      );

      const res = await fetch("/api/vendor/pois", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          category: createCategory.trim() || undefined,
          latitude: createLatitude.trim() ? Number(createLatitude) : undefined,
          longitude: createLongitude.trim() ? Number(createLongitude) : undefined,
          priceMin: createPriceMin.trim() ? Number(createPriceMin) : undefined,
          priceMax: createPriceMax.trim() ? Number(createPriceMax) : undefined,
          ...(imagesPayload.length > 0 ? { images: imagesPayload } : {}),
          ...(menuPayload.length > 0 ? { menuItems: menuPayload } : {}),
          viTranslation: {
            name,
            description,
          },
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể tạo POI"));
      }

      setCreateOpen(false);
      resetCreateForm();
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmittingCreate(false);
    }
  };
  const openEdit = (poi: Poi) => {
    setSelected(poi);
    setEditName(poi.name ?? "");
    setEditCategory(poi.category ?? "");
    setEditLatitude(poi.latitude != null ? String(poi.latitude) : "");
    setEditLongitude(poi.longitude != null ? String(poi.longitude) : "");
    setEditPriceMin(poi.priceMin != null ? String(poi.priceMin) : "");
    setEditPriceMax(poi.priceMax != null ? String(poi.priceMax) : "");

    const viTranslation = poi.translations.find((translation) => translation.language === "vi");
    setEditViDescription(viTranslation?.description ?? "");
    setAudioTranslationId(viTranslation?.id ?? poi.translations[0]?.id ?? "");
    setAudioUploadUrl("");

    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selected) return;

    setErrorMessage(null);

    try {
      const viTranslation = selected.translations.find((translation) => translation.language === "vi");

      const res = await fetch(`/api/vendor/pois/${selected.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          category: editCategory.trim() ? editCategory.trim() : null,
          latitude: editLatitude.trim() ? Number(editLatitude) : null,
          longitude: editLongitude.trim() ? Number(editLongitude) : null,
          priceMin: editPriceMin.trim() ? Number(editPriceMin) : null,
          priceMax: editPriceMax.trim() ? Number(editPriceMax) : null,
          translations: viTranslation
            ? {
                update: [
                  {
                    id: viTranslation.id,
                    description: editViDescription.trim() || null,
                    name: editName.trim() || null,
                  },
                ],
              }
            : undefined,
          audios:
            audioUploadUrl.trim() && audioTranslationId
              ? {
                  create: [
                    {
                      translationId: audioTranslationId,
                      audioUrl: audioUploadUrl.trim(),
                      isActive: true,
                    },
                  ],
                }
              : undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể cập nhật POI"));
      }

      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const lockPoi = async (poi: Poi) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/vendor/pois/${poi.id}/lock`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể khóa POI"));
      }
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const unlockPoi = async (poi: Poi) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/vendor/pois/${poi.id}/unlock`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể mở khóa POI"));
      }
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const resubmitPoi = async (poi: Poi) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/vendor/pois/${poi.id}/resubmit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể gửi duyệt lại POI"));
      }
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  if (isCheckingAuth) {
    return <div className="p-6 text-sm text-slate-500">Đang kiểm tra phiên đăng nhập vendor...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Vendor POI Management</h1>
              <p className="mt-1 text-sm text-slate-500">
                Xin chào {me?.name ?? "Vendor"}. Bạn có thể tạo POI mới, chỉnh sửa, khóa/mở khóa và gửi duyệt lại.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                onClick={() => { resetCreateForm(); setErrorMessage(null); setCreateOpen(true); }}
              >
                <Plus className="h-4 w-4" />
                Tạo POI mới
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => void load()}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Tải lại
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PoiStatus | "ALL")}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-orange-500 focus:ring-2"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">POI</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Khóa/Mở</th>
                <th className="px-4 py-3">Tọa độ</th>
                <th className="px-4 py-3">Cập nhật</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredPois.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Chưa có POI nào.
                  </td>
                </tr>
              ) : (
                filteredPois.map((poi) => (
                  <tr key={poi.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{poi.name}</p>
                      <p className="text-xs text-slate-500">Category: {poi.category ?? "-"}</p>
                      {poi.status === "REJECTED" && poi.rejectionReason ? (
                        <p className="mt-1 text-xs text-rose-600">Lý do từ chối: {poi.rejectionReason}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(poi.status)}`}>
                        {poi.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {poi.isActive === false ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          Đang khóa
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                          Đang mở
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {poi.latitude ?? "-"}, {poi.longitude ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(poi.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => openEdit(poi)}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Sửa
                        </button>

                        {poi.isActive === false ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            onClick={() => void unlockPoi(poi)}
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            Mở khóa
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                            onClick={() => void lockPoi(poi)}
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Khóa
                          </button>
                        )}

                        {poi.status === "REJECTED" ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                            onClick={() => void resubmitPoi(poi)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Gửi duyệt lại
                          </button>
                        ) : null}

                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => router.push(`/vendor/pois/${poi.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold">Tạo POI mới</h2>
            <p className="mt-1 text-sm text-slate-500">POI sẽ được gửi trạng thái Pending để Admin duyệt.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Tên POI" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2" />
              <input value={createCategory} onChange={(e) => setCreateCategory(e.target.value)} placeholder="Danh mục" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2" />
              <input value={createPriceMin} onChange={(e) => setCreatePriceMin(e.target.value)} placeholder="Giá tối thiểu" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2" />
              <input value={createPriceMax} onChange={(e) => setCreatePriceMax(e.target.value)} placeholder="Giá tối đa" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2" />
            </div>

            <PoiLocationPicker
              latitude={createLatitude}
              longitude={createLongitude}
              onLatitudeChange={setCreateLatitude}
              onLongitudeChange={setCreateLongitude}
            />

            <div className="mt-4 rounded-xl border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-800">Danh sách ảnh quảng bá (POIImage)</h3>
              <p className="mt-1 text-xs text-slate-500">
                Chọn file ảnh, xem preview, rồi bấm "Xác nhận ảnh" để thêm vào bảng.
              </p>

              <div className="mt-3 flex flex-col gap-2">
                <textarea
                  value={createImageDraft.description}
                  onChange={(e) =>
                    setCreateImageDraft((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả ảnh (tuỳ chọn)"
                  className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
                />

                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = () => {
                      const file = input.files?.[0];
                      if (!file) return;

                      setCreateImageDraft((prev) => {
                        if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
                        return {
                          ...prev,
                          file,
                          previewUrl: URL.createObjectURL(file),
                          fileName: file.name,
                        };
                      });
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {createImageDraft.fileName ? "Đổi ảnh" : "Chọn ảnh"}
                </button>

                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-orange-500 px-3 text-xs font-semibold text-white hover:bg-orange-600"
                  onClick={() => {
                    const draftFile = createImageDraft.file;
                    if (!draftFile) {
                      setErrorMessage("Vui lòng chọn ảnh trước khi xác nhận");
                      return;
                    }

                    setCreateImages((prev) => [
                      ...prev,
                      {
                        id: createTempId(),
                        file: draftFile,
                        previewUrl: createImageDraft.previewUrl,
                        fileName: createImageDraft.fileName,
                        description: createImageDraft.description.trim(),
                      },
                    ]);

                    setCreateImageDraft({
                      file: null,
                      previewUrl: "",
                      fileName: "",
                      description: "",
                    });
                  }}
                  disabled={!createImageDraft.file}
                >
                  Xác nhận ảnh
                </button>
              </div>

              {createImageDraft.previewUrl ? (
                <div className="mt-3 rounded-xl border border-slate-200 p-2">
                  <p className="mb-2 text-xs font-semibold text-slate-600">Preview ảnh đang chọn</p>
                  <img
                    src={createImageDraft.previewUrl}
                    alt="preview"
                    className="h-32 w-full rounded-lg object-cover"
                  />
                </div>
              ) : null}

              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[720px] w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Preview</th>
                      <th className="px-3 py-2">Tên file</th>
                      <th className="px-3 py-2">Mô tả</th>
                      <th className="px-3 py-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createImages.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-slate-500" colSpan={4}>
                          Chưa có ảnh nào được xác nhận.
                        </td>
                      </tr>
                    ) : (
                      createImages.map((image) => (
                        <tr key={image.id} className="border-t border-slate-100">
                          <td className="px-3 py-2">
                            <img
                              src={image.previewUrl}
                              alt={image.fileName}
                              className="h-14 w-24 rounded-md object-cover"
                            />
                          </td>
                          <td className="px-3 py-2 text-slate-700">{image.fileName}</td>
                          <td className="px-3 py-2 text-slate-700">{image.description || "-"}</td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 font-semibold text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                URL.revokeObjectURL(image.previewUrl);
                                setCreateImages((prev) => prev.filter((it) => it.id !== image.id));
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-800">Danh sách MenuItem</h3>
              <p className="mt-1 text-xs text-slate-500">
                Nhập menu, chọn ảnh món (tuỳ chọn), rồi bấm "Xác nhận menu" để thêm vào bảng.
              </p>

              <div className="mt-3 flex flex-col gap-2">
                <input
                  value={createMenuDraft.name}
                  onChange={(e) =>
                    setCreateMenuDraft((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Tên món"
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
                />
                <textarea
                  value={createMenuDraft.description}
                  onChange={(e) =>
                    setCreateMenuDraft((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả"
                  className="min-h-[110px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
                />
                <input
                  value={createMenuDraft.price}
                  onChange={(e) =>
                    setCreateMenuDraft((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="Giá"
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = () => {
                        const file = input.files?.[0];
                        if (!file) return;

                        setCreateMenuDraft((prev) => {
                          if (prev.imagePreviewUrl) URL.revokeObjectURL(prev.imagePreviewUrl);
                          return {
                            ...prev,
                            imageFile: file,
                            imagePreviewUrl: URL.createObjectURL(file),
                            imageFileName: file.name,
                          };
                        });
                      };
                      input.click();
                    }}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {createMenuDraft.imageFileName ? "Đổi ảnh" : "Chọn ảnh"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-orange-500 px-3 text-xs font-semibold text-white hover:bg-orange-600"
                    onClick={() => {
                      if (!createMenuDraft.name.trim()) {
                        setErrorMessage("Tên menu item không được để trống");
                        return;
                      }

                      setCreateMenuItems((prev) => [
                        ...prev,
                        {
                          id: createTempId(),
                          name: createMenuDraft.name.trim(),
                          description: createMenuDraft.description.trim(),
                          price: createMenuDraft.price.trim(),
                          imageFile: createMenuDraft.imageFile,
                          imagePreviewUrl: createMenuDraft.imagePreviewUrl,
                          imageFileName: createMenuDraft.imageFileName,
                        },
                      ]);

                      setCreateMenuDraft({
                        name: "",
                        description: "",
                        price: "",
                        imageFile: null,
                        imagePreviewUrl: "",
                        imageFileName: "",
                      });
                    }}
                  >
                    Xác nhận menu
                  </button>
                </div>
              </div>

              {createMenuDraft.imagePreviewUrl ? (
                <div className="mt-3 rounded-xl border border-slate-200 p-2">
                  <p className="mb-2 text-xs font-semibold text-slate-600">Preview ảnh menu đang chọn</p>
                  <img
                    src={createMenuDraft.imagePreviewUrl}
                    alt="preview-menu"
                    className="h-28 w-full rounded-lg object-cover"
                  />
                </div>
              ) : null}

              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[860px] w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Tên món</th>
                      <th className="px-3 py-2">Mô tả</th>
                      <th className="px-3 py-2">Giá</th>
                      <th className="px-3 py-2">Ảnh</th>
                      <th className="px-3 py-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createMenuItems.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-slate-500" colSpan={5}>
                          Chưa có menu item nào được xác nhận.
                        </td>
                      </tr>
                    ) : (
                      createMenuItems.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-700">{item.name}</td>
                          <td className="px-3 py-2 text-slate-700">{item.description || "-"}</td>
                          <td className="px-3 py-2 text-slate-700">{item.price || "-"}</td>
                          <td className="px-3 py-2">
                            {item.imagePreviewUrl ? (
                              <img
                                src={item.imagePreviewUrl}
                                alt={item.imageFileName || item.name}
                                className="h-14 w-24 rounded-md object-cover"
                              />
                            ) : (
                              <span className="text-slate-500">Không ảnh</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 font-semibold text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                if (item.imagePreviewUrl) URL.revokeObjectURL(item.imagePreviewUrl);
                                setCreateMenuItems((prev) => prev.filter((it) => it.id !== item.id));
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <textarea value={createViDescription} onChange={(e) => setCreateViDescription(e.target.value)} placeholder="Bản thuyết minh tiếng Việt (bắt buộc)" className="mt-3 min-h-[260px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2" />

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { resetCreateForm(); setCreateOpen(false); }}>Hủy</button>
              <button type="button" className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60" onClick={() => void createPoi()} disabled={isSubmittingCreate || isUploadingKey !== null}>{isSubmittingCreate ? "Đang tạo..." : "Tạo POI"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {editOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold">Chỉnh sửa POI</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Tên POI" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2" />
              <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Danh mục" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2" />
              <input value={editPriceMin} onChange={(e) => setEditPriceMin(e.target.value)} placeholder="Giá tối thiểu" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2" />
              <input value={editPriceMax} onChange={(e) => setEditPriceMax(e.target.value)} placeholder="Giá tối đa" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2" />
            </div>

            <PoiLocationPicker
              latitude={editLatitude}
              longitude={editLongitude}
              onLatitudeChange={setEditLatitude}
              onLongitudeChange={setEditLongitude}
            />

            <div className="mt-4 rounded-xl border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-800">Audio Vendor (Cloudinary)</h3>
              <p className="mt-1 text-xs text-slate-500">
                Upload audio lên Cloudinary và lưu vào POI khi bấm "Lưu".
              </p>

              <div className="mt-3 grid gap-2 md:grid-cols-[220px_1fr_auto]">
                <select
                  value={audioTranslationId}
                  onChange={(e) => setAudioTranslationId(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-orange-500 focus:ring-2"
                >
                  {selected.translations.map((translation) => (
                    <option key={translation.id} value={translation.id}>
                      {translation.language.toUpperCase()}
                    </option>
                  ))}
                </select>

                <input
                  value={audioUploadUrl}
                  onChange={(e) => setAudioUploadUrl(e.target.value)}
                  placeholder="Audio URL"
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
                />

                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  onClick={async () => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "audio/*";
                    input.onchange = async () => {
                      const file = input.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadVendorFile(file, "audio", "edit-audio");
                        setAudioUploadUrl(url);
                      } catch (error) {
                        setErrorMessage(error instanceof Error ? error.message : "Upload audio thất bại");
                      }
                    };
                    input.click();
                  }}
                  disabled={isUploadingKey === "edit-audio"}
                >
                  {isUploadingKey === "edit-audio" ? "Đang up..." : "Upload audio"}
                </button>
              </div>
            </div>

            <textarea value={editViDescription} onChange={(e) => setEditViDescription(e.target.value)} placeholder="Thuyết minh tiếng Việt" className="mt-3 min-h-[260px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2" />

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { setEditOpen(false); setSelected(null); }}>Hủy</button>
              <button type="button" className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600" onClick={() => void saveEdit()}>Lưu</button>
            </div>
          </div>
        </div>
      ) : null}


    </div>
  );
}












































