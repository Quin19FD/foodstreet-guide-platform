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
  AlertCircle,
  Badge,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  Image as ImageIcon,
  Lock,
  MapPin,
  Menu,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Unlock,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getPoiQrInfo } from "@/shared/utils/poi-qr";

type PoiStatus = "PENDING" | "APPROVED" | "REJECTED";

type Poi = {
  id: string;
  name: string;
  category?: string | null;
  status: PoiStatus;
  isActive?: boolean;
  rejectionReason?: string | null;
  updatedAt: string;
  owner: {
    id: string;
    email: string;
    name: string;
  };
  translations: Array<{
    id: string;
    language: string;
    name?: string | null;
    description?: string | null;
    audios?: Array<{ id: string; audioUrl: string }>;
  }>;
  images: Array<{ id: string; imageUrl: string; description?: string | null }>;
  menuItems: Array<{ id: string; name?: string | null; price?: number | null }>;
};

type PoiListResponse = {
  total: number;
  pois: Poi[];
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pickError(input: unknown, fallback: string): string {
  if (!input || typeof input !== "object") return fallback;
  const maybe = input as {
    error?: string;
    issues?: Array<{ message?: string }>;
  };
  return maybe.issues?.[0]?.message ?? maybe.error ?? fallback;
}

function statusBadge(status: PoiStatus): {
  label: string;
  className: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case "APPROVED":
      return {
        label: "Đã duyệt",
        className: "bg-emerald-100 text-emerald-700",
        icon: <ShieldCheck className="h-3 w-3" />,
      };
    case "REJECTED":
      return {
        label: "Đã từ chối",
        className: "bg-rose-100 text-rose-700",
        icon: <ShieldX className="h-3 w-3" />,
      };
    default:
      return {
        label: "Chờ duyệt",
        className: "bg-amber-100 text-amber-700",
        icon: <Badge className="h-3 w-3" />,
      };
  }
}

