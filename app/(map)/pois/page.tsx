import { mockPlatformService } from "@/application/services/mock-platform";
import { MainLayout } from "@/components/layouts/main-layout";

export default function POIsPage() {
  const pois = mockPlatformService.poi.listAll();

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Danh sách POI</h1>
        <p className="text-muted-foreground">
          Bao gồm gian hàng ẩm thực và tiện ích hỗ trợ, có khoảng cách theo GPS khi bật định vị.
        </p>
        <div className="grid gap-4">
          {pois.map((poi) => (
            <div key={poi.id} className="rounded-lg border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{poi.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{poi.description}</p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {poi.type === "FOOD_STALL" ? "Food Stall" : "Supporting Facility"}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                GPS: {poi.latitude}, {poi.longitude} | Display radius: {poi.displayRadius}m
              </p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
