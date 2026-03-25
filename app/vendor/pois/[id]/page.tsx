"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Edit,
  Trash2,
  MapPin,
  DollarSign,
  FileText,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, RejectionAlert } from "@/components/features/vendor/vendor-components";

interface POI {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  latitude: number;
  longitude: number;
  priceMin: number;
  priceMax: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export default function POIDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [poi, setPoi] = useState<POI | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPOI = async () => {
      try {
        const response = await fetch(`/api/vendor/pois/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch POI");

        const data: POI = await response.json();
        setPoi(data);
      } catch (err) {
        console.error(err);
        alert("Lỗi khi tải địa điểm");
      } finally {
        setLoading(false);
      }
    };

    fetchPOI();
  }, [params.id]);

  const handleDelete = async () => {
    if (!poi) return;
    if (!confirm("Bạn chắc chắn muốn xóa địa điểm này?")) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/vendor/pois/${poi.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete POI");

      alert("Đã xóa địa điểm");
      router.push("/vendor/pois");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi khi xóa");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

const formatPrice = (price?: number | null) => {
  if (price == null) return "N/A";

  return price.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    notation: "compact",
  });
};
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!poi) {
    return (
      <div className="space-y-4">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Không tìm thấy địa điểm
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{poi.name}</h1>
              <StatusBadge status={poi.status} />
            </div>
            <p className="mt-1 text-slate-600">{poi.slug}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => router.push(`/vendor/pois/${poi.id}/edit`)}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 sm:flex-none"
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="outline"
            className="flex-1 gap-2 text-red-600 hover:text-red-700 sm:flex-none"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Xóa
          </Button>
        </div>
      </div>

      {/* Rejection Alert */}
      {poi.status === "REJECTED" && (
        <RejectionAlert
          reason={poi.rejectionReason || "Không có lý do được cung cấp"}
          onResubmit={() => router.push(`/vendor/pois/${poi.id}/edit`)}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Mô tả</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed">
                {poi.description || "Chưa có mô tả"}
              </p>
            </CardContent>
          </Card>

          {/* Location & Coordinates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Vị trí
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs italic text-slate-500">
                    Tọa độ GPS
                  </p>
                  <p className="font-mono text-sm text-slate-900">
                    {poi.latitude}, {poi.longitude}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/${poi.latitude},${poi.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Mở trong Google Maps →
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Giá cả
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Khoảng giá</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatPrice(poi.priceMin)} - {formatPrice(poi.priceMax)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">
                  Danh mục
                </p>
                <p className="text-slate-900">
                  {poi.category || "-"}
                </p>
              </div>

              <div className="h-px bg-slate-200" />

              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">
                  Trạng thái
                </p>
                <StatusBadge status={poi.status} />
              </div>

              <div className="h-px bg-slate-200" />

              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Tạo ngày
                </p>
                <p className="text-xs text-slate-600">
                  {formatDate(poi.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Cập nhật lần cuối
                </p>
                <p className="text-xs text-slate-600">
                  {formatDate(poi.updatedAt)}
                </p>
              </div>

              <div className="h-px bg-slate-200" />

              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">
                  ID
                </p>
                <p className="font-mono text-xs text-slate-600 truncate">
                  {poi.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => router.push(`/vendor/pois/${poi.id}/edit`)}
                className="w-full"
                variant="outline"
              >
                Chỉnh sửa thông tin
              </Button>
              <Button
                onClick={() => router.push("/vendor/translations")}
                className="w-full"
                variant="outline"
              >
                Quản lý bản dịch
              </Button>
              <Button
                onClick={() => router.push("/vendor/pois")}
                className="w-full"
                variant="outline"
              >
                Quay lại danh sách
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
