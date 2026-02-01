/**
 * Admin Layout
 *
 * Layout for admin dashboard pages.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/dashboard", label: "Tổng quan" },
  { href: "/admin/districts", label: "Khu phố" },
  { href: "/admin/pois", label: "Gian hàng" },
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/analytics", label: "Phân tích" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40 hidden md:block">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/admin/dashboard" className="font-bold text-lg">
            Admin
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
          <h1 className="text-lg font-semibold">
            {navItems.find((item) => pathname?.startsWith(item.href))?.label ?? "Dashboard"}
          </h1>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Xem trang web
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
