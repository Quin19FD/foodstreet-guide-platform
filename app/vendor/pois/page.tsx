"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, POIStatusType } from "@/components/features/vendor/vendor-components";
import { TextInput } from "@/components/features/vendor/form-components";

interface POI {
  id: string;
  name: string;
  slug: string;
  category?: string;
  status: POIStatusType;
  createdAt: string;
  updatedAt: string;
  priceMin: number;
  priceMax: number;
  rejectionReason?: string | null;
}

export default function VendorPOIsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") as POIStatusType | null;
  const searchQuery = searchParams.get("search") || "";

  const [pois, setPois] = useState<POI[]>([]);
  const [filteredPois, setFilteredPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [currentStatus, setCurrentStatus] = useState<POIStatusType | null>(statusFilter);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch POIs
  useEffect(() => {
    const fetchPOIs = async () => {
      try {
        const response = await fetch("/api/vendor/pois?take=1000");
        if (!response.ok) throw new Error("Failed to fetch POIs");

        const data = await response.json();
        setPois(data.pois || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPOIs();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = pois;

    // Filter by status
    if (currentStatus) {
      filtered = filtered.filter((p) => p.status === currentStatus);
    }

    // Filter by search query
    if (searchInput) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchInput.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchInput.toLowerCase())
      );
    }

    // Sort by updated date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    setFilteredPois(filtered);
  }, [pois, currentStatus, searchInput]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const handleStatusFilter = (status: POIStatusType | null) => {
    setCurrentStatus(status);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa địa điểm này?")) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/vendor/pois/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete POI");

      setPois((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa địa điểm");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý địa điểm</h1>
          <p className="mt-1 text-slate-600">
            Quản lý tất cả các địa điểm của bạn
          </p>
        </div>
        <Button
          onClick={() => router.push("/vendor/pois/create")}
          className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Thêm địa điểm
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput
                type="text"
                placeholder="Tìm kiếm theo tên hoặc danh mục..."
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Filter className="h-4 w-4" />
                <span>Trạng thái:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleStatusFilter(null)}
                  variant={!currentStatus ? "default" : "outline"}
                  size="sm"
                  className={
                    !currentStatus ? "bg-blue-600 hover:bg-blue-700" : ""
                  }
                >
                  Tất cả ({pois.length})
                </Button>
                <Button
                  onClick={() => handleStatusFilter("PENDING")}
                  variant={currentStatus === "PENDING" ? "default" : "outline"}
                  size="sm"
                  className={
                    currentStatus === "PENDING" ? "bg-blue-600 hover:bg-blue-700" : ""
                  }
                >
                  Chờ duyệt (
                  {pois.filter((p) => p.status === "PENDING").length})
                </Button>
                <Button
                  onClick={() => handleStatusFilter("APPROVED")}
                  variant={currentStatus === "APPROVED" ? "default" : "outline"}
                  size="sm"
                  className={
                    currentStatus === "APPROVED" ? "bg-blue-600 hover:bg-blue-700" : ""
                  }
                >
                  Đã duyệt (
                  {pois.filter((p) => p.status === "APPROVED").length})
                </Button>
                <Button
                  onClick={() => handleStatusFilter("REJECTED")}
                  variant={currentStatus === "REJECTED" ? "default" : "outline"}
                  size="sm"
                  className={
                    currentStatus === "REJECTED" ? "bg-blue-600 hover:bg-blue-700" : ""
                  }
                >
                  Bị từ chối (
                  {pois.filter((p) => p.status === "REJECTED").length})
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách địa điểm</CardTitle>
          <CardDescription>
            {filteredPois.length} kết quả
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredPois.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-600">Không tìm thấy địa điểm nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Tên
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Danh mục
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Giá
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Cập nhật
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPois.map((poi) => (
                    <tr
                      key={poi.id}
                      className="border-b border-slate-200 transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {poi.name}
                          </p>
                          <p className="text-xs text-slate-500">{poi.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {poi.category || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatPrice(poi.priceMin)} -{" "}
                        {formatPrice(poi.priceMax)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={poi.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(poi.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() =>
                              router.push(`/vendor/pois/${poi.id}`)
                            }
                            size="sm"
                            variant="ghost"
                            className="text-slate-600 hover:text-slate-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() =>
                              router.push(`/vendor/pois/${poi.id}/edit`)
                            }
                            size="sm"
                            variant="ghost"
                            className="text-slate-600 hover:text-slate-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(poi.id)}
                            size="sm"
                            variant="ghost"
                            disabled={deleting === poi.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {deleting === poi.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
