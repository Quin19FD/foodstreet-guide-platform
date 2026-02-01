/**
 * Admin Dashboard Page
 *
 * Main dashboard for admin users.
 */

import { AdminLayout } from "@/components/layouts/admin-layout";

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tổng quan</h1>
          <p className="text-muted-foreground">Xem thống kê và hoạt động gần đây</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card rounded-lg border p-6">
            <div className="text-sm font-medium text-muted-foreground">Tổng gian hàng</div>
            <div className="text-2xl font-bold mt-2">0</div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-sm font-medium text-muted-foreground">Đơn hàng hôm nay</div>
            <div className="text-2xl font-bold mt-2">0</div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-sm font-medium text-muted-foreground">Doanh thu</div>
            <div className="text-2xl font-bold mt-2">0 ₫</div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-sm font-medium text-muted-foreground">Người dùng</div>
            <div className="text-2xl font-bold mt-2">0</div>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold">Đơn hàng 7 ngày qua</h3>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Chart placeholder
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold">Top gian hàng</h3>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Chart placeholder
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
