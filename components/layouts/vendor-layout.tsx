"use client";

import { LogOut, MapPin, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const vendorNavItems = [
  { href: "/vendor", label: "POI Management", icon: MapPin },
  { href: "/vendor/settings", label: "Settings", icon: Settings },
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

      const refreshed = await fetch("/api/vendor/auth/refresh", { method: "POST" }).catch(() => null);
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
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[260px] shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold leading-5">Smart Food Street</p>
              <p className="text-xs font-medium text-orange-500">Vendor Portal</p>
            </div>
          </div>

          <div className="flex-1 space-y-7 px-4 py-5">
            <nav className="space-y-1">
              {vendorNavItems.map((item) => {
                const isActive = item.href === "/vendor"
                  ? pathname === "/vendor"
                  : pathname?.startsWith(item.href);
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

          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                  {vendorInitial}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-4">{vendor?.name ?? "Vendor User"}</p>
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

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            {children}
          </div>
        </main>
      </div>

      <div className="md:hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <Link href="/vendor" className="text-sm font-semibold">
            Smart Food Street Vendor
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
