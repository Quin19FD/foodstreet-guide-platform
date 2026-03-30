"use client";

import { VendorLayout } from "@/components/layouts/vendor-layout";
import {
  AlertCircle,
  Building2,
  Check,
  Clock,
  Edit,
  Eye,
  MapPin,
  Plus,
  ShoppingCart,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type VendorStats = {
  totalPOIs: number;
  approvedPOIs: number;
  pendingPOIs: number;
  rejectedPOIs: number;
  totalProducts: number;
  activeProducts: number;
  totalViews: number;
  thisMonthViews: number;
};

type RecentPOI = {
  id: string;
  name: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function VendorHomePage() {
  const [stats, setStats] = useState<VendorStats>({
    totalPOIs: 0,
    approvedPOIs: 0,
    pendingPOIs: 0,
    rejectedPOIs: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalViews: 0,
    thisMonthViews: 0,
  });
  const [recentPOIs, setRecentPOIs] = useState<RecentPOI[]>([]);
  const [isLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Vendor backend chưa được implement, hiển thị empty state
  useEffect(() => {
    // Để trống
  }, []);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "rounded-full px-3 py-1 text-xs font-bold ";

    switch (status) {
      case "APPROVED":
        return baseClass + "bg-emerald-100 text-emerald-700";
      case "REJECTED":
        return baseClass + "bg-rose-100 text-rose-700";
      case "PENDING":
        return baseClass + "bg-amber-100 text-amber-700";
      default:
        return baseClass + "bg-slate-100 text-slate-600";
    }
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-orange-300 hover:shadow-md md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 transition-colors group-hover:bg-orange-100">
                <Building2 className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Vendor Dashboard
                </h1>
                <p className="text-xs text-slate-500">
                  Quản lý gian hàng và sản phẩm của bạn
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500">Tính năng vendor đang được phát triển</p>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
                  Đã duyệt
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{formatNumber(stats.approvedPOIs)}</p>
                <p className="mt-1 text-xs text-slate-500">POI đang hoạt động</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-emerald-100 transition-colors">
                <Check className="h-6 w-6 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors">
                  Chờ duyệt
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800 group-hover:text-amber-600 transition-colors">{formatNumber(stats.pendingPOIs)}</p>
                <p className="mt-1 text-xs text-slate-500">POI đang xem xét</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-amber-100 transition-colors">
                <Clock className="h-6 w-6 text-slate-500 group-hover:text-amber-600 transition-colors" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                  Lượt xem
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{formatNumber(stats.thisMonthViews)}</p>
                <p className="mt-1 text-xs text-slate-500">Tháng này</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-blue-100 transition-colors">
                <Eye className="h-6 w-6 text-slate-500 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
                  Tổng POI
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800 group-hover:text-purple-600 transition-colors">{formatNumber(stats.totalPOIs)}</p>
                <p className="mt-1 text-xs text-slate-500">Tất cả gian hàng</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-purple-100 transition-colors">
                <MapPin className="h-6 w-6 text-slate-500 group-hover:text-purple-600 transition-colors" />
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
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-500/20">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Truy cập nhanh</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  href="/vendor/pois"
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-500/30 transition-all group-hover:scale-110 group-hover:rotate-3">
                      <MapPin className="h-7 w-7 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">Quản lý POI</p>
                      <p className="mt-0.5 text-sm text-slate-500">Thêm, sửa gian hàng</p>
                    </div>
                  </div>
                  <div className="absolute -right-2 -bottom-2 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>

                <Link
                  href="/vendor/products"
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/30 transition-all group-hover:scale-110 group-hover:rotate-3">
                      <ShoppingCart className="h-7 w-7 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Sản phẩm</p>
                      <p className="mt-0.5 text-sm text-slate-500">Quản lý menu</p>
                    </div>
                  </div>
                  <div className="absolute -right-2 -bottom-2 h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </div>
            </section>

            {/* Recent POIs */}
            <section className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
                <h2 className="text-base font-bold text-slate-800">Gian hàng gần đây</h2>
                <Link
                  href="/vendor/pois"
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  Xem tất cả
                  <MapPin className="h-3.5 w-3.5" />
                </Link>
              </div>

              {recentPOIs.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center p-8">
                  <MapPin className="h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">Chưa có gian hàng nào</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Bắt đầu thêm gian hàng để hiển thị trên FoodStreet
                  </p>
                  <Link
                    href="/vendor/pois"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm gian hàng mới
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-6 py-3">Tên gian hàng</th>
                        <th className="px-6 py-3">Danh mục</th>
                        <th className="px-6 py-3">Trạng thái</th>
                        <th className="px-6 py-3">Cập nhật</th>
                        <th className="px-6 py-3">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentPOIs.map((poi) => (
                        <tr
                          key={poi.id}
                          className="transition-colors hover:bg-orange-50/50"
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                <MapPin className="h-4 w-4 text-orange-600" />
                              </div>
                              <span className="font-medium text-slate-800">
                                {poi.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-slate-600">
                            {poi.category}
                          </td>
                          <td className="px-6 py-3">
                            <span className={getStatusBadge(poi.status)}>
                              {poi.status === "APPROVED"
                                ? "Đã duyệt"
                                : poi.status === "REJECTED"
                                  ? "Từ chối"
                                  : "Chờ duyệt"}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-500">
                            {formatDate(poi.updatedAt)}
                          </td>
                          <td className="px-6 py-3">
                            <Link
                              href={`/vendor/pois/${poi.id}`}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                              Sửa
                            </Link>
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
            {(stats.pendingPOIs > 0) && (
              <section className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-100 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200">
                    <Clock className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      {stats.pendingPOIs} POI chờ duyệt
                    </h3>
                    <p className="text-xs text-amber-700">
                      Admin đang xem xét gian hàng của bạn
                    </p>
                  </div>
                </div>
                <Link
                  href="/vendor/pois"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:scale-105 hover:shadow-xl"
                >
                  Xem chi tiết
                  <Eye className="h-4 w-4" />
                </Link>
              </section>
            )}

            {/* Stats Summary */}
            <section className="rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200">
                  <TrendingUp className="h-4 w-4 text-blue-700" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Hiệu suất</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tổng lượt xem</span>
                  <span className="font-semibold text-blue-600">{formatNumber(stats.totalViews)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Lượt xem tháng này</span>
                  <span className="font-semibold text-emerald-600">{formatNumber(stats.thisMonthViews)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>POI đang hoạt động</span>
                  <span className="font-semibold text-orange-600">{stats.approvedPOIs}</span>
                </div>
              </div>
            </section>

            {/* Quick Tips */}
            <section className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-200">
                  <Star className="h-4 w-4 text-orange-700" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Mẹo</h3>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>• Thêm hình ảnh đẹp để thu hút khách</p>
                <p>• Cập nhật menu thường xuyên</p>
                <p>• Phản hồi đánh giá của khách hàng</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </VendorLayout>
  );
}


