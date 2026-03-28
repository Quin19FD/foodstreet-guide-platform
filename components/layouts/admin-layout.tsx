/**
 * Admin Layout
 *
 * Layout for admin dashboard pages.
 */

"use client";

import {
  BarChart3,
  Compass,
  Headphones,
  ImageIcon,
  Languages,
  LayoutDashboard,
  LogOut,
  MapPin,
  ScrollText,
  Settings,
  Store,
  Users,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const mainNavItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "from-blue-500 to-blue-600",
  },
  {
    href: "/admin/pois",
    label: "Địa điểm POI",
    icon: MapPin,
    color: "from-emerald-500 to-emerald-600",
  },
  { href: "/admin/tours", label: "Food Tours", icon: Compass, color: "from-teal-500 to-teal-600" },
  {
    href: "/admin/media",
    label: "Thư viện Media",
    icon: ImageIcon,
    color: "from-indigo-500 to-indigo-600",
  },
  {
    href: "/admin/vendors",
    label: "Nhà cung cấp",
    icon: Store,
    color: "from-orange-500 to-orange-600",
  },
  {
    href: "/admin/users",
    label: "Quản lý Users",
    icon: Users,
    color: "from-purple-500 to-purple-600",
  },
];

const systemNavItems = [
  {
    href: "/admin/audio-guides",
    label: "Audio Guides",
    icon: Headphones,
    color: "from-cyan-500 to-cyan-600",
  },
  {
    href: "/admin/translations",
    label: "Bản dịch",
    icon: Languages,
    color: "from-pink-500 to-pink-600",
  },
  {
    href: "/admin/analytics",
    label: "Phân tích",
    icon: BarChart3,
    color: "from-violet-500 to-violet-600",
  },
  {
    href: "/admin/activity-logs",
    label: "Nhật ký",
    icon: ScrollText,
    color: "from-slate-500 to-slate-600",
  },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings, color: "from-gray-500 to-gray-600" },
];

type AdminMeResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminMeResponse["user"] | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const adminInitial = useMemo(() => {
    const source = admin?.name?.trim() || "Admin";
    return source.slice(0, 1).toUpperCase();
  }, [admin?.name]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const me = await fetch("/api/admin/session/me").catch(() => null);
      if (me?.ok) {
        const data = (await me.json().catch(() => null)) as AdminMeResponse | null;
        if (isMounted && data?.user) setAdmin(data.user);
        return;
      }

      const refreshed = await fetch("/api/admin/session/refresh", { method: "POST" }).catch(
        () => null
      );
      if (!refreshed?.ok) {
        router.replace("/admin/login");
        return;
      }

      const meAfter = await fetch("/api/admin/session/me").catch(() => null);
      if (!meAfter?.ok) {
        router.replace("/admin/login");
        return;
      }

      const data = (await meAfter.json().catch(() => null)) as AdminMeResponse | null;
      if (isMounted && data?.user) setAdmin(data.user);
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Fetch pending POIs count
  useEffect(() => {
    fetch("/api/admin/pois?take=1&skip=0&status=PENDING", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.total) {
          setPendingCount(data.total);
        }
      })
      .catch(() => {
        // Ignore error
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/session/logout", { method: "POST" }).catch(() => null);
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        {/* Enhanced Sidebar */}
        <aside
          className={`hidden border-r border-white/20 bg-gradient-to-b from-white via-white to-slate-50/50 backdrop-blur-xl md:flex md:flex-col transition-all duration-300 ${
            isCollapsed ? "w-20" : "w-[280px]"
          } shadow-xl shadow-slate-200/50`}
        >
          {/* Header */}
          <div className="flex h-20 items-center gap-3 border-b border-slate-100/50 px-5 bg-gradient-to-r from-orange-500/10 to-transparent">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30">
              <MapPin className="h-5 w-5" />
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                FS
              </div>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold leading-5 bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                  FoodStreet
                </p>
                <p className="text-xs font-semibold text-orange-600/80">Admin Platform</p>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 space-y-6 px-4 py-6 overflow-y-auto">
            {/* Main Navigation */}
            <div>
              {!isCollapsed && (
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Menu chính
                  </p>
                  {pendingCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </div>
              )}
              <nav className="space-y-1">
                {mainNavItems.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                          : "text-slate-600 hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent hover:text-slate-900"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white shadow-lg" />
                      )}
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-lg ${
                          isActive
                            ? "bg-white/20"
                            : `bg-gradient-to-br ${item.color} text-white shadow-md`
                        } ${isCollapsed ? "mx-auto" : ""}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                      {!isCollapsed && item.href === "/admin/pois" && pendingCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                          {pendingCount > 99 ? "99+" : pendingCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* System Navigation */}
            <div>
              {!isCollapsed && (
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Hệ thống
                </p>
              )}
              <nav className="space-y-1">
                {systemNavItems.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30"
                          : "text-slate-600 hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent hover:text-slate-900"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white shadow-lg" />
                      )}
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-lg ${
                          isActive
                            ? "bg-white/20"
                            : `bg-gradient-to-br ${item.color} text-white shadow-md`
                        } ${isCollapsed ? "mx-auto" : ""}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* User Profile */}
          <div className="border-t border-slate-100/50 p-4 bg-gradient-to-r from-slate-50 to-transparent">
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-sm font-bold text-white shadow-md">
                  {adminInitial}
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-green-500" />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight text-slate-900 truncate">
                      {admin?.name ?? "Admin User"}
                    </p>
                    <p className="text-xs font-medium text-slate-500 truncate">Administrator</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                onClick={handleLogout}
                title="Đăng xuất"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <div className="h-full rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl p-4 shadow-xl shadow-slate-200/50 md:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 border-b border-slate-200/50 bg-white/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              FoodStreet
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Link
                href="/admin/pois"
                className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              </Link>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
        {/* Mobile Navigation */}
        <div className="flex gap-1 overflow-x-auto border-t border-slate-100/50 bg-slate-50/50 px-2 py-2">
          {mainNavItems.slice(0, 5).map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                    : "bg-white text-slate-600 shadow-sm"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
