import { CustomerBottomNav } from "@/components/features/customer/shared/customer-bottom-nav";
import { FavoritesProvider } from "@/components/contexts/favorites-context";
import { cn } from "@/shared/utils";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FavoritesProvider>
      <div className="min-h-screen bg-slate-50 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
        <CustomerBottomNav />
      </div>
    </FavoritesProvider>
  );
}
