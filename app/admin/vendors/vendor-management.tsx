"use client";

import { Plus, RefreshCw, Search, ShieldCheck, ShieldX, Trash2, UserCog } from "lucide-react";
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
  return date.toLocaleString();
}

function statusBadge(status: VendorStatus): { label: string; className: string } {
  switch (status) {
    case "APPROVED":
      return { label: "Approved", className: "bg-emerald-100 text-emerald-700" };
    case "REJECTED":
      return { label: "Rejected", className: "bg-rose-100 text-rose-700" };
    default:
      return { label: "Pending", className: "bg-amber-100 text-amber-700" };
  }
}

function pickErrorMessage(input: unknown, fallback: string): string {
  if (!input || typeof input !== "object") return fallback;
  const data = input as ApiErrorResponse;
  return data.issues?.[0]?.message ?? data.error ?? fallback;
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
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
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
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function VendorManagement() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<VendorStatus | "ALL">("ALL");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

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

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/vendors?${queryString}`, { method: "GET" });
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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể phê duyệt vendor"));
      }

      await load();
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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", rejectionReason: reason }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể từ chối vendor"));
      }

      setRejectOpen(false);
      setSelected(null);
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const softDeleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Xóa mềm vendor ${vendor.email}? (Vendor sẽ không đăng nhập được)`)) return;

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể xóa mềm vendor"));
      }

      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const restoreVendor = async (vendor: Vendor) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickErrorMessage(data, "Không thể khôi phục vendor"));
      }

      await load();
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
      await load();
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
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Vendor</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem danh sách vendor, phê duyệt / từ chối, sửa thông tin và xóa mềm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Thêm vendor
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => void load()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo email hoặc tên..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none ring-orange-500 transition focus:ring-2"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as VendorStatus | "ALL")}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-orange-500 transition focus:ring-2"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          Hiện vendor đã xóa mềm
        </label>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Danh sách vendor ({total})</h2>
          <span className="text-xs text-slate-500">{isLoading ? "Đang tải..." : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Hoạt động</th>
                <th className="px-4 py-3">Tạo lúc</th>
                <th className="px-4 py-3">Duyệt lúc</th>
                <th className="px-4 py-3">Lần đăng nhập</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={7}>
                    Không có vendor phù hợp.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => {
                  const badge = statusBadge(vendor.status);

                  return (
                    <tr key={vendor.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-600">
                            {vendor.name?.trim()?.slice(0, 1)?.toUpperCase() ?? "V"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{vendor.name}</p>
                            <p className="text-xs text-slate-500">{vendor.email}</p>
                            {vendor.status === "REJECTED" && vendor.rejectionReason ? (
                              <p className="mt-1 text-xs text-rose-600">
                                Lý do: {vendor.rejectionReason}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {vendor.isActive ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(vendor.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(vendor.approvedAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(vendor.lastLogin)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => openEdit(vendor)}
                          >
                            <UserCog className="h-3.5 w-3.5" />
                            Sửa
                          </button>

                          {vendor.status !== "APPROVED" ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
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
                              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
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
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                              onClick={() => void softDeleteVendor(vendor)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Xóa mềm
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={createOpen} title="Thêm vendor" onClose={() => setCreateOpen(false)}>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="create-email" className="text-xs font-semibold text-slate-600">
                Email
              </label>
              <input
                id="create-email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
                placeholder="vendor@foodstreet.vn"
              />
            </div>
            <div>
              <label htmlFor="create-name" className="text-xs font-semibold text-slate-600">
                Tên hiển thị
              </label>
              <input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
                placeholder="Gian hàng A"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="create-password" className="text-xs font-semibold text-slate-600">
                Mật khẩu
              </label>
              <input
                id="create-password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="create-status" className="text-xs font-semibold text-slate-600">
                Trạng thái
              </label>
              <select
                id="create-status"
                value={createStatus}
                onChange={(e) =>
                  setCreateStatus(e.target.value as Exclude<VendorStatus, "REJECTED">)
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-orange-500 focus:ring-2"
              >
                <option value="PENDING">Pending (chờ duyệt)</option>
                <option value="APPROVED">Approved (duyệt ngay + gửi email)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
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
              onClick={() => void createVendor()}
              disabled={isLoading}
            >
              Tạo
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} title="Sửa vendor" onClose={() => setEditOpen(false)}>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="edit-email" className="text-xs font-semibold text-slate-600">
                Email
              </label>
              <input
                id="edit-email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="edit-name" className="text-xs font-semibold text-slate-600">
                Tên hiển thị
              </label>
              <input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="edit-phone" className="text-xs font-semibold text-slate-600">
                Số điện thoại
              </label>
              <input
                id="edit-phone"
                value={editPhoneNumber}
                onChange={(e) => setEditPhoneNumber(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
                placeholder="(tuỳ chọn)"
              />
            </div>
            <div>
              <label htmlFor="edit-avatar" className="text-xs font-semibold text-slate-600">
                Avatar URL
              </label>
              <input
                id="edit-avatar"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
                placeholder="https://..."
              />
            </div>
          </div>

          <label htmlFor="edit-active" className="flex items-center gap-2 text-sm text-slate-700">
            <input
              id="edit-active"
              type="checkbox"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
            />
            Tài khoản hoạt động
          </label>

          <div className="flex items-center justify-end gap-2">
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
              disabled={isLoading}
            >
              Lưu
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={rejectOpen} title="Từ chối vendor" onClose={() => setRejectOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Nhập lý do từ chối. Hệ thống sẽ gửi email cho vendor.
          </p>

          <div>
            <label htmlFor="reject-reason" className="text-xs font-semibold text-slate-600">
              Lý do
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-1 min-h-[96px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
              placeholder="Ví dụ: Thiếu thông tin giấy phép kinh doanh..."
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setRejectOpen(false)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
              onClick={() => void rejectVendor()}
              disabled={isLoading}
            >
              Từ chối
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
