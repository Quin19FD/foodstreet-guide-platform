import { AdminLayout } from "@/components/layouts/admin-layout";
import { mockPlatformService } from "@/application/services/mock-platform";

export default function AdminDistrictsPage() {
  const districts = mockPlatformService.districts.list();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Quản lý Khu phố</h1>
        <div className="grid gap-4">
          {districts.map((district) => (
            <div key={district.id} className="rounded-lg border bg-card p-5">
              <h2 className="font-semibold">{district.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{district.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
