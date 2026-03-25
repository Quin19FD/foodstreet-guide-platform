import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminTourManagement } from "./tour-management";

export default function AdminToursPage() {
  return (
    <AdminLayout>
      <AdminTourManagement />
    </AdminLayout>
  );
}
