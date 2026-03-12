import { mockPlatformService } from "@/application/services/mock-platform";
import { AdminLayout } from "@/components/layouts/admin-layout";

export default function AdminToursPage() {
  const tours = mockPlatformService.tour.list();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Quản lý Food Tour</h1>
        <p className="text-muted-foreground">
          Tạo/chỉnh sửa tour, gắn POI và sắp xếp thứ tự điểm dừng.
        </p>
        <div className="grid gap-4">
          {tours.map((tour) => (
            <div key={tour.id} className="rounded-lg border bg-card p-5">
              <h2 className="font-semibold">{tour.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{tour.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Duration: {tour.durationMinutes} phút | Stops: {tour.poiIds.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
