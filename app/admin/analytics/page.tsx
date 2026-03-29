"use client";

import {
  Activity,
  BarChart3,
  Compass,
  Eye,
  Headphones,
  Languages,
  MapPin,
  RefreshCw,
  Users,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AdminLayout } from "@/components/layouts/admin-layout";

type AnalyticsData = {
  totalPOIs: number;
  totalTours: number;
  totalUsers: number;
  totalVendors: number;
  totalAudioGuides: number;
  totalTranslations: number;
  totalReviews: number;
  totalFavorites: number;
  activePOIs: number;
  activeTours: number;
};

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalPOIs: 0,
    totalTours: 0,
    totalUsers: 0,
    totalVendors: 0,
    totalAudioGuides: 0,
    totalTranslations: 0,
    totalReviews: 0,
    totalFavorites: 0,
    activePOIs: 0,
    activeTours: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  // Load analytics data
  const loadAnalytics = async () => {
    setIsLoading(true);
    setAlert(null);

    try {
      // Fetch data from multiple endpoints
      const [poisRes, toursRes, usersRes] = await Promise.all([
        fetch("/api/admin/pois?take=100&skip=0&includeLocked=1", {
          credentials: "include",
        }),
        fetch("/api/admin/tours?take=100&skip=0", {
          credentials: "include",
        }),
        fetch("/api/admin/users?take=100&skip=0", {
          credentials: "include",
        }),
      ]);

      if (!poisRes.ok || !toursRes.ok || !usersRes.ok) {
        throw new Error("Không thể tải dữ liệu analytics");
      }

      const [poisData, toursData, usersData] = await Promise.all([
        poisRes.json(),
        toursRes.json(),
        usersRes.json(),
      ]);

      const pois = poisData.pois || [];
      const tours = toursData.tours || [];
      const users = usersData.users || [];

      // Calculate analytics
      const totalPOIs = poisData.total || pois.length;
      const totalTours = toursData.total || tours.length;
      const totalUsers = usersData.total || users.length;
      const totalVendors = users.filter((u: any) => u.role === "VENDOR").length;

      // Count audio guides and translations from POI data
      let totalAudioGuides = 0;
      let totalTranslations = 0;

      for (const poi of pois) {
        if (poi.translations) {
          totalTranslations += poi.translations.length;
          for (const t of poi.translations) {
            if (t.audios) {
              totalAudioGuides += t.audios.length;
            }
          }
        }
      }

      const totalReviews = pois.reduce((acc: number, poi: any) => {
        // Reviews count from POI stats (if available)
        return acc + (poi.reviewsCount || 0);
      }, 0);

      const activePOIs = pois.filter(
        (poi: any) => poi.status === "APPROVED" && poi.isActive
      ).length;
      const activeTours = tours.filter((tour: any) => tour.isActive).length;

      setAnalytics({
        totalPOIs,
        totalTours,
        totalUsers,
        totalVendors,
        totalAudioGuides,
        totalTranslations,
        totalReviews,
        totalFavorites: 0, // Would need separate API for favorites count
        activePOIs,
        activeTours,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể tải dữ liệu analytics",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-3 text-white shadow-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Phân tích hệ thống</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Theo dõi mức độ sử dụng, nội dung và hoạt động của người dùng
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadAnalytics}
              disabled={isLoading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} mr-2`} />
              Làm mới
            </button>
          </div>
        </div>

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
              <Activity className="h-5 w-5 mt-0.5 flex-shrink-0" />
            ) : (
              <BarChart3 className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium">{alert.message}</p>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Tổng POI
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{analytics.totalPOIs}</p>
              </div>
              <div className="rounded-xl bg-emerald-200 p-3">
                <MapPin className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                  POI Hoạt động
                </p>
                <p className="mt-2 text-3xl font-bold text-teal-900">{analytics.activePOIs}</p>
              </div>
              <div className="rounded-xl bg-teal-200 p-3">
                <Activity className="h-6 w-6 text-teal-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Food Tours
                </p>
                <p className="mt-2 text-3xl font-bold text-blue-900">{analytics.totalTours}</p>
              </div>
              <div className="rounded-xl bg-blue-200 p-3">
                <Compass className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
                  Tours Hoạt động
                </p>
                <p className="mt-2 text-3xl font-bold text-orange-900">{analytics.activeTours}</p>
              </div>
              <div className="rounded-xl bg-orange-200 p-3">
                <Activity className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Reviews
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{analytics.totalReviews}</p>
              </div>
              <div className="rounded-xl bg-slate-200 p-3">
                <Activity className="h-6 w-6 text-slate-700" />
              </div>
            </div>
          </div>
        </div>

        {/* More Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-200 p-2">
                <Users className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <p className="text-lg font-bold text-blue-900">{analytics.totalUsers}</p>
                <p className="text-xs text-blue-700">Tổng Users</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-orange-200 p-2">
                <Headphones className="h-4 w-4 text-orange-700" />
              </div>
              <div>
                <p className="text-lg font-bold text-orange-900">{analytics.totalVendors}</p>
                <p className="text-xs text-orange-700">Vendors</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-cyan-200 p-2">
                <Volume2 className="h-4 w-4 text-cyan-700" />
              </div>
              <div>
                <p className="text-lg font-bold text-cyan-900">{analytics.totalAudioGuides}</p>
                <p className="text-xs text-cyan-700">Audio Guides</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-pink-200 p-2">
                <Languages className="h-4 w-4 text-pink-700" />
              </div>
              <div>
                <p className="text-lg font-bold text-pink-900">{analytics.totalTranslations}</p>
                <p className="text-xs text-pink-700">Bản dịch</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Metrics */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Chỉ số sử dụng</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Độ phủ nội dung</p>
                <Eye className="h-4 w-4 text-slate-400" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>POI có bản dịch</span>
                    <span className="font-semibold text-slate-700">
                      {analytics.totalPOIs > 0
                        ? Math.round((analytics.totalTranslations / analytics.totalPOIs) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${
                          analytics.totalPOIs > 0
                            ? (analytics.totalTranslations / analytics.totalPOIs) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>POI có audio</span>
                    <span className="font-semibold text-slate-700">
                      {analytics.totalPOIs > 0
                        ? Math.round((analytics.totalAudioGuides / analytics.totalPOIs) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all"
                      style={{
                        width: `${
                          analytics.totalPOIs > 0
                            ? (analytics.totalAudioGuides / analytics.totalPOIs) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Phân bổ vai trò</p>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Vendors</span>
                    <span className="font-semibold text-slate-700">
                      {analytics.totalUsers > 0
                        ? Math.round((analytics.totalVendors / analytics.totalUsers) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-orange-500 transition-all"
                      style={{
                        width: `${
                          analytics.totalUsers > 0
                            ? (analytics.totalVendors / analytics.totalUsers) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Regular Users</span>
                    <span className="font-semibold text-slate-700">
                      {analytics.totalUsers > 0
                        ? Math.round(
                            ((analytics.totalUsers - analytics.totalVendors) /
                              analytics.totalUsers) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${
                          analytics.totalUsers > 0
                            ? (
                                (analytics.totalUsers - analytics.totalVendors) /
                                  analytics.totalUsers
                              ) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Tình trạng POI</p>
                <MapPin className="h-4 w-4 text-slate-400" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Hoạt động</span>
                    <span className="font-semibold text-green-700">
                      {analytics.totalPOIs > 0
                        ? Math.round((analytics.activePOIs / analytics.totalPOIs) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${
                          analytics.totalPOIs > 0
                            ? (analytics.activePOIs / analytics.totalPOIs) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
