import { mockPlatformService } from "@/application/services/mock-platform";
import { AdminLayout } from "@/components/layouts/admin-layout";

export default function AdminAudioGuidesPage() {
  const pois = mockPlatformService.poi.listAll();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Quản lý Audio Guide</h1>
        <p className="text-muted-foreground">Quản lý script, ngôn ngữ và audio TTS cho từng POI.</p>
        <div className="grid gap-4">
          {pois.map((poi) => {
            const guides = mockPlatformService.audioGuide.listByPOI(poi.id);
            return (
              <div key={poi.id} className="rounded-lg border bg-card p-5">
                <h2 className="font-semibold">{poi.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Số audio guide: {guides.length}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
