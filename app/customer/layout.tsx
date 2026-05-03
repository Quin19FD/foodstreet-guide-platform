import { FavoritesProvider } from "@/components/contexts/favorites-context";
import { CustomerBottomNav } from "@/components/features/customer/shared/customer-bottom-nav";
import { CustomerLiteShell } from "@/components/features/customer/shared/customer-lite-shell";
import { CustomerOnlineCounter } from "@/components/features/customer/shared/customer-online-counter";

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
          <CustomerOnlineCounter />
          <CustomerBottomNav />
        </div>
      </CustomerLiteShell>
    </FavoritesProvider>
  );
}
