import { MainLayout } from "@/components/layouts/main-layout";
import { mockPlatformService } from "@/application/services/mock-platform";

export default function ToursPage() {
  const tours = mockPlatformService.tour.list();

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Food Tour</h1>
        <p className="text-muted-foreground">Gợi ý tuyến khám phá gồm nhiều POI theo thứ tự.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {tours.map((tour) => (
            <div key={tour.id} className="rounded-lg border bg-card p-5">
              <h2 className="text-lg font-semibold">{tour.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{tour.description}</p>
              <p className="mt-3 text-sm">
                <span className="font-medium">Thời lượng:</span> {tour.durationMinutes} phút
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium">Số điểm dừng:</span> {tour.poiIds.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
