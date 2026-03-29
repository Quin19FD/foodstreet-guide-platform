import { cn } from "@/lib/utils";

/**
 * Loading Skeleton Components
 * Reusable skeleton loaders for various UI elements
 */

interface BaseSkeletonProps {
  className?: string;
}

/**
 * Text Skeleton - For loading text content
 */
export function SkeletonText({
  className,
  width = "100%",
  lines = 1,
}: BaseSkeletonProps & { width?: string; lines?: number }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={`line-${i}`}
          className="skeleton-text"
          style={{
            width: i === lines - 1 && lines > 1 ? "70%" : width,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Circle Skeleton - For avatars, icons, etc.
 */
export function SkeletonCircle({
  className,
  size = "md",
}: BaseSkeletonProps & { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-20 w-20",
  };

  return <div className={cn("skeleton-circle", sizeClasses[size], className)} />;
}

/**
 * Card Skeleton - For POI/Tour cards
 */
export function SkeletonCard({
  className,
  withImage = true,
}: BaseSkeletonProps & { withImage?: boolean }) {
  return (
    <div className={cn("rounded-2xl bg-white p-4 shadow-soft", className)}>
      {withImage && <div className="skeleton-card mb-3 h-32 w-full rounded-xl" />}
      <SkeletonText width="80%" lines={2} />
      <div className="mt-3 flex items-center gap-2">
        <SkeletonCircle size="sm" />
        <SkeletonText width="60px" />
      </div>
    </div>
  );
}

/**
 * POI Card Skeleton - Specifically for POI listings
 */
export function SkeletonPOICard({ className }: BaseSkeletonProps) {
  return (
    <div
      className={cn("animate-fade-in-up rounded-2xl bg-white p-4 shadow-soft opacity-0", className)}
      style={{ animationDelay: "100ms" }}
    >
      {/* Image */}
      <div className="skeleton-card mb-3 aspect-video w-full rounded-xl" />

      {/* Title */}
      <div className="skeleton-text mb-2 h-5 w-3/4" />

      {/* Description */}
      <SkeletonText lines={2} className="mb-3" />

      {/* Meta info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="skeleton-circle h-4 w-4" />
          <div className="skeleton-text h-4 w-16" />
        </div>
        <div className="skeleton h-6 w-12 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Tour Card Skeleton - For tour listings
 */
export function SkeletonTourCard({ className }: BaseSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-fade-in-up block rounded-2xl bg-white p-4 shadow-soft opacity-0",
        className
      )}
      style={{ animationDelay: "100ms" }}
    >
      {/* Title */}
      <div className="skeleton-text mb-2 h-5 w-2/3" />

      {/* Description */}
      <SkeletonText lines={2} className="mb-3" />

      {/* Stats */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="skeleton-circle h-4 w-4" />
          <div className="skeleton-text h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

/**
 * Hero Section Skeleton
 */
export function SkeletonHero({ className }: BaseSkeletonProps) {
  return (
    <div className={cn("gradient-hero px-4 py-8 text-white", className)}>
      <div className="space-y-3">
        <div className="skeleton h-8 w-48 rounded-lg bg-white/20" />
        <div className="skeleton h-4 w-64 rounded bg-white/20" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <div className="skeleton h-11 rounded-xl bg-white/20" />
        <div className="skeleton h-11 rounded-xl bg-white/20" />
      </div>

      <div className="mt-3">
        <div className="skeleton h-11 w-full rounded-xl bg-white/20" />
      </div>
    </div>
  );
}

/**
 * Stats Card Skeleton - For profile stats
 */
export function SkeletonStatsCard({ className }: BaseSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-fade-in-up rounded-xl bg-white/20 p-3 backdrop-blur opacity-0",
        className
      )}
    >
      <div className="skeleton h-6 w-8 rounded bg-white/30" />
      <div className="skeleton mt-1 h-3 w-12 rounded bg-white/20" />
    </div>
  );
}

/**
 * Menu Item Skeleton - For profile menu
 */
export function SkeletonMenuItem({ className }: BaseSkeletonProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl bg-white p-3 shadow-soft", className)}>
      <div className="skeleton-circle h-10 w-10" />
      <div className="flex-1">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton mt-1 h-3 w-48" />
      </div>
    </div>
  );
}

/**
 * Grid Skeleton Container - For loading states
 */
export function SkeletonGrid({
  count = 6,
  skeleton: Skeleton = SkeletonPOICard,
  className,
}: BaseSkeletonProps & {
  count?: number;
  skeleton?: React.ComponentType<{ className?: string; index?: number }>;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={`skeleton-${i}`} index={i} />
      ))}
    </div>
  );
}

/**
 * Loading Spinner - Simple loading indicator
 */
export function LoadingSpinner({
  size = "md",
  className,
}: BaseSkeletonProps & { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-orange-200 border-t-orange-500",
        sizeClasses[size],
        className
      )}
    />
  );
}

/**
 * Loading Overlay - Full page loading
 */
export function LoadingOverlay({
  message = "Đang tải...",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

/**
 * Empty State Component
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
