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
  Check,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
  User,
  UserCog,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type VendorStatus = "PENDING" | "APPROVED" | "REJECTED";

type Vendor = {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  status: VendorStatus;
  rejectionReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
};

type VendorListResponse = {
  total: number;
  vendors: Vendor[];
  take: number;
  skip: number;
};

type ApiErrorResponse = {
  error?: string;
  issues?: Array<{ message?: string }>;
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

function statusBadge(status: VendorStatus): {
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

function pickErrorMessage(input: unknown, fallback: string): string {
  if (!input || typeof input !== "object") return fallback;
  const data = input as ApiErrorResponse;
  return data.issues?.[0]?.message ?? data.error ?? fallback;
}

export function VendorManagement() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<VendorStatus | "ALL">("ALL");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  const [selected, setSelected] = useState<Vendor | null>(null);

  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createStatus, setCreateStatus] = useState<Exclude<VendorStatus, "REJECTED">>("PENDING");

  const [editEmail, setEditEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const [rejectReason, setRejectReason] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status !== "ALL") params.set("status", status);
    if (includeInactive) params.set("includeInactive", "1");
    params.set("take", "100");
    params.set("skip", "0");
    return params.toString();
  }, [q, status, includeInactive]);

  const stats = useMemo(() => {
    const pending = vendors.filter((v) => v.status === "PENDING").length;
    const approved = vendors.filter((v) => v.status === "APPROVED").length;
    const rejected = vendors.filter((v) => v.status === "REJECTED").length;
    const active = vendors.filter((v) => v.isActive).length;
    const inactive = vendors.filter((v) => !v.isActive).length;
    return { total: vendors.length, pending, approved, rejected, active, inactive };
  }, [vendors]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/vendors?${queryString}`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể tải danh sách vendor"));
      }

      const data = (await res.json().catch(() => null)) as VendorListResponse | null;
      setVendors(data?.vendors ?? []);
      setTotal(data?.total ?? 0);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void load();
    }, 250);

    return () => {
      clearTimeout(handle);
    };
  }, [load]);

  const openEdit = (vendor: Vendor) => {
    setSelected(vendor);
    setEditEmail(vendor.email);
    setEditName(vendor.name);
    setEditPhoneNumber(vendor.phoneNumber ?? "");
    setEditAvatarUrl(vendor.avatarUrl ?? "");
    setEditIsActive(Boolean(vendor.isActive));
    setEditOpen(true);
  };

  const openReject = (vendor: Vendor) => {
    setSelected(vendor);
    setRejectReason(vendor.rejectionReason ?? "");
    setRejectOpen(true);
  };

  const approveVendor = async (vendor: Vendor) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể phê duyệt vendor"));
      }

      setSuccessMessage(`Đã phê duyệt vendor ${vendor.name}!`);
      await load();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const rejectVendor = async () => {
    if (!selected) return;

    setErrorMessage(null);
    try {
      const reason = rejectReason.trim();
      if (!reason) {
        setErrorMessage("Vui lòng nhập lý do từ chối");
        return;
      }

      const res = await fetch(`/api/admin/vendors/${selected.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", rejectionReason: reason }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể từ chối vendor"));
      }

      setRejectOpen(false);
      setSelected(null);
      setSuccessMessage("Đã từ chối vendor!");
      await load();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const confirmDeleteVendor = (vendor: Vendor) => {
    setVendorToDelete(vendor);
    setDeleteDialogOpen(true);
  };

  const softDeleteVendor = async () => {
    if (!vendorToDelete) return;

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể xóa mềm vendor"));
      }

      setDeleteDialogOpen(false);
      setVendorToDelete(null);
      setSuccessMessage(`Đã xóa mềm vendor ${vendorToDelete.email}!`);
      await load();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const restoreVendor = async (vendor: Vendor) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể khôi phục vendor"));
      }

      setSuccessMessage(`Đã khôi phục vendor ${vendor.name}!`);
      await load();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const createVendor = async () => {
    setErrorMessage(null);
    try {
      const email = createEmail.trim();
      const name = createName.trim();

      if (!name) {
        setErrorMessage("Tên không được để trống");
        return;
      }

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!email || !isEmail) {
        setErrorMessage("Email không đúng định dạng");
        return;
      }

      if (!createPassword || createPassword.length < 8) {
        setErrorMessage("Mật khẩu phải có ít nhất 8 ký tự");
        return;
      }

      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, name, password: createPassword, status: createStatus }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể tạo vendor"));
      }

      setCreateOpen(false);
      setCreateEmail("");
      setCreateName("");
      setCreatePassword("");
      setCreateStatus("PENDING");
      setSuccessMessage("Đã tạo vendor thành công!");
      await load();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const saveEdit = async () => {
    if (!selected) return;

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/vendors/${selected.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: editEmail.trim(),
          name: editName.trim(),
          phoneNumber: editPhoneNumber.trim() ? editPhoneNumber.trim() : null,
          avatarUrl: editAvatarUrl.trim() ? editAvatarUrl.trim() : null,
          isActive: editIsActive,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể cập nhật vendor"));
      }

      setEditOpen(false);
      setSelected(null);
      setSuccessMessage("Đã cập nhật vendor thành công!");
      await load();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-lg shadow-orange-100/50 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 shadow-lg shadow-orange-500/30">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Quản lý Vendor
              </h1>
              <p className="text-xs text-slate-500">
                Phê duyệt, quản lý tài khoản vendor và theo dõi hoạt động
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-xl"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Thêm vendor
          </button>

          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:border-orange-300 hover:bg-orange-50"
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/50">
              <User className="h-5 w-5 text-slate-600" />
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

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-100 p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Active
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.active}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-200/50">
              <Eye className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Inactive
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-700">{stats.inactive}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/50">
              <EyeOff className="h-5 w-5 text-slate-500" />
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
            onClick={() => setStatus("ALL")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              status === "ALL"
                ? "bg-slate-800 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <User className="h-3 w-3" />
            Tất cả ({total})
          </button>
          <button
            type="button"
            onClick={() => setStatus("PENDING")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              status === "PENDING"
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
            onClick={() => setStatus("APPROVED")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              status === "APPROVED"
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            Đã duyệt
          </button>
          <button
            type="button"
            onClick={() => setStatus("REJECTED")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              status === "REJECTED"
                ? "bg-rose-500 text-white shadow-md"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <ShieldX className="h-3 w-3" />
            Đã từ chối
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo email hoặc tên..."
              className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:bg-white focus:ring-2"
            />
          </div>

          <label className="flex h-12 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm text-slate-700 transition-all hover:border-orange-300 hover:bg-orange-50">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-2 focus:ring-orange-500"
            />
            Hiện vendor đã xóa mềm
          </label>
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

      {/* Vendor List */}
      {isLoading && vendors.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50">
          <div className="text-center">
            <RefreshCw className="mx-auto h-12 w-12 animate-spin text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-600">Đang tải...</p>
          </div>
        </div>
      ) : vendors.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
          <User className="h-16 w-16 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-600">
            {q.trim() || status !== "ALL" ? "Không tìm thấy vendor nào" : "Chưa có vendor nào"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {q.trim() || status !== "ALL"
              ? "Thử thay đổi điều kiện tìm kiếm"
              : "Bắt đầu thêm vendor để quản lý"}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Mobile Card View */}
          <div className="divide-y divide-slate-100 md:hidden">
            {vendors.map((vendor) => {
              const badge = statusBadge(vendor.status);
              return (
                <div key={vendor.id} className="p-4 space-y-3 transition-colors hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-600 text-lg font-bold text-white shadow-lg shadow-orange-500/30">
                      {vendor.name?.trim()?.slice(0, 1)?.toUpperCase() ?? "V"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-800 truncate">
                          {vendor.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{vendor.email}</p>
                      {vendor.phoneNumber ? (
                        <p className="text-xs text-slate-500">{vendor.phoneNumber}</p>
                      ) : null}
                    </div>
                  </div>

                  {vendor.status === "REJECTED" && vendor.rejectionReason ? (
                    <div className="rounded-xl bg-rose-50 p-2 text-xs text-rose-700">
                      <ShieldX className="mr-1 inline h-3 w-3" />
                      {vendor.rejectionReason}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <span className="text-slate-500">Tạo:</span>{" "}
                      <span className="font-medium text-slate-700">
                        {formatDate(vendor.createdAt)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <span className="text-slate-500">Login:</span>{" "}
                      <span className="font-medium text-slate-700">
                        {formatDate(vendor.lastLogin)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:border-orange-300 hover:bg-orange-50"
                      onClick={() => openEdit(vendor)}
                    >
                      <UserCog className="h-3.5 w-3.5" />
                      Sửa
                    </button>

                    {vendor.status !== "APPROVED" ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                        onClick={() => void approveVendor(vendor)}
                        disabled={isLoading}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Duyệt
                      </button>
                    ) : null}

                    {vendor.status !== "REJECTED" ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
                        onClick={() => openReject(vendor)}
                        disabled={isLoading}
                      >
                        <ShieldX className="h-3.5 w-3.5" />
                        Từ chối
                      </button>
                    ) : null}

                    {vendor.isActive ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100"
                        onClick={() => confirmDeleteVendor(vendor)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa mềm
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                        onClick={() => void restoreVendor(vendor)}
                        disabled={isLoading}
                      >
                        Khôi phục
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-orange-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Hoạt động</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4">Duyệt lúc</th>
                  <th className="px-6 py-4">Lần đăng nhập</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((vendor) => {
                  const badge = statusBadge(vendor.status);

                  return (
                    <tr
                      key={vendor.id}
                      className="transition-colors hover:bg-orange-50/50 align-top"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-600 text-base font-bold text-white shadow-lg shadow-orange-500/30">
                            {vendor.name?.trim()?.slice(0, 1)?.toUpperCase() ?? "V"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800">{vendor.name}</p>
                            <p className="text-xs text-slate-600 truncate">{vendor.email}</p>
                            {vendor.phoneNumber ? (
                              <p className="text-xs text-slate-500">{vendor.phoneNumber}</p>
                            ) : null}
                            {vendor.status === "REJECTED" && vendor.rejectionReason ? (
                              <p className="mt-1 line-clamp-2 text-xs text-rose-600">
                                <ShieldX className="mr-1 inline h-3 w-3" />
                                {vendor.rejectionReason}
                              </p>
                            ) : null}
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
                        {vendor.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                            <Eye className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                            <EyeOff className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(vendor.createdAt)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(vendor.approvedAt)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(vendor.lastLogin)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:border-orange-300 hover:bg-orange-50"
                            onClick={() => openEdit(vendor)}
                          >
                            <UserCog className="h-3.5 w-3.5" />
                            Sửa
                          </button>

                          {vendor.status !== "APPROVED" ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                              onClick={() => void approveVendor(vendor)}
                              disabled={isLoading}
                              title="Phê duyệt và gửi email"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Duyệt
                            </button>
                          ) : null}

                          {vendor.status !== "REJECTED" ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
                              onClick={() => openReject(vendor)}
                              disabled={isLoading}
                              title="Từ chối và gửi email"
                            >
                              <ShieldX className="h-3.5 w-3.5" />
                              Từ chối
                            </button>
                          ) : null}

                          {vendor.isActive ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100"
                              onClick={() => confirmDeleteVendor(vendor)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Xóa mềm
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                              onClick={() => void restoreVendor(vendor)}
                              disabled={isLoading}
                            >
                              Khôi phục
                            </button>
                          )}
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

      {/* Create Modal */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur px-6 py-4">
              <h2 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Thêm Vendor Mới
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="create-email"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="create-email"
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:bg-white focus:ring-2"
                      placeholder="vendor@foodstreet.vn"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-name"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Tên hiển thị <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="create-name"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:bg-white focus:ring-2"
                      placeholder="Gian hàng A"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="create-password"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Mật khẩu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="create-password"
                      type="password"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:bg-white focus:ring-2"
                      placeholder="••••••••"
                    />
                    <p className="mt-1 text-xs text-slate-500">Tối thiểu 8 ký tự</p>
                  </div>
                  <div>
                    <label
                      htmlFor="create-status"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Trạng thái
                    </label>
                    <select
                      id="create-status"
                      value={createStatus}
                      onChange={(e) =>
                        setCreateStatus(e.target.value as Exclude<VendorStatus, "REJECTED">)
                      }
                      className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:ring-2"
                    >
                      <option value="PENDING">Pending (chờ duyệt)</option>
                      <option value="APPROVED">Approved (duyệt ngay + gửi email)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                className="rounded-2xl border-2 border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100"
                onClick={() => setCreateOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 disabled:opacity-50"
                onClick={() => void createVendor()}
                disabled={isLoading}
              >
                Tạo vendor
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Modal */}
      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur px-6 py-4">
              <h2 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Sửa Thông Tin Vendor
              </h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-email"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:bg-white focus:ring-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-name"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Tên hiển thị
                    </label>
                    <input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:bg-white focus:ring-2"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-phone"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Số điện thoại
                    </label>
                    <input
                      id="edit-phone"
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                      className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:bg-white focus:ring-2"
                      placeholder="(tuỳ chọn)"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-avatar"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Avatar URL
                    </label>
                    <input
                      id="edit-avatar"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-orange-500 transition-all focus:border-orange-400 focus:bg-white focus:ring-2"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <label
                  htmlFor="edit-active"
                  className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-orange-300 hover:bg-orange-50"
                >
                  <input
                    id="edit-active"
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-orange-500 focus:ring-2 focus:ring-orange-500"
                  />
                  Tài khoản hoạt động (có thể đăng nhập)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                className="rounded-2xl border-2 border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100"
                onClick={() => setEditOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 disabled:opacity-50"
                onClick={() => void saveEdit()}
                disabled={isLoading}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reject Modal */}
      {rejectOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-red-600 shadow-lg shadow-rose-500/30">
                  <ShieldX className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-rose-600">Từ Chối Vendor</h2>
              </div>
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">
                Nhập lý do từ chối. Hệ thống sẽ gửi email thông báo cho vendor.
              </p>

              <div>
                <label
                  htmlFor="reject-reason"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Lý do từ chối <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="min-h-[120px] w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-rose-500 transition-all focus:border-rose-400 focus:bg-white focus:ring-2"
                  placeholder="Ví dụ: Thiếu thông tin giấy phép kinh doanh, thông tin không chính xác..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                className="rounded-2xl border-2 border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100"
                onClick={() => setRejectOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-105 disabled:opacity-50"
                onClick={() => void rejectVendor()}
                disabled={isLoading}
              >
                Từ chối vendor
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Xác nhận xóa mềm?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Vendor <strong>{vendorToDelete?.email}</strong> sẽ không thể đăng nhập vào hệ thống.
              Bạn có thể khôi phục lại sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={softDeleteVendor}
              className="rounded-2xl bg-rose-500 font-semibold hover:bg-rose-600"
            >
              Xóa mềm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
