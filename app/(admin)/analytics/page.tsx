import { AdminLayout } from "@/components/layouts/admin-layout";
import { mockPlatformService } from "@/application/services/mock-platform";

export default function AdminAnalyticsPage() {
  const totalPOI = mockPlatformService.poi.listAll().length;
  const totalTour = mockPlatformService.tour.list().length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Phân tích hệ thống</h1>
        <p className="text-muted-foreground">
          Theo dõi mức độ sử dụng POI, tour và hành vi khám phá theo GPS.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">Tổng số POI</p>
            <p className="mt-2 text-2xl font-bold">{totalPOI}</p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">Tổng số Tour</p>
            <p className="mt-2 text-2xl font-bold">{totalTour}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
