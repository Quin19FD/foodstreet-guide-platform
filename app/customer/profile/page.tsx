"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  User,
  Settings,
  History,
  Heart,
  Star,
  Globe,
  Bell,
  ChevronRight,
  LogOut,
  MapPin,
  Clock,
  Trophy,
  TrendingUp,
  Loader2,
} from "lucide-react";

const menuItems = [
  {
    icon: History,
    label: "Lịch sử khám phá",
    description: "Xem các nơi bạn đã ghé thăm",
    href: "/customer/history",
    color: "blue",
  },
  {
    icon: Star,
    label: "Đánh giá của tôi",
    description: "Quản lý các đánh giá đã viết",
    href: "/customer/reviews",
    color: "amber",
  },
  {
    icon: Globe,
    label: "Ngôn ngữ",
    description: "Tiếng Việt",
    href: "/customer/language",
    action: "language",
    color: "emerald",
  },
  {
    icon: Bell,
    label: "Thông báo",
    description: "Quản lý thông báo",
    href: "/customer/notifications",
    color: "purple",
  },
  {
    icon: Settings,
    label: "Cài đặt",
    description: "Cấu hình ứng dụng",
    href: "/customer/settings",
    color: "slate",
  },
];

const colorMap = {
  blue: "bg-blue-100 text-blue-600",
  amber: "bg-amber-100 text-amber-600",
  emerald: "bg-emerald-100 text-emerald-600",
  purple: "bg-purple-100 text-purple-600",
  slate: "bg-slate-100 text-slate-600",
  red: "bg-red-100 text-red-600",
  orange: "bg-orange-100 text-orange-600",
};

type UserStats = {
  visitedCount: number;
  favoriteCount: number;
  tourBookings: number;
  reviewCount: number;
};

