import { Construction, MapPin } from "lucide-react";

import { AdminLayout } from "@/components/layouts/admin-layout";

export default function AdminDistrictsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 p-3 text-white shadow-lg">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quản lý Khu phố</h1>
              <p className="mt-1 text-sm text-slate-600">
                Phân chia và quản lý các khu phố ẩm thực
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-slate-200 p-6">
              <Construction className="h-12 w-12 text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Tính năng đang phát triển</h2>
              <p className="mt-2 text-sm text-slate-600 max-w-md">
                Tính năng quản lý khu phố hiện tại chưa được triển khai. Hệ thống đang sử dụng phân
                loại theo <strong>Category</strong> để phân loại địa điểm.
              </p>
              <p className="mt-4 text-xs text-slate-500">
                Bạn có thể quản lý category của các POI trong trang{" "}
                <a href="/admin/pois" className="text-blue-600 hover:underline">
                  Quản lý Địa điểm POI
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
