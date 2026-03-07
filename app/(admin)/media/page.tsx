import { AdminLayout } from "@/components/layouts/admin-layout";
import { mockPlatformService } from "@/application/services/mock-platform";

export default function AdminMediaPage() {
  const pois = mockPlatformService.poi.listAll();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <p className="text-muted-foreground">
          Quản lý hình ảnh minh họa cho POI và liên kết audio guide theo từng điểm.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {pois.map((poi) => (
            <div key={poi.id} className="rounded-xl border border-slate-200 p-4">
              <h2 className="font-semibold">{poi.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{poi.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                Image: {poi.imageUrl ?? "Chưa có"} | Audio guides:{" "}
                {mockPlatformService.audioGuide.listByPOI(poi.id).length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
