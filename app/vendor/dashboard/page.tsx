"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp, Clock, CheckCircle, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, StatusBadge } from "@/components/features/vendor/vendor-components";

interface DashboardStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface RecentPOI {
  id: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [recentPOIs, setRecentPOIs] = useState<RecentPOI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/vendor/pois?take=100");
        if (!response.ok) throw new Error("Failed to fetch POIs");

        const data = await response.json();
        const pois: RecentPOI[] = data.pois || [];

        // Calculate stats
        const stats: DashboardStats = {
          total: pois.length,
          approved: pois.filter((p) => p.status === "APPROVED").length,
          pending: pois.filter((p) => p.status === "PENDING").length,
          rejected: pois.filter((p) => p.status === "REJECTED").length,
        };

        setStats(stats);

        // Get 5 most recent POIs
        const recent = pois
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);

        setRecentPOIs(recent);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-slate-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bảng điều khiển</h1>
          <p className="mt-1 text-slate-600">
            Chào mừng quay trở lại! Đây là tổng quan về các địa điểm của bạn.
          </p>
        </div>
        <Button
          onClick={() => router.push("/vendor/pois/create")}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Thêm địa điểm
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng cộng"
          value={stats.total}
          icon={<MapPin className="h-6 w-6" />}
          hint="Địa điểm của bạn"
        />
        <StatCard
          title="Đã duyệt"
          value={stats.approved}
          icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
          hint={`${stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% tổng cộng`}
        />
        <StatCard
          title="Chờ duyệt"
          value={stats.pending}
          icon={<Clock className="h-6 w-6 text-yellow-600" />}
          hint="Chờ xem xét"
        />
        <StatCard
          title="Bị từ chối"
          value={stats.rejected}
          icon={<AlertCircle className="h-6 w-6 text-red-600" />}
          hint="Cần chỉnh sửa"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent POIs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Địa điểm gần đây</CardTitle>
              <CardDescription>
                5 địa điểm được cập nhật gần đây nhất
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPOIs.length === 0 ? (
                <div className="py-8 text-center">
                  <MapPin className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-slate-600">
                    Bạn chưa tạo địa điểm nào
                  </p>
                  <Button
                    onClick={() => router.push("/vendor/pois/create")}
                    variant="outline"
                    className="mt-4"
                  >
                    Tạo địa điểm đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPOIs.map((poi) => (
                    <div
                      key={poi.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-slate-900 truncate">
                          {poi.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {formatDate(poi.updatedAt)}
                        </p>
                      </div>
                      <StatusBadge status={poi.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push("/vendor/pois/create")}
                className="w-full gap-2 justify-start bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Tạo địa điểm mới
              </Button>
              <Button
                onClick={() => router.push("/vendor/pois")}
                variant="outline"
                className="w-full justify-start"
              >
                <MapPin className="h-4 w-4" />
                Xem tất cả
              </Button>
              <Button
                onClick={() => router.push("/vendor/translations")}
                variant="outline"
                className="w-full justify-start"
              >
                <TrendingUp className="h-4 w-4" />
                Quản lý dịch
              </Button>
            </CardContent>
          </Card>

          {/* Performance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hiệu suất</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Tỉ lệ duyệt</span>
                  <span className="font-semibold text-slate-900">
                    {stats.total > 0
                      ? Math.round((stats.approved / stats.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-emerald-600 transition-all"
                    style={{
                      width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {stats.approved} trên {stats.total} địa điểm đã được duyệt
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
