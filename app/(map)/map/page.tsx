/**
 * Map Page
 *
 * Main map view showing POIs nearby.
 */

import { MainLayout } from "@/components/layouts/main-layout";

export default function MapPage() {
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
          <div className="text-center text-muted-foreground">
            <p className="text-lg">Bản đồ sẽ hiển thị tại đây</p>
            <p className="text-sm mt-2">Mapbox GL JS integration pending</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
