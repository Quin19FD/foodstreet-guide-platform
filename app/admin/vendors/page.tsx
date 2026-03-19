import { AdminLayout } from "@/components/layouts/admin-layout";

import { VendorManagement } from "./vendor-management";

export default function AdminVendorsPage() {
  return (
    <AdminLayout>
      <VendorManagement />
    </AdminLayout>
  );
}
