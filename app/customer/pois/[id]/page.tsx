"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Star,
  Navigation,
  Phone,
  Clock,
  MapPin,
  Image as ImageIcon,
  Share2,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { mockPlatformService } from "@/application/services/mock-platform";
import { AudioPlayer } from "@/components/features/customer/shared/audio-player";

// Types
interface MenuItem {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
}

// Image Gallery Component
function ImageGallery({
  images,
  coverImage,
  name,
}: {
  images: string[];
  coverImage: string | null;
  name: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const allImages = coverImage
    ? [coverImage, ...images.filter((img) => img !== coverImage)]
    : images;

  if (allImages.length === 0) {
    return (
      <div className="relative aspect-square bg-slate-100">
        <div className="flex h-full w-full items-center justify-center">
          <MapPin className="h-20 w-20 text-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-square overflow-hidden bg-slate-100">
      <img
        src={allImages[currentIndex] || ""}
        alt={name}
        className="h-full w-full object-cover"
      />

      {/* Image Counter */}
      {allImages.length > 1 && (
        <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur">
          {currentIndex + 1} / {allImages.length}
        </div>
      )}

      {/* Dots */}
      {allImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {allImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Menu Section
function MenuSection({ items }: { items: MenuItem[] }) {
  const [showAll, setShowAll] = useState(false);

  const displayItems = showAll ? items : items.slice(0, 3);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 font-semibold text-slate-900">Thực đơn</h2>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Chưa cập nhật thực đơn</p>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item) => (
            <div key={item.id} className="flex gap-3">
              {item.imageUrl && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name || ""}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-slate-800">
                    {item.name || "Không tên"}
                  </h3>
                  {item.price !== null && (
                    <span className="shrink-0 text-sm font-semibold text-orange-600">
                      {item.price.toLocaleString()}đ
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}

          {items.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-center text-sm font-medium text-orange-600"
            >
              {showAll ? "Thu gọn" : `Xem thêm ${items.length - 3} món`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Reviews Section
function ReviewsSection({ reviews }: { reviews: Review[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Đánh giá</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-amber-700">
              {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">({reviews.length})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-400">Chưa có đánh giá</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3 w-3",
                      star <= review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    )}
                  />
                ))}
              </div>
              {review.comment && (
                <p className="mt-1 text-sm text-slate-600">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function POIDetailPage() {
  const router = useRouter();
  const params = useParams();
  const poiId = params.id as string;

  const [isFavorited, setIsFavorited] = useState(false);

  // Get POI data
  const poi = mockPlatformService.poi.listAll().find((p) => p.id === poiId);

  if (!poi) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Không tìm thấy điểm đến</p>
      </div>
    );
  }

  // Mock data
  const menuItems: MenuItem[] = [];
  const reviews: Review[] = [];
  const images = poi.imageUrl ? [poi.imageUrl] : [];

  const district = mockPlatformService.districts.list().find((d) => d.id === poi.districtId);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  isFavorited ? "fill-red-500 text-red-500" : "text-slate-400"
                )}
              />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
              <Share2 className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Image Gallery */}
      <ImageGallery images={images} coverImage={poi.imageUrl ?? null} name={poi.name} />

      {/* Content */}
      <main className="p-4 space-y-4">
        {/* Title Section */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{poi.name}</h1>
              {district && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {district.name}
                </p>
              )}
            </div>
            <div className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
              {poi.type === "FOOD_STALL" ? "Đồ ăn" : "Tiện ích"}
            </div>
          </div>

          <p className="mt-2 text-sm text-slate-600">{poi.description}</p>
        </div>

        {/* Audio Guide */}
        <AudioPlayer
          script={`Chào mừng bạn đến với ${poi.name}. ${poi.description} Đây là một trong những điểm đến ẩm thực đặc sắc tại khu phố.`}
          language="vi"
        />

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Navigation className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-[10px] font-medium text-slate-600">Đường đi</span>
          </button>
          <button className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Phone className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-medium text-slate-600">Gọi</span>
          </button>
          <button className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-medium text-slate-600">Giờ mở</span>
          </button>
        </div>

        {/* Opening Hours */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-semibold text-slate-900">Giờ mở cửa</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Hôm nay</span>
              <span className="font-medium text-slate-800">08:00 - 22:00</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Thông tin giờ mở cửa có thể thay đổi
            </p>
          </div>
        </div>

        {/* Menu */}
        <MenuSection items={menuItems} />

        {/* Reviews */}
        <ReviewsSection reviews={reviews} />
      </main>
    </div>
  );
}
