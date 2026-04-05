"use client";

import { cn } from "@/shared/utils";
import { Compass, Heart, Home, MapPin, QrCode, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/customer", label: "Khám phá", icon: Home },
  { href: "/customer/map", label: "Bản đồ", icon: MapPin },
  { href: "/customer/scan", label: "Quét QR", icon: QrCode },
  { href: "/customer/tours", label: "Tour", icon: Compass },
  { href: "/customer/favorites", label: "Yêu thích", icon: Heart },
  { href: "/customer/profile", label: "Cá nhân", icon: User },
];

export function CustomerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 px-2 pt-2 backdrop-blur-md md:hidden safe-area-bottom">
      <div className="flex justify-around pb-[calc(0.35rem+env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 active:scale-[0.95]",
                isActive
                  ? "text-orange-500"
                  : "text-slate-400 hover:text-slate-600 active:bg-slate-50"
              )}
            >
              {/* Active indicator background */}
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-orange-50/80 animate-fade-in" />
              )}

              {/* Icon container with bounce animation on active */}
              <span
                className={cn(
                  "relative flex items-center justify-center transition-transform duration-200",
                  isActive && "animate-bounce-subtle"
                )}
              >
                <Icon
                  className="h-5 w-5 transition-all duration-200"
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {/* Active dot indicator */}
                {isActive && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-orange-500 animate-pulse-soft" />
                )}
              </span>

              {/* Label */}
              <span
                className={cn(
                  "relative text-[11px] font-medium leading-none transition-all duration-200",
                  isActive ? "text-orange-600 font-semibold" : "text-slate-500"
                )}
              >
                {item.label}
              </span>

              {/* Ripple effect container */}
              <span className="absolute inset-0 rounded-xl ripple-effect" />
            </Link>
          );
        })}
      </div>

      {/* Safe area spacer for iOS */}
      <style>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0.35rem);
        }
      `}</style>
    </nav>
  );
}
