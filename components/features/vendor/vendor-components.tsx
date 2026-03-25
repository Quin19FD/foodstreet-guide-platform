/**
 * Vendor Features Components
 * 
 * Reusable components for vendor UI
 */

import { AlertCircle, CheckCircle, Clock } from "lucide-react";

// Status Badge Component
export type POIStatusType = "PENDING" | "APPROVED" | "REJECTED";

interface StatusBadgeProps {
  status: POIStatusType;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const statusConfig = {
    PENDING: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Chờ duyệt",
      icon: Clock,
    },
    APPROVED: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: "Đã duyệt",
      icon: CheckCircle,
    },
    REJECTED: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "Bị từ chối",
      icon: AlertCircle,
    },
  };

 const config = statusConfig[status as keyof typeof statusConfig];

if (!config) {
  return null; 
}

const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text} ${className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

export function StatCard({ title, value, hint, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      {trend && (
        <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${trend.direction === "up" ? "text-emerald-600" : "text-red-600"}`}>
          {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
        </div>
      )}
    </div>
  );
}

// POI Card Component
interface POICardProps {
  id: string;
  name: string;
  category?: string;
  status: POIStatusType;
  lastUpdated?: string;
  imageUrl?: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function POICard({
  id,
  name,
  category,
  status,
  lastUpdated,
  imageUrl,
  onView,
  onEdit,
  onDelete,
}: POICardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md">
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-slate-100">
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">{name}</h3>
          <StatusBadge status={status} />
        </div>

        {category && (
          <p className="text-xs text-slate-500 mb-2">{category}</p>
        )}

        {lastUpdated && (
          <p className="text-xs text-slate-400 mb-4">Cập nhật: {lastUpdated}</p>
        )}

        <div className="flex gap-2">
          {onView && (
            <button
              onClick={onView}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Xem
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Chỉnh sửa
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
            >
              Xóa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Action Link Component
interface ActionLinkProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  primary?: boolean;
  variant?: "default" | "secondary" | "danger";
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function ActionLink({
  href,
  onClick,
  children,
  primary = false,
  variant = "default",
  icon,
  disabled = false,
}: ActionLinkProps) {
  const baseStyles =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    default: primary
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "border border-slate-200 text-slate-700 hover:bg-slate-50",
    secondary: "border border-slate-200 text-slate-600 hover:bg-slate-100",
    danger: "border border-red-200 text-red-600 hover:bg-red-50",
  };

  const className = `${baseStyles} ${variantStyles[variant]}`;

  if (href) {
    return (
      <a href={href} className={className}>
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className} disabled={disabled}>
      {icon}
      {children}
    </button>
  );
}

// Rejection Reason Alert
interface RejectionAlertProps {
  reason: string;
  onResubmit?: () => void;
}

export function RejectionAlert({ reason, onResubmit }: RejectionAlertProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">POI bị từ chối</h3>
          <p className="mt-1 text-sm text-red-700">{reason}</p>
          {onResubmit && (
            <button
              onClick={onResubmit}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
            >
              Chỉnh sửa & Gửi lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
