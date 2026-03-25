"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TextInput,
  Textarea,
  Select,
  FileUpload,
  LocationPicker,
  PriceRange,
  FormSection,
} from "@/components/features/vendor/form-components";
import { RejectionAlert } from "@/components/features/vendor/vendor-components";

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
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  category: string;
  latitude: string;
  longitude: string;
  priceMin: string;
  priceMax: string;
}

interface FormErrors {
  [key: string]: string;
}

const CATEGORIES = [
  { label: "Bánh mì", value: "banh-mi" },
  { label: "Phở", value: "pho" },
  { label: "Bánh mềm", value: "banh-mem" },
  { label: "Chế biến nước", value: "che-bien-nuoc" },
  { label: "Nướng", value: "nuong" },
  { label: "Chiên", value: "chien" },
  { label: "Hải sản", value: "hai-san" },
  { label: "Ăn vặt", value: "an-vat" },
  { label: "Khác", value: "khac" },
];

export default function CreateEditPOIPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = !!params?.id;

  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    description: "",
    category: "",
    latitude: "",
    longitude: "",
    priceMin: "",
    priceMax: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [originalPOI, setOriginalPOI] = useState<POI | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Fetch POI if editing
  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }

    const fetchPOI = async () => {
      try {
        const response = await fetch(`/api/vendor/pois/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch POI");

        const poi: POI = await response.json();
        setOriginalPOI(poi);
        setFormData({
          name: poi.name,
          slug: poi.slug,
          description: poi.description || "",
          category: poi.category || "",
          latitude: poi.latitude.toString(),
          longitude: poi.longitude.toString(),
          priceMin: poi.priceMin.toString(),
          priceMax: poi.priceMax.toString(),
        });
      } catch (err) {
        console.error(err);
        alert("Lỗi khi tải địa điểm");
      } finally {
        setLoading(false);
      }
    };

    fetchPOI();
  }, [isEdit, params.id]);

  // Generate slug
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-"),
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = "Tên địa điểm là bắt buộc";
    if (!formData.slug.trim()) newErrors.slug = "Slug là bắt buộc";
    if (!formData.category) newErrors.category = "Danh mục là bắt buộc";
    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      newErrors.location = "Vị trí là bắt buộc";
    }
    
    const minPrice = parseFloat(formData.priceMin);
    const maxPrice = parseFloat(formData.priceMax);
    if (
      !formData.priceMin.trim() ||
      !formData.priceMax.trim() ||
      isNaN(minPrice) ||
      isNaN(maxPrice) ||
      minPrice > maxPrice
    ) {
      newErrors.price = "Khoảng giá không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Vui lòng kiểm tra các lỗi trên form");
      return;
    }

    setSubmitting(true);

    try {
      const method = isEdit ? "PATCH" : "POST";
      const url = isEdit ? `/api/vendor/pois/${params.id}` : "/api/vendor/pois";

      // Convert string values to numbers for API
      const submitData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        priceMin: parseInt(formData.priceMin),
        priceMax: parseInt(formData.priceMax),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save POI");
      }

      const result = await response.json();

      // Show success
      alert(isEdit ? "Đã cập nhật địa điểm" : "Đã tạo địa điểm mới");

      // Redirect
      router.push(`/vendor/pois/${result.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi khi lưu địa điểm");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEdit ? "Chỉnh sửa địa điểm" : "Tạo địa điểm mới"}
          </h1>
          <p className="mt-1 text-slate-600">
            {isEdit
              ? "Cập nhật thông tin địa điểm"
              : "Hãy điền thông tin chi tiết về địa điểm của bạn"}
          </p>
        </div>
      </div>

      {/* Rejection Alert */}
      {originalPOI?.status === "REJECTED" && (
        <RejectionAlert
          reason={originalPOI.rejectionReason || "Không có lý do được cung cấp"}
          onResubmit={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>
                Nhập tên, mô tả và danh mục cho địa điểm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextInput
                label="Tên địa điểm"
                placeholder="VD: Bánh mì Phương"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                error={errors.name}
                required
              />

              <TextInput
                label="URL Slug"
                placeholder="banh-mi-phuong"
                value={formData.slug}
                onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                error={errors.slug}
                hint="Được tự động tạo từ tên, bạn có thể chỉnh sửa"
                required
              />

              <Textarea
                label="Mô tả"
                placeholder="Mô tả chi tiết về địa điểm..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                rows={4}
              />

              <Select
                label="Danh mục"
                options={CATEGORIES}
                value={formData.category}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, category: e.target.value }))
                }
                error={errors.category}
                required
              />
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Vị trí địa điểm</CardTitle>
              <CardDescription>
                Nhập tọa độ GPS hoặc chọn trên bản đồ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={(lat, lng) =>
                  setFormData((p) => ({
                    ...p,
                    latitude: lat,
                    longitude: lng,
                  }))
                }
                error={errors.location}
              />
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Giá cả</CardTitle>
              <CardDescription>
                Nhập khoảng giá cho các sản phẩm tại địa điểm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PriceRange
                minPrice={formData.priceMin}
                maxPrice={formData.priceMax}
                onChange={(min, max) =>
                  setFormData((p) => ({
                    ...p,
                    priceMin: min,
                    priceMax: max,
                  }))
                }
                error={errors.price}
              />
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh</CardTitle>
              <CardDescription>
                Tải lên hình ảnh đại diện cho địa điểm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                label="Hình ảnh chính"
                value={imageFile}
                onChange={setImageFile}
                accept="image/*"
                maxSize={5}
              />
            </CardContent>
          </Card>

          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900">
                    Lỗi trên biểu mẫu
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-red-700">
                    {Object.values(errors).map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={submitting}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEdit ? "Cập nhật" : "Tạo"} địa điểm
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Hủy
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
