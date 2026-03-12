"use client";

import Link from "next/link";
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
} from "lucide-react";

const menuItems = [
  {
    icon: History,
    label: "Lịch sử khám phá",
    description: "Xem các nơi bạn đã ghé thăm",
    href: "/customer/history",
  },
  {
    icon: Star,
    label: "Đánh giá của tôi",
    description: "Quản lý các đánh giá đã viết",
    href: "/customer/reviews",
  },
  {
    icon: Globe,
    label: "Ngôn ngữ",
    description: "Tiếng Việt",
    href: "/customer/language",
    action: "language",
  },
  {
    icon: Bell,
    label: "Thông báo",
    description: "Quản lý thông báo",
    href: "/customer/notifications",
  },
  {
    icon: Settings,
    label: "Cài đặt",
    description: "Cấu hình ứng dụng",
    href: "/customer/settings",
  },
];

function MenuItem({
  icon: Icon,
  label,
  description,
  href,
  onClick,
}: {
  icon: typeof User;
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
        <Icon className="h-5 w-5 text-orange-600" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      {content}
    </button>
  );
}

export default function CustomerProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <header className="bg-gradient-to-br from-orange-500 to-amber-500 px-4 py-8 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Khách tham quan</h1>
            <p className="text-sm text-white/80">Khám phá ẩm thực đường phố</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/20 p-3 text-center backdrop-blur">
            <p className="text-xl font-bold">12</p>
            <p className="text-[10px] text-white/80">Đã ghé</p>
          </div>
          <div className="rounded-xl bg-white/20 p-3 text-center backdrop-blur">
            <p className="text-xl font-bold">5</p>
            <p className="text-[10px] text-white/80">Yêu thích</p>
          </div>
          <div className="rounded-xl bg-white/20 p-3 text-center backdrop-blur">
            <p className="text-xl font-bold">3</p>
            <p className="text-[10px] text-white/80">Tour</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/customer/favorites"
            className="flex items-center gap-2 rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-800">Yêu thích</p>
              <p className="text-xs text-slate-500">5 địa điểm</p>
            </div>
          </Link>
          <Link
            href="/customer/tours"
            className="flex items-center gap-2 rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <User className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-800">Tour của tôi</p>
              <p className="text-xs text-slate-500">3 đã đặt</p>
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
              />
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <button className="flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-red-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <LogOut className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-red-600">Đăng xuất</p>
            <p className="text-xs text-slate-500">Thoát khỏi tài khoản</p>
          </div>
        </button>

        {/* App Info */}
        <div className="text-center">
          <p className="text-xs text-slate-400">Smart Food Street Guide</p>
          <p className="text-[10px] text-slate-300">Version 1.0.0</p>
        </div>
      </main>
    </div>
  );
}
