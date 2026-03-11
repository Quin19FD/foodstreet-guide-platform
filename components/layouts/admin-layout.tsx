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
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mainNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pois", label: "POI Management", icon: MapPin },
  { href: "/admin/tours", label: "Food Tour Management", icon: Compass },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
];

const systemNavItems = [
  { href: "/admin/audio-guides", label: "Audio Guides", icon: Headphones },
  { href: "/admin/translations", label: "Translations", icon: Languages },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[260px] shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold leading-5">Smart Food Street</p>
              <p className="text-xs font-medium text-orange-500">CMS Admin</p>
            </div>
          </div>

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
                        ? "bg-orange-50 text-orange-600"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                System
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
                          ? "bg-orange-50 text-orange-600"
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

          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                  A
                </div>
                <div>
                  <p className="text-sm font-semibold leading-4">Admin User</p>
                  <p className="text-xs text-slate-500">System Admin</p>
                </div>
              </div>
              <button type="button" className="text-slate-400 transition hover:text-slate-700">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            {children}
          </div>
        </main>
      </div>
      <div className="md:hidden">
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <Link href="/admin/dashboard" className="text-sm font-semibold">
            Smart Food Street CMS
          </Link>
        </div>
      </div>
    </div>
  );
}
