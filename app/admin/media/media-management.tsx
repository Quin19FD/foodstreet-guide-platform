"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
  Filter,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  Route,
  Search,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type MediaType = "all" | "poi" | "tour" | "user";

type MediaItem = {
  id: string;
  type: "poi" | "tour" | "user";
  url: string;
  thumbnail: string;
  description?: string;
  relatedId: string;
  relatedName: string;
  relatedCategory?: string;
  createdAt: string;
};

type MediaListResponse = {
  total: number;
  media: MediaItem[];
  take: number;
  skip: number;
};

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function typeLabel(type: MediaType): string {
  switch (type) {
    case "poi":
      return "POI Images";
    case "tour":
      return "Tour Images";
    case "user":
      return "User Avatars";
    default:
      return "Tất cả";
  }
}

function typeIcon(type: "poi" | "tour" | "user") {
  switch (type) {
    case "poi":
      return <MapPin className="h-3 w-3" />;
    case "tour":
      return <Route className="h-3 w-3" />;
    case "user":
      return <User className="h-3 w-3" />;
  }
}

export function AdminMediaManagement() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<MediaType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("type", typeFilter);
    params.set("take", "100");
    params.set("skip", "0");
    return params.toString();
  }, [typeFilter]);

  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return mediaItems;
    const query = searchQuery.toLowerCase();
    return mediaItems.filter(
      (item) =>
        item.relatedName.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.relatedCategory?.toLowerCase().includes(query)
    );
  }, [mediaItems, searchQuery]);

  const stats = useMemo(() => {
    const poiCount = mediaItems.filter((m) => m.type === "poi").length;
    const tourCount = mediaItems.filter((m) => m.type === "tour").length;
    const userCount = mediaItems.filter((m) => m.type === "user").length;
    return { total: mediaItems.length, poi: poiCount, tour: tourCount, user: userCount };
  }, [mediaItems]);

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/media?${queryString}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Không thể tải danh sách media");
      }

      const data = (await res.json().catch(() => null)) as MediaListResponse | null;
      setMediaItems(data?.media ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void loadMedia();
    }, 200);

    return () => clearTimeout(handle);
  }, [loadMedia]);

  const handleFileSelect = (file: File | null) => {
    setUploadFile(file);
    if (!file) {
      setUploadPreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Chỉ chấp nhận file ảnh");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File quá lớn. Giới hạn 10MB");
      return;
    }

    setUploadPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setErrorMessage("Vui lòng chọn file để upload");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/admin/session/avatar-upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Upload thất bại");
      }

      const data = (await res.json().catch(() => null)) as {
        url?: string;
        publicId?: string;
      } | null;

      if (!data?.url) {
        throw new Error("Không nhận được URL ảnh");
      }

      setSuccessMessage("Upload thành công!");
      setUploadOpen(false);
      setUploadFile(null);
      setUploadPreview(null);

      await loadMedia();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setSuccessMessage("Đã sao chép URL!");
      setTimeout(() => setSuccessMessage(null), 2000);
    });
  };

  const confirmDelete = (media: MediaItem) => {
    setMediaToDelete(media);
    setDeleteDialogOpen(true);
  };

  const deleteMedia = async () => {
    if (!mediaToDelete) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Delete functionality not implemented yet - keeping as placeholder
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
      setSuccessMessage("Tính năng xóa đang được phát triển");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-lg shadow-blue-100/50 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/30">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Media Library
              </h1>
              <p className="text-xs text-slate-500">
                Quản lý hình ảnh từ POI, Tour và User avatars
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-xl"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload ảnh
          </button>

          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50"
            onClick={() => void loadMedia()}
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
                Tổng Media
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200/50">
              <ImageIcon className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                POI Images
              </p>
              <p className="mt-1 text-2xl font-bold text-orange-700">{stats.poi}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-200/50">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-100 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Tour Images
              </p>
              <p className="mt-1 text-2xl font-bold text-indigo-700">{stats.tour}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-200/50">
              <Route className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-100 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                User Avatars
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.user}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-200/50">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, mô tả..."
            className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none ring-blue-500 transition-all focus:border-blue-400 focus:bg-white focus:ring-2"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-12 items-center justify-between gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {typeLabel(typeFilter)}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setTypeFilter("all")}>Tất cả</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("poi")}>
              <MapPin className="mr-2 h-4 w-4" />
              POI Images
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("tour")}>
              <Route className="mr-2 h-4 w-4" />
              Tour Images
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("user")}>
              <User className="mr-2 h-4 w-4" />
              User Avatars
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
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

      {successMessage ? (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">Thành công</p>
            <p className="mt-1 text-sm text-emerald-700">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="rounded-xl p-1.5 text-emerald-400 transition-colors hover:bg-emerald-100 hover:text-emerald-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Media Grid */}
      {isLoading && mediaItems.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50">
          <div className="text-center">
            <RefreshCw className="mx-auto h-12 w-12 animate-spin text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-600">Đang tải...</p>
          </div>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
          <ImageIcon className="h-16 w-16 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-600">
            {searchQuery.trim() ? "Không tìm thấy media nào" : "Chưa có media nào"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {searchQuery.trim()
              ? "Thử thay đổi từ khóa tìm kiếm"
              : "Bắt đầu upload hình ảnh để sử dụng"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMedia.map((media) => (
            <div
              key={media.id}
              className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-blue-300"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                <Image
                  src={media.url}
                  alt={media.description ?? media.relatedName}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMedia(media);
                          setPreviewOpen(true);
                        }}
                        className="rounded-xl bg-white/90 p-2 text-slate-700 backdrop-blur transition-all hover:bg-white hover:scale-110"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(media.url)}
                          className="rounded-xl bg-white/90 p-2 text-slate-700 backdrop-blur transition-all hover:bg-white hover:scale-110"
                        >
                          <Copy className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => confirmDelete(media)}
                          className="rounded-xl bg-rose-500/90 p-2 text-white backdrop-blur transition-all hover:bg-rose-600 hover:scale-110"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Type badge */}
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold backdrop-blur shadow-sm">
                  {typeIcon(media.type)}
                  <span className="uppercase">{media.type}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-slate-800">{media.relatedName}</p>
                {media.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{media.description}</p>
                ) : null}
                {media.relatedCategory ? (
                  <p className="mt-1 text-xs text-slate-400">{media.relatedCategory}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-400">{formatDate(media.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/30">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Upload Ảnh Mới
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                {/* Upload Area */}
                <label className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-8 transition-all hover:border-blue-400 hover:bg-blue-50">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                  />
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-200/50 transition-colors group-hover:bg-blue-200/50">
                    <Upload className="h-7 w-7 text-slate-500 transition-colors group-hover:text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-700">Chọn ảnh từ máy</p>
                    <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP (tối đa 10MB)</p>
                  </div>
                </label>

                {/* Preview */}
                {uploadPreview ? (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 shadow-lg">
                    <img src={uploadPreview} alt="Preview" className="h-64 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setUploadPreview(null);
                      }}
                      className="absolute right-3 top-3 rounded-xl bg-rose-500 p-2 text-white shadow-lg transition-all hover:bg-rose-600 hover:scale-110"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                className="rounded-2xl border-2 border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100"
                onClick={() => setUploadOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 disabled:opacity-50"
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />
                    Đang upload...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 inline h-4 w-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Preview Modal */}
      {previewOpen && selectedMedia ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              type="button"
              onClick={() => {
                setPreviewOpen(false);
                setSelectedMedia(null);
              }}
              className="absolute right-4 top-4 z-10 rounded-xl bg-black/50 p-2 text-white backdrop-blur transition-all hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>

            <img
              src={selectedMedia.url}
              alt={selectedMedia.description ?? selectedMedia.relatedName}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />

            <div className="absolute bottom-0 left-0 right-0 rounded-b-3xl bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6">
              <div className="text-white">
                <div className="flex items-center gap-2">
                  {typeIcon(selectedMedia.type)}
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold uppercase backdrop-blur">
                    {selectedMedia.type}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold">{selectedMedia.relatedName}</h3>
                {selectedMedia.description ? (
                  <p className="mt-1 text-sm opacity-90">{selectedMedia.description}</p>
                ) : null}
                {selectedMedia.relatedCategory ? (
                  <p className="mt-1 text-xs opacity-75">{selectedMedia.relatedCategory}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedMedia.url)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur transition-all hover:bg-white/30"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy URL
                  </button>
                  <p className="text-xs opacity-75">{formatDate(selectedMedia.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Bạn có chắc chắn muốn xóa media này? Hành động này có thể ảnh hưởng đến POI, Tour hoặc
              User đang sử dụng ảnh này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMedia}
              className="rounded-2xl bg-rose-500 font-semibold hover:bg-rose-600"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
