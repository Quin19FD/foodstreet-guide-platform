import { mockPlatformService } from "@/application/services/mock-platform";
import { AdminLayout } from "@/components/layouts/admin-layout";

export default function AdminTranslationsPage() {
  const translations = mockPlatformService.translation.list();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Quản lý Đa Ngôn Ngữ</h1>
        <p className="text-muted-foreground">Quản lý bản dịch cho POI, Audio Guide và Tour.</p>
        <div className="rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left">Entity</th>
                <th className="px-4 py-3 text-left">Field</th>
                <th className="px-4 py-3 text-left">Language</th>
                <th className="px-4 py-3 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {translations.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    {item.entityType}:{item.entityId}
                  </td>
                  <td className="px-4 py-3">{item.field}</td>
                  <td className="px-4 py-3">{item.language}</td>
                  <td className="px-4 py-3">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