function MenuItem({
  icon: Icon,
  label,
  description,
  href,
  color = "slate",
  onClick,
}: {
  icon: typeof User;
  label: string;
  description: string;
  href?: string;
  color?: keyof typeof colorMap;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${colorMap[color]} transition-transform duration-200 group-hover:scale-110`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 truncate">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft hover:shadow-medium transition-all duration-200 active:scale-[0.98]"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-soft hover:shadow-medium transition-all duration-200 active:scale-[0.98]"
    >
      {content}
    </button>
  );
}

export default function CustomerProfilePage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Logout handler
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/customer/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        // Redirect to login page
        window.location.href = "/customer/login";
      } else {
        console.error("Logout failed");
        // Still redirect on error to clear local state
        window.location.href = "/customer/login";
      }
    } catch (err) {
      console.error("Logout error:", err);
      // Still redirect on error
      window.location.href = "/customer/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Fetch user stats from API
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/customer/stats");
      const data = (await res.json()) as {
        stats?: UserStats;
      };

      if (!res.ok) {
        // If stats API fails (not logged in), use default values
        setStats({
          visitedCount: 0,
          favoriteCount: 0,
          tourBookings: 0,
          reviewCount: 0,
        });
        return;
      }

      setStats(data.stats ?? null);
    } catch (err) {
      console.error("Error fetching stats:", err);
      // On error, show zeros instead of failing completely
      setStats({
        visitedCount: 0,
        favoriteCount: 0,
        tourBookings: 0,
        reviewCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Animated Gradient Header */}
      <header className="gradient-animated px-4 pt-8 pb-12 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/30 animate-float" />
          <div className="absolute bottom-8 left-8 h-24 w-24 rounded-full bg-white/20 animate-float" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10">
          {/* User Info */}
          <div className="flex items-center gap-4 animate-fade-in-up">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                <User className="h-10 w-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 border-2 border-white shadow-sm">
                <Trophy className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold">Khách tham quan</h1>
              <p className="text-sm text-white/80">Khám phá ẩm thực đường phố</p>
              <span className="inline-flex items-center gap-1 mt-1 text-xs bg-white/20 rounded-full px-2 py-1 backdrop-blur-sm">
                <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                Thành viên tích cực
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="animate-fade-in-up opacity-0 rounded-2xl bg-white/20 p-3 text-center backdrop-blur-sm hover:bg-white/25 transition-colors" style={{ animationDelay: "100ms" }}>
              {isLoading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats?.visitedCount ?? 0}</p>
                  <p className="text-[10px] text-white/80">Đã ghé</p>
                </>
              )}
              <MapPin className="mx-auto mt-1 h-3 w-3 text-white/60" />
            </div>
            <div className="animate-fade-in-up opacity-0 rounded-2xl bg-white/20 p-3 text-center backdrop-blur-sm hover:bg-white/25 transition-colors" style={{ animationDelay: "200ms" }}>
              {isLoading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats?.favoriteCount ?? 0}</p>
                  <p className="text-[10px] text-white/80">Yêu thích</p>
                </>
              )}
              <Heart className="mx-auto mt-1 h-3 w-3 text-white/60" />
            </div>
            <div className="animate-fade-in-up opacity-0 rounded-2xl bg-white/20 p-3 text-center backdrop-blur-sm hover:bg-white/25 transition-colors" style={{ animationDelay: "300ms" }}>
              {isLoading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats?.tourBookings ?? 0}</p>
                  <p className="text-[10px] text-white/80">Tour</p>
                </>
              )}
              <Clock className="mx-auto mt-1 h-3 w-3 text-white/60" />
            </div>
          </div>
        </div>
      </header>

      {/* Achievement Badges */}
      <section className="px-4 -mt-4 relative z-20 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Thành tích</h3>
            <Link href="/customer/achievements" className="text-xs font-medium text-orange-500 hover:text-orange-600">
              Xem tất cả
            </Link>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Star className="h-6 w-6 fill-amber-400" />
              </div>
              <span className="mt-1 text-[10px] text-slate-600">Khám phá</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <span className="mt-1 text-[10px] text-slate-600">Tích cực</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <MapPin className="h-6 w-6" />
              </div>
              <span className="mt-1 text-[10px] text-slate-600">Explorer</span>
            </div>
            <div className="flex flex-col items-center opacity-40">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Trophy className="h-6 w-6" />
              </div>
              <span className="mt-1 text-[10px] text-slate-400">???</span>
            </div>
          </div>
        </div>
      </section>

      <main className="p-4 space-y-4 animate-fade-in-up" style={{ animationDelay: "500ms" }}>
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/customer/favorites"
            className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-pink-100 text-red-500 group-hover:scale-110 transition-transform">
              <Heart className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-800">Yêu thích</p>
              <p className="text-xs text-slate-500">
                {isLoading ? "..." : `${stats?.favoriteCount ?? 0} địa điểm`}
              </p>
            </div>
          </Link>
          <Link
            href="/customer/tours"
            className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-500 group-hover:scale-110 transition-transform">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-800">Tour của tôi</p>
              <p className="text-xs text-slate-500">
                {isLoading ? "..." : `${stats?.tourBookings ?? 0} đã đặt`}
              </p>
            </div>
          </Link>
        </div>

        {/* Menu Items */}
        <div>
          <h2 className="mb-3 px-1 text-sm font-semibold text-slate-700">Tài khoản</h2>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <MenuItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                description={item.description}
                href={item.href}
                color={item.color as keyof typeof colorMap}
              />
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="group flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-soft hover:shadow-red-100 hover:bg-red-50 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500 group-hover:scale-110 transition-transform">
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-red-600">
              {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </p>
            <p className="text-xs text-slate-500">Thoát khỏi tài khoản</p>
          </div>
        </button>

        {/* App Info */}
        <div className="text-center py-2">
          <p className="text-sm font-medium text-slate-700">Smart Food Street Guide</p>
          <p className="text-xs text-slate-400">Version 1.0.0 • Made with ❤️</p>
        </div>
      </main>
    </div>
  );
}
