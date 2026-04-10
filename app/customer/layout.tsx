import { FavoritesProvider } from "@/components/contexts/favorites-context";
import { CustomerBottomNav } from "@/components/features/customer/shared/customer-bottom-nav";
import { CustomerLiteShell } from "@/components/features/customer/shared/customer-lite-shell";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FavoritesProvider>
      <CustomerLiteShell>
        <div className="min-h-screen bg-slate-50 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
          <CustomerBottomNav />
        </div>
      </CustomerLiteShell>
    </FavoritesProvider>
  );
}
