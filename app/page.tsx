/**
 * Home Page
 *
 * Landing page with QR scanner entry point.
 */

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo / Branding */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-primary">FoodStreet Guide</h1>
          <p className="text-muted-foreground">Khám phá ẩm thực đường phố thông minh</p>
        </div>

        {/* QR Scanner Entry */}
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div className="w-32 h-32 mx-auto bg-muted rounded-lg flex items-center justify-center">
            <span className="text-4xl">📱</span>
          </div>
          <h2 className="text-xl font-semibold">Quét mã QR để bắt đầu</h2>
          <p className="text-sm text-muted-foreground">
            Quét mã QR của khu phố để khám phá các gian hàng ẩm thực xung quanh bạn
          </p>
          <Link
            href="/map"
            className="inline-block w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Quét mã QR
          </Link>
        </div>

        {/* Feature Links */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/map"
            className="p-4 bg-card rounded-lg border hover:border-primary transition-colors"
          >
            <span className="text-2xl">🗺️</span>
            <p className="text-sm font-medium mt-2">Bản đồ</p>
          </Link>
          <Link
            href="/admin/dashboard"
            className="p-4 bg-card rounded-lg border hover:border-primary transition-colors"
          >
            <span className="text-2xl">⚙️</span>
            <p className="text-sm font-medium mt-2">Quản trị</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
