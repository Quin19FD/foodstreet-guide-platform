import { Suspense } from "react";

import { AdminLayout } from "@/components/layouts/admin-layout";

import UserManagement from "./user-management";

export const metadata = {
  title: "Quản lý Users - Admin",
  description: "Quản lý tất cả người dùng trong hệ thống",
};

export default function UsersPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Users</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý tất cả người dùng, vendors và admins trong hệ thống. Kích hoạt, vô hiệu hóa,
            duyệt hoặc từ chối tài khoản.
          </p>
        </div>

        {/* User Management Component */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12 text-slate-600">Đang tải...</div>
          }
        >
          <UserManagement />
        </Suspense>
      </div>
    </AdminLayout>
  );
}
