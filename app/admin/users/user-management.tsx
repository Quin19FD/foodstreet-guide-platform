"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Badge,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  ShieldX,
  Trash2,
  User,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

type UserRole = "USER" | "VENDOR" | "ADMIN";
type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

type UserInfo = {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  rejectionReason: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    pois: number;
    reviews: number;
    favoritePois: number;
  };
};

type UsersResponse = {
  total: number;
  users: UserInfo[];
  take: number;
  skip: number;
};

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

export default function UserManagement() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentTab, setCurrentTab] = useState<string>("all");

  // Pagination
  const [take] = useState(20);
  const [skip, setSkip] = useState(0);

  // Dialogs
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Calculate stats
  const stats = useMemo(() => {
    const pending = users.filter((u) => u.status === "PENDING").length;
    const approved = users.filter((u) => u.status === "APPROVED").length;
    const rejected = users.filter((u) => u.status === "REJECTED").length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = users.filter((u) => !u.isActive).length;
    const vendors = users.filter((u) => u.role === "VENDOR").length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const regularUsers = users.filter((u) => u.role === "USER").length;

    return {
      total: users.length,
      pending,
      approved,
      rejected,
      active,
      inactive,
      vendors,
      admins,
      regularUsers,
    };
  }, [users]);

  // Filter users based on tab
  const filteredUsers = useMemo(() => {
    if (currentTab === "all") return users;
    if (currentTab === "pending") return users.filter((u) => u.status === "PENDING");
    if (currentTab === "vendors") return users.filter((u) => u.role === "VENDOR");
    if (currentTab === "admins") return users.filter((u) => u.role === "ADMIN");
    if (currentTab === "regular") return users.filter((u) => u.role === "USER");
    return users;
  }, [users, currentTab]);

  // Load users
  const loadUsers = async () => {
    setIsLoading(true);
    setAlert(null);

    try {
      const params = new URLSearchParams({
        take: String(take),
        skip: String(skip),
        ...(search ? { q: search } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        includeInactive: "1",
      });

      const res = await fetch(`/api/admin/users?${params}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Không thể tải danh sách users");
      }

      const data = (await res.json()) as UsersResponse;
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error("Error loading users:", error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể tải danh sách users",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [take, skip, roleFilter, statusFilter]);

  // Handle search
  const handleSearch = () => {
    setSkip(0);
    loadUsers();
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  // Handle select one
  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Handle bulk action
  const handleBulkAction = async (action: "activate" | "deactivate" | "approve" | "reject") => {
    if (selectedIds.size === 0) {
      setAlert({ type: "error", message: "Vui lòng chọn ít nhất một user" });
      return;
    }

    if (action === "reject" && !rejectionReason.trim()) {
      setRejectDialogOpen(true);
      return;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action,
          ...(action === "reject" ? { rejectionReason } : {}),
        }),
      });

      if (!res.ok) {
        const error = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(error?.error || "Không thể thực hiện hành động");
      }

      const data = (await res.json()) as { ok: boolean; message: string; updated: number };
      setAlert({ type: "success", message: data.message });
      setSelectedIds(new Set());
      setRejectionReason("");
      setRejectDialogOpen(false);
      await loadUsers();
    } catch (error) {
      console.error("Error performing bulk action:", error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể thực hiện hành động",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      setAlert({ type: "error", message: "Vui lòng chọn ít nhất một user" });
      return;
    }

    if (
      !confirm(
        `Bạn có chắc muốn xóa ${selectedIds.size} user không? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const error = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(error?.error || "Không thể xóa users");
      }

      const data = (await res.json()) as { ok: boolean; message: string; deleted: number };
      setAlert({ type: "success", message: data.message });
      setSelectedIds(new Set());
      await loadUsers();
    } catch (error) {
      console.error("Error deleting users:", error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể xóa users",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "VENDOR":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "USER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            alert.type === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-medium">{alert.message}</p>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="text-current/70 hover:text-current transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-slate-200 p-2">
              <User className="h-4 w-4 text-slate-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-600">Tổng Users</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-orange-200 p-2">
              <Building2 className="h-4 w-4 text-orange-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-900">{stats.vendors}</p>
              <p className="text-xs text-orange-700">Vendors</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-200 p-2">
              <User className="h-4 w-4 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{stats.regularUsers}</p>
              <p className="text-xs text-blue-700">Users</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-200 p-2">
              <Shield className="h-4 w-4 text-purple-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">{stats.admins}</p>
              <p className="text-xs text-purple-700">Admins</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-green-200 p-2">
              <CheckCircle2 className="h-4 w-4 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
              <p className="text-xs text-green-700">Đã duyệt</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-200 p-2">
              <Badge className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
              <p className="text-xs text-amber-700">Chờ duyệt</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-rose-200 p-2">
              <ShieldX className="h-4 w-4 text-rose-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-900">{stats.rejected}</p>
              <p className="text-xs text-rose-700">Đã từ chối</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-cyan-200 p-2">
              <UserCheck className="h-4 w-4 text-cyan-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-900">{stats.active}</p>
              <p className="text-xs text-cyan-700">Hoạt động</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo email, tên, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              Tìm kiếm
            </button>
            <button
              onClick={() => {
                setSearch("");
                setRoleFilter("");
                setStatusFilter("");
                setSkip(0);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Đặt lại
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={() => handleBulkAction("activate")}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                >
                  <UserCheck className="h-3.5 w-3.5" /> Kích hoạt
                </button>
                <button
                  onClick={() => handleBulkAction("deactivate")}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                >
                  <UserX className="h-3.5 w-3.5" /> Vô hiệu
                </button>
                <button
                  onClick={() => handleBulkAction("approve")}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
                </button>
                <button
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
                >
                  <ShieldX className="h-3.5 w-3.5" /> Từ chối
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa
                </button>
              </>
            )}
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="rounded-lg border border-slate-300 p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Role & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setSkip(0);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Tất cả vai trò</option>
            <option value="USER">USER</option>
            <option value="VENDOR">VENDOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setSkip(0);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          {selectedIds.size > 0 && (
            <span className="ml-auto text-sm text-slate-600">
              Đã chọn <strong>{selectedIds.size}</strong> user
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setCurrentTab("all")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            currentTab === "all"
              ? "border-b-2 border-blue-600 text-blue-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setCurrentTab("vendors")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            currentTab === "vendors"
              ? "border-b-2 border-orange-600 text-orange-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Vendors
        </button>
        <button
          onClick={() => setCurrentTab("admins")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            currentTab === "admins"
              ? "border-b-2 border-purple-600 text-purple-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Admins
        </button>
        <button
          onClick={() => setCurrentTab("regular")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            currentTab === "regular"
              ? "border-b-2 border-blue-600 text-blue-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setCurrentTab("pending")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            currentTab === "pending"
              ? "border-b-2 border-amber-600 text-amber-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Chờ duyệt
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                Vai trò
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                POIs
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                Reviews
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                Lần đăng nhập
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                Ngày tạo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading && filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                  Đang tải...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                  Không tìm thấy user nào
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`transition-colors ${
                    selectedIds.has(user.id) ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => handleSelectOne(user.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name || user.email}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{user.name || "Chưa đặt tên"}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                        {user.phoneNumber && (
                          <p className="text-xs text-slate-400">{user.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role}
                    </span>
                    {!user.isActive && (
                      <span className="ml-2 text-xs text-slate-400">(đã khóa)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeColor(user.status)}`}
                    >
                      {user.status}
                    </span>
                    {user.status === "REJECTED" && user.rejectionReason && (
                      <p className="mt-1 text-xs text-rose-600">{user.rejectionReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{user._count.pois}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{user._count.reviews}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString("vi-VN")
                      : "Chưa đăng nhập"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Hiển thị <strong>{filteredUsers.length}</strong> trong tổng <strong>{total}</strong> users
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSkip(Math.max(0, skip - take))}
            disabled={skip === 0 || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Trang trước
          </button>
          <button
            onClick={() => setSkip(skip + take)}
            disabled={skip + take >= total || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Trang sau <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Reject Dialog */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Từ chối users</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn đang từ chối <strong>{selectedIds.size}</strong> user. Vui lòng nhập lý do:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Lý do từ chối..."
              rows={3}
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleBulkAction("reject")}
                disabled={!rejectionReason.trim() || isLoading}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
