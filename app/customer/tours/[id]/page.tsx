"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Star,
  Navigation,
  Calendar,
  Users,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { mockPlatformService } from "@/application/services/mock-platform";

// Tour Stop Component
function TourStop({
  poi,
  index,
  total,
}: {
  poi: { id: string; name: string; description: string; imageUrl?: string };
  index: number;
  total: number;
}) {
  return (
    <Link
      href={`/customer/pois/${poi.id}`}
      className="flex gap-3 rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Stop Number */}
      <div className="flex shrink-0 flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
          {index + 1}
        </div>
        {index < total - 1 && (
          <div className="w-0.5 flex-1 bg-slate-200" />
        )}
      </div>

      {/* POI Info */}
      <div className="flex flex-1 gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {poi.imageUrl ? (
            <img src={poi.imageUrl} alt={poi.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <MapPin className="h-6 w-6 text-slate-300" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{poi.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{poi.description}</p>
        </div>
        <ChevronRight className="h-5 w-5 self-center text-slate-400" />
      </div>
    </Link>
  );
}

// Booking Modal
function BookingModal({
  tour,
  isOpen,
  onClose,
  onConfirm,
}: {
  tour: { id: string; name: string; durationMinutes: number };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { date: string; guests: number }) => void;
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const [guests, setGuests] = useState(1);

  if (!isOpen) return null;

  const dates = ["Hôm nay", "Ngày mai", "Thứ 7", "Chủ nhật"];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
      <div className="w-full rounded-t-3xl bg-white p-6 md:max-w-md md:rounded-2xl">
        {/* Handle */}
        <button
          onClick={onClose}
          className="mx-auto mb-4 flex h-1 w-12 rounded-full bg-slate-200"
        />

        <h2 className="text-lg font-bold text-slate-900">Đặt Tour</h2>
        <p className="text-sm text-slate-500">{tour.name}</p>

        {/* Date Selection */}
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Chọn ngày
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  selectedDate === date
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {date}
              </button>
            ))}
          </div>
        </div>

        {/* Guests Selection */}
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Số lượng khách
          </label>
          <div className="flex items-center justify-between rounded-xl bg-slate-100 p-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-500" />
              <span className="text-sm text-slate-700">Khách</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
              >
                −
              </button>
              <span className="w-6 text-center font-semibold">{guests}</span>
              <button
                onClick={() => setGuests(Math.min(10, guests + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mt-4 rounded-xl bg-orange-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Tổng cộng</span>
            <span className="text-lg font-bold text-orange-600">Miễn phí</span>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={() => onConfirm({ date: selectedDate, guests })}
          disabled={!selectedDate}
          className={cn(
            "mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-colors",
            selectedDate
              ? "bg-orange-500 hover:bg-orange-600"
              : "cursor-not-allowed bg-slate-300"
          )}
        >
          Xác nhận đặt tour
        </button>
      </div>
    </div>
  );
}

// Success Modal
function SuccessModal({
  isOpen,
  onClose,
  onStartTour,
}: {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-500" />
        </div>

        <h2 className="text-lg font-bold text-slate-900">
          Đặt tour thành công!
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Chúng tôi đã gửi xác nhận đến email của bạn
        </p>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={onStartTour}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            <Navigation className="h-5 w-5" />
            Bắt đầu tour ngay
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-xl py-3 font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TourDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.id as string;

  const [showBooking, setShowBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get tour data
  const tour = mockPlatformService.tour.list().find((t) => t.id === tourId);

  if (!tour) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Không tìm thấy tour</p>
      </div>
    );
  }

  // Get POIs for this tour
  const tourPOIs = tour.poiIds
    .map((poiId) => mockPlatformService.poi.listAll().find((p) => p.id === poiId))
    .filter((poi): poi is NonNullable<typeof poi> => poi !== undefined);

  const handleBooking = (data: { date: string; guests: number }) => {
    setShowBooking(false);
    setShowSuccess(true);
  };

  const handleStartTour = () => {
    setShowSuccess(false);
    // Navigate to first POI
    if (tourPOIs.length > 0) {
      router.push(`/customer/pois/${tourPOIs[0].id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <h1 className="font-semibold text-slate-900">Chi tiết Tour</h1>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative aspect-video bg-gradient-to-br from-orange-200 to-amber-200">
        {tourPOIs.length > 0 && tourPOIs[0].imageUrl ? (
          <img
            src={tourPOIs[0].imageUrl}
            alt={tour.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-16 w-16 text-orange-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-xl font-bold text-white">{tour.name}</h2>
          <p className="mt-1 text-sm text-white/80">{tour.description}</p>
        </div>
      </div>

      {/* Content */}
      <main className="p-4 space-y-4">
        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <Clock className="mx-auto h-5 w-5 text-orange-500" />
            <p className="mt-1 text-xs text-slate-500">Thời lượng</p>
            <p className="text-sm font-semibold text-slate-800">{tour.durationMinutes} phút</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <MapPin className="mx-auto h-5 w-5 text-orange-500" />
            <p className="mt-1 text-xs text-slate-500">Điểm dừng</p>
            <p className="text-sm font-semibold text-slate-800">{tourPOIs.length}</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <Star className="mx-auto h-5 w-5 text-orange-500" />
            <p className="mt-1 text-xs text-slate-500">Đánh giá</p>
            <p className="text-sm font-semibold text-slate-800">4.8</p>
          </div>
        </div>

        {/* Tour Stops */}
        <div>
          <h3 className="mb-3 font-semibold text-slate-900">
            Điểm dừng ({tourPOIs.length})
          </h3>
          <div className="space-y-3">
            {tourPOIs.map((poi, index) => (
              <TourStop
                key={poi.id}
                poi={poi}
                index={index}
                total={tourPOIs.length}
              />
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 font-semibold text-slate-900">Giới thiệu</h3>
          <p className="text-sm text-slate-600">{tour.description}</p>
          <p className="mt-2 text-sm text-slate-600">
            Khám phá các món ăn đường phố độc đáo qua một hành trình được thiết kế
            đặc biệt. Được hướng dẫn bởi Audio Guide đa ngôn ngữ, bạn sẽ trải nghiệm
            văn hóa ẩm thực địa phương một cách chân thực nhất.
          </p>
        </div>
      </main>

      {/* Floating Booking Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 md:bottom-0">
        <button
          onClick={() => setShowBooking(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-semibold text-white shadow-lg shadow-orange-200 transition-colors hover:bg-orange-600"
        >
          <Calendar className="h-5 w-5" />
          Đặt tour miễn phí
        </button>
      </div>

      {/* Modals */}
      <BookingModal
        tour={tour}
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        onConfirm={handleBooking}
      />
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        onStartTour={handleStartTour}
      />
    </div>
  );
}
