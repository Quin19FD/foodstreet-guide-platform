import { AdminLayout } from "@/components/layouts/admin-layout";
import { config } from "@/shared/config";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Cấu hình môi trường hệ thống đang dùng trong dự án hiện tại.
        </p>

        <div className="rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold">Application</h2>
          <p className="mt-2 text-sm text-slate-600">Name: {config.app.name}</p>
          <p className="mt-1 text-sm text-slate-600">Environment: {config.app.environment}</p>
          <p className="mt-1 text-sm text-slate-600">URL: {config.app.url}</p>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold">Map</h2>
          <p className="mt-2 text-sm text-slate-600">
            Default Center: {config.map.defaultCenter.latitude}, {config.map.defaultCenter.longitude}
          </p>
          <p className="mt-1 text-sm text-slate-600">Default Zoom: {config.map.defaultZoom}</p>
        </div>
      </div>
    </AdminLayout>
  );
}