export function AdminPoiManagement() {
  const router = useRouter();
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PoiStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [poiToReject, setPoiToReject] = useState<Poi | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        take: "100",
        skip: "0",
        includeLocked: "1",
      });
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/pois?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });
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
  }, [statusFilter]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void load();
    }, 200);
    return () => clearTimeout(handle);
  }, [load]);

  const filteredPois = useMemo(() => {
    if (!searchQuery.trim()) return pois;
    const query = searchQuery.toLowerCase();
    return pois.filter(
      (poi) =>
        poi.name.toLowerCase().includes(query) ||
        poi.category?.toLowerCase().includes(query) ||
        poi.owner.name.toLowerCase().includes(query) ||
        poi.owner.email.toLowerCase().includes(query)
    );
  }, [pois, searchQuery]);

  const stats = useMemo(() => {
    const pending = pois.filter((poi) => poi.status === "PENDING").length;
    const approved = pois.filter((poi) => poi.status === "APPROVED").length;
    const rejected = pois.filter((poi) => poi.status === "REJECTED").length;
    const locked = pois.filter((poi) => poi.isActive === false).length;
    const withImages = pois.filter((poi) => poi.images.length > 0).length;
    const withMenu = pois.filter((poi) => poi.menuItems.length > 0).length;
    return {
      total: pois.length,
      pending,
      approved,
      rejected,
      locked,
      withImages,
      withMenu,
    };
  }, [pois]);

  const approvePoi = async (poi: Poi) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/pois/${poi.id}/decision`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "APPROVE" }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể duyệt POI"));
      }

      setSuccessMessage(`Đã duyệt POI ${poi.name}!`);
      await load();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const openReject = (poi: Poi) => {
    setPoiToReject(poi);
    setRejectionReason(poi.rejectionReason ?? "");
    setRejectDialogOpen(true);
  };

  const rejectPoi = async () => {
    if (!poiToReject) return;

    const trimmed = rejectionReason.trim();
    if (!trimmed) {
      setErrorMessage("Vui lòng nhập lý do từ chối");
      return;
    }

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/pois/${poiToReject.id}/decision`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision: "REJECT",
          rejectionReason: trimmed,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể từ chối POI"));
      }

      setRejectDialogOpen(false);
      setPoiToReject(null);
      setSuccessMessage("Đã từ chối POI!");
      await load();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const lockPoi = async (poi: Poi) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/pois/${poi.id}/lock`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể khóa POI"));
      }
      setSuccessMessage(`Đã khóa POI ${poi.name}!`);
      await load();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const unlockPoi = async (poi: Poi) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/pois/${poi.id}/unlock`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể mở khóa POI"));
      }
      setSuccessMessage(`Đã mở khóa POI ${poi.name}!`);
      await load();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const openPoiQr = (poi: Poi) => {
    const qr = getPoiQrInfo(poi.id, 420);
    if (!qr) {
      setErrorMessage("Không thể tạo QR cho POI này.");
      return;
    }
    window.open(qr.imageUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-6 shadow-lg shadow-teal-100/50 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-teal-500/30">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Quản lý POI
              </h1>
              <p className="text-xs text-slate-500">
                Duyệt, từ chối, khóa/mở khóa điểm ẩm thực đường phố
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:border-teal-300 hover:bg-teal-50"
            onClick={() => void load()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tổng POI
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/50">
              <MapPin className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-100 p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Chờ duyệt
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{stats.pending}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200/50">
              <Badge className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-100 p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Đã duyệt
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.approved}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-200/50">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-100 p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                Đã từ chối
              </p>
              <p className="mt-1 text-2xl font-bold text-rose-700">{stats.rejected}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-200/50">
              <ShieldX className="h-5 w-5 text-rose-600" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Đang khóa
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-700">{stats.locked}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/50">
              <Lock className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Có ảnh/menu
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-700">
                {stats.withImages}/{stats.withMenu}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-200/50">
              <ImageIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "ALL"
                ? "bg-slate-800 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <MapPin className="h-3 w-3" />
            Tất cả ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "PENDING"
                ? "bg-amber-500 text-white shadow-md"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <Badge className="h-3 w-3" />
            Chờ duyệt
            {stats.pending > 0 ? (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                {stats.pending}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("APPROVED")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "APPROVED"
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            Đã duyệt
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("REJECTED")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "REJECTED"
                ? "bg-rose-500 text-white shadow-md"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <ShieldX className="h-3 w-3" />
            Đã từ chối
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, danh mục, vendor..."
            className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none ring-teal-500 transition-all focus:border-teal-400 focus:bg-white focus:ring-2"
          />
        </div>
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

      {/* POI List */}
      {isLoading && pois.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50">
          <div className="text-center">
            <RefreshCw className="mx-auto h-12 w-12 animate-spin text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-600">Đang tải...</p>
          </div>
        </div>
      ) : filteredPois.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
          <MapPin className="h-16 w-16 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-600">
            {searchQuery.trim() || statusFilter !== "ALL"
              ? "Không tìm thấy POI nào"
              : "Chưa có POI nào"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {searchQuery.trim() || statusFilter !== "ALL"
              ? "Thử thay đổi điều kiện tìm kiếm"
              : "Vendor sẽ tạo POI khi đăng ký"}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Mobile Card View */}
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredPois.map((poi) => {
              const badge = statusBadge(poi.status);
              return (
                <div key={poi.id} className="p-4 space-y-3 transition-colors hover:bg-teal-50/50">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 text-lg font-bold text-white shadow-lg shadow-teal-500/30">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-bold text-slate-800">{poi.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{poi.category ?? "Chưa phân loại"}</p>

                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                        <User className="h-3 w-3" />
                        <span className="font-medium">{poi.owner.name}</span>
                        <span className="text-slate-400">({poi.owner.email})</span>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-3 text-xs">
                        <div className="flex items-center gap-1 text-slate-600">
                          <ImageIcon className="h-3 w-3" />
                          <span>{poi.images.length} ảnh</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Menu className="h-3 w-3" />
                          <span>{poi.menuItems.length} món</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {poi.status === "REJECTED" && poi.rejectionReason ? (
                    <div className="rounded-xl bg-rose-50 p-2 text-xs text-rose-700">
                      <ShieldX className="mr-1 inline h-3 w-3" />
                      {poi.rejectionReason}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {poi.status !== "APPROVED" ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                        onClick={() => void approvePoi(poi)}
                        disabled={isLoading}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Duyệt
                      </button>
                    ) : null}

                    {poi.status !== "REJECTED" ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
                        onClick={() => openReject(poi)}
                        disabled={isLoading}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Từ chối
                      </button>
                    ) : null}

                    {poi.isActive === false ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                        onClick={() => void unlockPoi(poi)}
                        disabled={isLoading}
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Mở khóa
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100"
                        onClick={() => void lockPoi(poi)}
                        disabled={isLoading}
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Khóa
                      </button>
                    )}

                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition-all hover:bg-violet-100"
                      onClick={() => openPoiQr(poi)}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      QR
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:border-teal-300 hover:bg-teal-50"
                      onClick={() => router.push(`/admin/pois/${poi.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-teal-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-6 py-4">Điểm ẩm thực (POI)</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Khóa/Mở</th>
                  <th className="px-6 py-4">Cập nhật</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPois.map((poi) => {
                  const badge = statusBadge(poi.status);

                  return (
                    <tr key={poi.id} className="transition-colors hover:bg-teal-50/50 align-top">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-teal-500/30">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800">{poi.name}</p>
                            <p className="text-xs text-slate-600">
                              {poi.category ?? "Chưa phân loại"}
                            </p>
                            {poi.status === "REJECTED" && poi.rejectionReason ? (
                              <p className="mt-1 line-clamp-2 text-xs text-rose-600">
                                <ShieldX className="mr-1 inline h-3 w-3" />
                                {poi.rejectionReason}
                              </p>
                            ) : null}
                            <div className="mt-2 flex gap-3 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" />
                                <span>{poi.images.length} ảnh</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Menu className="h-3 w-3" />
                                <span>{poi.menuItems.length} món</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                            <User className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{poi.owner.name}</p>
                            <p className="text-xs text-slate-500">{poi.owner.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${badge.className}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {poi.isActive === false ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                            <Lock className="h-3 w-3" />
                            Đang khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                            <Unlock className="h-3 w-3" />
                            Đang mở
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(poi.updatedAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {poi.status !== "APPROVED" ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                              onClick={() => void approvePoi(poi)}
                              disabled={isLoading}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Duyệt
                            </button>
                          ) : null}

                          {poi.status !== "REJECTED" ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
                              onClick={() => openReject(poi)}
                              disabled={isLoading}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Từ chối
                            </button>
                          ) : null}

                          {poi.isActive === false ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                              onClick={() => void unlockPoi(poi)}
                              disabled={isLoading}
                            >
                              <Unlock className="h-3.5 w-3.5" />
                              Mở
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100"
                              onClick={() => void lockPoi(poi)}
                              disabled={isLoading}
                            >
                              <Lock className="h-3.5 w-3.5" />
                              Khóa
                            </button>
                          )}

                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition-all hover:bg-violet-100"
                            onClick={() => openPoiQr(poi)}
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            QR
                          </button>

                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:border-teal-300 hover:bg-teal-50"
                            onClick={() => router.push(`/admin/pois/${poi.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Từ chối POI?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              POI <strong>{poiToReject?.name}</strong> sẽ bị từ chối và vendor sẽ cần chỉnh sửa lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label
              htmlFor="rejection-reason"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Lý do từ chối <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="h-32 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 text-sm outline-none ring-rose-500 transition-all focus:border-rose-400 focus:bg-white focus:ring-2"
              placeholder="Ví dụ: Thông tin không chính xác, hình ảnh không rõ, thiếu thông tin liên hệ..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-2xl"
              onClick={() => {
                setRejectDialogOpen(false);
                setPoiToReject(null);
                setRejectionReason("");
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={rejectPoi}
              className="rounded-2xl bg-rose-500 font-semibold hover:bg-rose-600"
            >
              Từ chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
