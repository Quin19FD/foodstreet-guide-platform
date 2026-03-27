import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminPoiManagement } from "./poi-management";

export default function AdminPOIsPage() {
  return (
    <AdminLayout>
      <AdminPoiManagement />
    </AdminLayout>
  );
}