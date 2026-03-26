"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Compass,
  Heart,
  User,
  Home,
} from "lucide-react";
import { cn } from "@/shared/utils";

const navItems = [
  { href: "/customer", label: "Khám phá", icon: Home },
  { href: "/customer/map", label: "Bản đồ", icon: MapPin },
  { href: "/customer/tours", label: "Tour", icon: Compass },
  { href: "/customer/favorites", label: "Yêu thích", icon: Heart },
  { href: "/customer/profile", label: "Cá nhân", icon: User },
];

export function CustomerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 pt-2 backdrop-blur md:hidden">
      <div className="flex justify-around pb-[calc(0.35rem+env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-colors active:scale-[0.98]",
                isActive
                  ? "bg-orange-50 text-orange-500"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
