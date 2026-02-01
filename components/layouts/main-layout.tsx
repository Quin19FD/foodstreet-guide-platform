/**
 * Main Layout
 *
 * Layout for user-facing pages (map, POI, etc.)
 */

"use client";

import Link from "next/link";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg">FoodStreet</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/map" className="transition-colors hover:text-primary">
              Bản đồ
            </Link>
            <Link href="/pois" className="transition-colors hover:text-primary">
              Danh sách
            </Link>
            <Link href="/orders" className="transition-colors hover:text-primary">
              Đơn hàng
            </Link>
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 FoodStreet Guide. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
