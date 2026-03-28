import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminMediaManagement } from "./media-management";

export default function AdminMediaPage() {
  return (
    <AdminLayout>
      <AdminMediaManagement />
    </AdminLayout>
  );
}
