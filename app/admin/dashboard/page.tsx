"use client";

"use client";

/**
 * Admin Dashboard Page
 *
 * Main dashboard for admin users.
 */

import { AdminLayout } from "@/components/layouts/admin-layout";
import {
  AlertCircle,
  Badge,
  Bell,
  Building2,
  Check,
  CircleDollarSign,
  Eye,
  Headphones,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type DashboardStats = {
  totalPOIs: number;
  pendingPOIs: number;
  approvedPOIs: number;
  totalTours: number;
  activeTours: number;
  totalUsers: number;
  totalVendors: number;
  totalAudioGuides: number;
  totalTranslations: number;
};

type RecentActivity = {
  id: string;
  type: "poi" | "tour" | "user" | "vendor";
  name: string;
  category?: string;
  status: string;
  updatedAt: string;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPOIs: 0,
    pendingPOIs: 0,
    approvedPOIs: 0,
    totalTours: 0,
    activeTours: 0,
    totalUsers: 0,
    totalVendors: 0,
    totalAudioGuides: 0,
    totalTranslations: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Fetch all data in parallel
      const [poisRes, toursRes, usersRes] = await Promise.all([
        fetch("/api/admin/pois?take=100&skip=0&includeLocked=1", {
          method: "GET",
          credentials: "include",
        }),
        fetch("/api/admin/tours?take=100&skip=0", {
          method: "GET",
          credentials: "include",
        }),
        fetch("/api/admin/users?take=100&skip=0", {
          method: "GET",
          credentials: "include",
        }),
      ]);

      // Check if any request failed
      if (!poisRes.ok || !toursRes.ok || !usersRes.ok) {
        throw new Error("Không thể tải dữ liệu dashboard");
      }

      const [poisData, toursData, usersData] = await Promise.all([
        poisRes.json(),
        toursRes.json(),
        usersRes.json(),
      ]);

      const pois = poisData.pois || [];
      const tours = toursData.tours || [];
      const users = usersData.users || [];

      // Calculate stats
      const pendingPOIs = pois.filter((poi: any) => poi.status === "PENDING").length;
      const approvedPOIs = pois.filter((poi: any) => poi.status === "APPROVED").length;
      const activeTours = tours.filter((tour: any) => tour.isActive).length;
      const vendors = users.filter((user: any) => user.role === "VENDOR");

      // Calculate translations and audio guides from POI data
      const totalTranslations = pois.reduce((acc: number, poi: any) => {
        return acc + (poi.translations?.length || 0);
      }, 0);

      const totalAudioGuides = pois.reduce((acc: number, poi: any) => {
        return (
          acc +
          (poi.translations?.reduce((audioAcc: number, t: any) => {
            return audioAcc + (t.audios?.length || 0);
          }, 0) || 0)
        );
      }, 0);

      setStats({
        totalPOIs: poisData.total || pois.length,
        pendingPOIs,
        approvedPOIs,
        totalTours: toursData.total || tours.length,
        activeTours,
        totalUsers: usersData.total || users.length,
        totalVendors: vendors.length,
        totalAudioGuides,
        totalTranslations,
      });

      // Create recent activities from most recently updated items
      const activities: RecentActivity[] = [
        ...pois.slice(0, 3).map((poi: any) => ({
          id: poi.id,
          type: "poi" as const,
          name: poi.name,
          category: poi.category || "Chưa phân loại",
          status: poi.status,
          updatedAt: poi.updatedAt,
        })),
        ...tours.slice(0, 2).map((tour: any) => ({
          id: tour.id,
          type: "tour" as const,
          name: tour.name,
          category: "Tour",
          status: tour.isActive ? "Active" : "Inactive",
          updatedAt: tour.updatedAt,
        })),
      ]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

      setRecentActivities(activities);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải dữ liệu dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (status: string, type: string) => {
    const baseClass = "rounded-full px-2.5 py-1 text-xs font-semibold ";

    if (type === "poi") {
      if (status === "APPROVED") return baseClass + "bg-emerald-100 text-emerald-700";
      if (status === "REJECTED") return baseClass + "bg-rose-100 text-rose-700";
      return baseClass + "bg-amber-100 text-amber-700";
    }

    if (type === "tour") {
      if (status === "Active") return baseClass + "bg-emerald-100 text-emerald-700";
      return baseClass + "bg-slate-100 text-slate-600";
    }

    return baseClass + "bg-slate-100 text-slate-600";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "poi":
        return <MapPin className="h-3 w-3" />;
      case "tour":
        return <CircleDollarSign className="h-3 w-3" />;
      case "user":
        return <Users className="h-3 w-3" />;
      case "vendor":
        return <Building2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-violet-300 hover:shadow-md md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                <Badge className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">
                  Tổng quan hệ thống FoodStreet Guide Platform
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:border-violet-300 hover:bg-violet-50"
              onClick={() => void loadDashboardData()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
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

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-400 hover:shadow-lg hover:shadow-slate-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">
                  Tổng POI
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                  {formatNumber(stats.totalPOIs)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{stats.pendingPOIs} chờ duyệt</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
                <MapPin className="h-6 w-6 text-slate-500 group-hover:text-slate-700 transition-colors" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors">
                  Chờ duyệt
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                  {formatNumber(stats.pendingPOIs)}
                </p>
                <p className="mt-1 text-xs text-slate-500">POI cần duyệt</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-amber-100 transition-colors">
                <ShieldX className="h-6 w-6 text-slate-500 group-hover:text-amber-600 transition-colors" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
                  Đã duyệt
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  {formatNumber(stats.approvedPOIs)}
                </p>
                <p className="mt-1 text-xs text-slate-500">POI active</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-emerald-100 transition-colors">
                <ShieldCheck className="h-6 w-6 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                  Tổng Tour
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {formatNumber(stats.totalTours)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{stats.activeTours} active</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-blue-100 transition-colors">
                <CircleDollarSign className="h-6 w-6 text-slate-500 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
                  Audio Guides
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                  {formatNumber(stats.totalAudioGuides)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatNumber(stats.totalTranslations)} bản dịch
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-purple-100 transition-colors">
                <Headphones className="h-6 w-6 text-slate-500 group-hover:text-purple-600 transition-colors" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-orange-600 transition-colors">
                  Vendors
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                  {formatNumber(stats.totalVendors)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Tài khoản vendor</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-orange-100 transition-colors">
                <Building2 className="h-6 w-6 text-slate-500 group-hover:text-orange-600 transition-colors" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-teal-600 transition-colors">
                  Users
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800 group-hover:text-teal-600 transition-colors">
                  {formatNumber(stats.totalUsers)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Tài khoản người dùng</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-teal-100 transition-colors">
                <Users className="h-6 w-6 text-slate-500 group-hover:text-teal-600 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {/* Quick Actions */}
            <section className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 shadow-md shadow-violet-500/20">
                  <Menu className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Truy cập nhanh</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/admin/pois"
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/20 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-teal-500/30 transition-all group-hover:scale-110 group-hover:rotate-3">
                      <MapPin className="h-7 w-7 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                        Quản lý POI
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">Duyệt, khóa POI</p>
                    </div>
                  </div>
                  <div className="absolute -right-2 -bottom-2 h-16 w-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>

                <Link
                  href="/admin/tours"
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/30 transition-all group-hover:scale-110 group-hover:rotate-3">
                      <CircleDollarSign className="h-7 w-7 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                        Quản lý Tour
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">Tạo tour du lịch</p>
                    </div>
                  </div>
                  <div className="absolute -right-2 -bottom-2 h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>

                <Link
                  href="/admin/media"
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 shadow-lg shadow-violet-500/30 transition-all group-hover:scale-110 group-hover:rotate-3">
                      <Eye className="h-7 w-7 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-800 group-hover:text-violet-700 transition-colors">
                        Media Library
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">Quản lý hình ảnh</p>
                    </div>
                  </div>
                  <div className="absolute -right-2 -bottom-2 h-16 w-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>

                <Link
                  href="/admin/vendors"
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 shadow-lg shadow-orange-500/30 transition-all group-hover:scale-110 group-hover:rotate-3">
                      <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-800 group-hover:text-orange-700 transition-colors">
                        Vendors
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">Phê duyệt vendor</p>
                    </div>
                  </div>
                  <div className="absolute -right-2 -bottom-2 h-16 w-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>

                <Link
                  href="/admin/users"
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-600 shadow-lg shadow-cyan-500/30 transition-all group-hover:scale-110 group-hover:rotate-3">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-800 group-hover:text-cyan-700 transition-colors">
                        Users
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">Quản lý users</p>
                    </div>
                  </div>
                  <div className="absolute -right-2 -bottom-2 h-16 w-16 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>

                <Link
                  href="/admin/audio-guides"
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-pink-400 hover:shadow-lg hover:shadow-pink-500/20 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 shadow-lg shadow-pink-500/30 transition-all group-hover:scale-110 group-hover:rotate-3">
                      <Headphones className="h-7 w-7 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-800 group-hover:text-pink-700 transition-colors">
                        Audio Guides
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">Thuyết minh đa ngôn ngữ</p>
                    </div>
                  </div>
                  <div className="absolute -right-2 -bottom-2 h-16 w-16 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </div>
            </section>

            {/* Recent Activities */}
            <section className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-slate-50 to-violet-50">
                <h2 className="text-base font-bold text-slate-800">Hoạt động gần đây</h2>
                <Link
                  href="/admin/pois"
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                >
                  Xem tất cả
                  <MapPin className="h-3.5 w-3.5" />
                </Link>
              </div>

              {isLoading && recentActivities.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                  <p className="mt-3 text-sm text-slate-500">Đang tải...</p>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center p-8">
                  <Badge className="h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">Chưa có hoạt động nào</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Hoạt động sẽ hiển thị khi có POI hoặc tour được cập nhật
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-6 py-3">Tên</th>
                        <th className="px-6 py-3">Loại</th>
                        <th className="px-6 py-3">Danh mục</th>
                        <th className="px-6 py-3">Trạng thái</th>
                        <th className="px-6 py-3">Cập nhật</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentActivities.map((activity) => (
                        <tr key={activity.id} className="transition-colors hover:bg-violet-50/50">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                                {getTypeIcon(activity.type)}
                              </div>
                              <span className="font-medium text-slate-800">{activity.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {getTypeIcon(activity.type)}
                              {activity.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-600">{activity.category}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(
                                activity.status,
                                activity.type
                              )}`}
                            >
                              {activity.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-500">
                            {formatDate(activity.updatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Pending Approvals Alert */}
            {stats.pendingPOIs > 0 && (
              <section className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-100 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200">
                    <ShieldX className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      {stats.pendingPOIs} POI chờ duyệt
                    </h3>
                    <p className="text-xs text-amber-700">Vendor đang chờ admin phê duyệt</p>
                  </div>
                </div>
                <Link
                  href="/admin/pois"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:scale-105 hover:shadow-xl"
                >
                  Review ngay
                  <ShieldCheck className="h-4 w-4" />
                </Link>
              </section>
            )}

            {/* System Status */}
            <section className="rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-200">
                  <Check className="h-4 w-4 text-emerald-700" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Hệ thống hoạt động</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>API Status</span>
                  <span className="font-semibold text-emerald-600">Online</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Database</span>
                  <span className="font-semibold text-emerald-600">Connected</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Cloudinary</span>
                  <span className="font-semibold text-emerald-600">Ready</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
