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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-2 py-1 md:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                isActive
                  ? "text-orange-500"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
