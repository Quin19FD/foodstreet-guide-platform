import { mockPlatformService } from "@/application/services/mock-platform";
import { MainLayout } from "@/components/layouts/main-layout";
import Link from "next/link";

export default function DistrictsPage() {
  const districts = mockPlatformService.districts.list();

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Khu phố ẩm thực</h1>
        <p className="text-muted-foreground">Chọn khu phố để xem POI và tour tương ứng.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {districts.map((district) => (
            <div key={district.id} className="rounded-lg border bg-card p-5">
              <h2 className="text-lg font-semibold">{district.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{district.description}</p>
              <div className="mt-4 flex gap-3">
                <Link className="text-sm font-medium text-primary" href="/pois">
                  Xem POI
                </Link>
                <Link className="text-sm font-medium text-primary" href="/tours">
                  Xem tour
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
