/**
 * Map Page
 *
 * Main map view showing POIs nearby.
 */

import { MainLayout } from "@/components/layouts/main-layout";
import { mockPlatformService } from "@/application/services/mock-platform";

export default function MapPage() {
  const pois = mockPlatformService.poi.listAll();
  const nearest = mockPlatformService.location.nearestPOI({
    latitude: 10.7757,
    longitude: 106.7011,
    districtId: "d1",
  });

  return (
    <MainLayout>
      <div className="h-full space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bản đồ ẩm thực</h1>
          <button type="button" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            Quét QR
          </button>
        </div>

        {/* Map Container */}
        <div className="h-[calc(100vh-200px)] bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground px-4">
            <p className="text-lg">Bản đồ sẽ hiển thị tại đây</p>
            <p className="text-sm mt-2">Hiển thị vị trí người dùng + toàn bộ POI + khoảng cách</p>
            {nearest && (
              <p className="text-sm mt-3">
                POI gần nhất hiện tại: <span className="font-semibold text-foreground">{nearest.name}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">Audio Guide</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tự động phát khi vào bán kính POI, hỗ trợ chọn ngôn ngữ và phát lại/tạm dừng.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">POI đang hiển thị</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tổng số điểm: {pois.length}
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
