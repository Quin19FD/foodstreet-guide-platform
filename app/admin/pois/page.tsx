import { mockPlatformService } from "@/application/services/mock-platform";
import { AdminLayout } from "@/components/layouts/admin-layout";

export default function AdminPOIsPage() {
  const pois = mockPlatformService.poi.listAll();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Quản lý POI</h1>
        <p className="text-muted-foreground">
          CRUD POI, loại POI, tọa độ GPS và bán kính hiển thị.
        </p>
        <div className="grid gap-4">
          {pois.map((poi) => (
            <div key={poi.id} className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{poi.name}</h2>
                <span className="text-xs text-muted-foreground">{poi.type}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{poi.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
