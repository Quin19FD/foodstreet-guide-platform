import { VendorLayout } from "@/components/layouts/vendor-layout";

import { VendorPoiManagement } from "./vendor-poi-management";

export default function VendorHomePage() {
  return (
    <VendorLayout>
      <VendorPoiManagement />
    </VendorLayout>
  );
}
