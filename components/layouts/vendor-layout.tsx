/**
 * Vendor Layout
 *
 * Layout for vendor dashboard pages.
 */

"use client";

import {
  FileText,
  LogOut,
  MapPin,
  Settings,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const mainNavItems = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/pois", label: "My POIs", icon: MapPin },
];

const systemNavItems = [
  { href: "/vendor/translations", label: "Multi-language", icon: FileText },
  { href: "/vendor/settings", label: "Settings", icon: Settings },
];

type VendorMeResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
  };
};

export function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [vendor, setVendor] = useState<VendorMeResponse["user"] | null>(null);
  const [loading, setLoading] = useState(true);

  const vendorInitial = useMemo(() => {
    const source = vendor?.name?.trim() || "Vendor";
    return source.slice(0, 1).toUpperCase();
  }, [vendor?.name]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const me = await fetch("/api/vendor/auth/me").catch(() => null);
        if (me?.ok) {
          const data = (await me.json().catch(() => null)) as VendorMeResponse | null;
          if (isMounted && data?.user) {
            setVendor(data.user);
            setLoading(false);
            return;
          }
        }

        const refreshed = await fetch("/api/vendor/auth/refresh", { method: "POST" }).catch(
          () => null
        );
        if (!refreshed?.ok) {
          if (isMounted) router.replace("/vendor/login");
          return;
        }

        const meAfter = await fetch("/api/vendor/auth/me").catch(() => null);
        if (!meAfter?.ok) {
          if (isMounted) router.replace("/vendor/login");
          return;
        }

        const data = (await meAfter.json().catch(() => null)) as VendorMeResponse | null;
        if (isMounted && data?.user) {
          setVendor(data.user);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
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
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {/* Sidebar */}
        <aside className="hidden w-[260px] shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold leading-5">FoodStreet</p>
              <p className="text-xs font-medium text-blue-500">Vendor Portal</p>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 space-y-7 px-4 py-5">
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* System Navigation */}
            <div>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Management
              </p>
              <nav className="space-y-1">
                {systemNavItems.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* User Profile */}
          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                  {vendorInitial}
                </div>
                <div className="truncate">
                  <p className="truncate text-sm font-semibold leading-4">
                    {vendor?.name ?? "Vendor User"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 transition hover:text-slate-700"
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
          <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">Loading...</p>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <Link href="/vendor/dashboard" className="text-sm font-semibold">
            FoodStreet Vendor
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
