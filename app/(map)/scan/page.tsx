import { MainLayout } from "@/components/layouts/main-layout";

export default function ScanPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Quét QR khu phố</h1>
        <p className="text-muted-foreground">
          Mô-đun quét QR dùng để lấy `district_id` và kích hoạt phiên khám phá theo khu vực.
        </p>
        <div className="rounded-lg border bg-card p-6">
          <p className="font-medium">Luồng chuẩn</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Quét mã QR tại khu phố ẩm thực.</li>
            <li>Đọc `district_id` từ payload.</li>
            <li>Chuyển sang bản đồ khám phá theo GPS.</li>
          </ol>
        </div>
      </div>
    </MainLayout>
  );
}
