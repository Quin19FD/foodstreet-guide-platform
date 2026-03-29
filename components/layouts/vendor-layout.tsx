"use client";

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MapPin,
  Package,
  Settings,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const mainNavItems = [
  { href: "/vendor", label: "Dashboard", icon: BarChart3, color: "from-orange-500 to-orange-600" },
  {
    href: "/vendor/pois",
    label: "Địa điểm POI",
    icon: MapPin,
    color: "from-emerald-500 to-emerald-600",
  },
  {
    href: "/vendor/products",
    label: "Sản phẩm",
    icon: Package,
    color: "from-teal-500 to-teal-600",
  },
  {
    href: "/vendor/settings",
    label: "Cài đặt",
    icon: Settings,
    color: "from-gray-500 to-gray-600",
  },
];

type VendorMeResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

export function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [vendor, setVendor] = useState<VendorMeResponse["user"] | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const vendorInitial = useMemo(() => {
    const source = vendor?.name?.trim() || "Vendor";
    return source.slice(0, 1).toUpperCase();
  }, [vendor?.name]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const me = await fetch("/api/vendor/auth/me").catch(() => null);
      if (me?.ok) {
        const data = (await me.json().catch(() => null)) as VendorMeResponse | null;
        if (isMounted && data?.user) setVendor(data.user);
        return;
      }

      const refreshed = await fetch("/api/vendor/auth/refresh", { method: "POST" }).catch(
        () => null
      );
      if (!refreshed?.ok) {
        router.replace("/vendor/login");
        return;
      }

      const meAfter = await fetch("/api/vendor/auth/me").catch(() => null);
      if (!meAfter?.ok) {
        router.replace("/vendor/login");
        return;
      }

      const data = (await meAfter.json().catch(() => null)) as VendorMeResponse | null;
      if (isMounted && data?.user) setVendor(data.user);
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/vendor/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/vendor/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/30 text-slate-800">
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
              <Store className="h-5 w-5" />
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                FS
              </div>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold leading-5 bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                  FoodStreet
                </p>
                <p className="text-xs font-semibold text-orange-600/80">Vendor Portal</p>
              </div>
            )}
            <button
              type="button"
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
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Menu chính
                </p>
              )}
              <nav className="space-y-1">
                {mainNavItems.map((item) => {
                  // Exact match for dashboard, startsWith for others
                  const isActive =
                    item.href === "/vendor"
                      ? pathname === item.href
                      : pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white shadow-lg" />
                      )}
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-lg ${
                          isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"
                        } ${isCollapsed ? "mx-auto" : ""}`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? "text-white" : ""}`} />
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
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-sm font-bold text-white shadow-md">
                  {vendorInitial}
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-green-500" />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight text-slate-900 truncate">
                      {vendor?.name ?? "Vendor User"}
                    </p>
                    <p className="text-xs font-medium text-slate-500 truncate">Vendor Partner</p>
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
          <Link href="/vendor" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              FoodStreet
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
        {/* Mobile Navigation */}
        <div className="flex gap-1 overflow-x-auto border-t border-slate-100/50 bg-slate-50/50 px-2 py-2">
          {mainNavItems.map((item) => {
            // Exact match for dashboard, startsWith for others
            const isActive =
              item.href === "/vendor" ? pathname === item.href : pathname?.startsWith(item.href);
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
