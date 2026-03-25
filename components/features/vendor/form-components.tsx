/**
 * Vendor Form Components
 * 
 * Reusable form fields and inputs for vendor POI management
 */

import React from "react";
import { X, Upload } from "lucide-react";

// Text Input Component
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, hint, suffix, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-700">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""} ${suffix ? "pr-8" : ""} ${className}`}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && <span className="text-xs text-red-600">{error}</span>}
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
    );
  }
);
TextInput.displayName = "TextInput";

// Textarea Component
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-700">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500 resize-none ${error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ label: string; value: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-700">{label}</label>
        )}
        <select
          ref={ref}
          className={`rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""} ${className}`}
          {...props}
        >
          <option value="">Chọn một lựa chọn</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-600">{error}</span>}
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";

// File Upload Component
interface FileUploadProps {
  label?: string;
  error?: string;
  hint?: string;
  value?: File | null;
  onChange?: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({
  label,
  error,
  hint,
  value,
  onChange,
  accept = "image/*",
  maxSize = 5,
}: FileUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (maxSize && file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    onChange?.(file);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 transition cursor-pointer hover:bg-slate-100 ${
          error ? "border-red-300 bg-red-50" : ""
        }`}
      >
        <Upload className="h-6 w-6 text-slate-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            Click để tải file
          </p>
          <p className="text-xs text-slate-500">
            hoặc kéo thả file vào đây
          </p>
        </div>
      </div>

      {value && (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-sm text-slate-700">
            <p className="font-medium">{value.name}</p>
            <p className="text-xs text-slate-500">
              {(value.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <button
            onClick={() => {
              onChange?.(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <span className="text-xs text-red-600">{error}</span>}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  );
}

// Location Picker Component
interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onChange?: (lat: string, lng: string) => void;
  error?: string;
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  error,
}: LocationPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        Vị trí địa điểm
      </label>

      <div className="gap-3 grid grid-cols-2">
        <TextInput
          type="number"
          placeholder="Latitude"
          step="0.000001"
          value={latitude ?? ""}
          onChange={(e) => onChange?.(e.target.value, longitude)}
          error={error}
        />
        <TextInput
          type="number"
          placeholder="Longitude"
          step="0.000001"
          value={longitude ?? ""}
          onChange={(e) => onChange?.(latitude, e.target.value)}
          error={error}
        />
      </div>

      <p className="text-xs text-slate-500">
        Nhấn chọn trên bản đồ hoặc nhập tọa độ thủ công
      </p>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

// Price Range Component
interface PriceRangeProps {
  minPrice: string;
  maxPrice: string;
  onChange?: (min: string, max: string) => void;
  error?: string;
  currency?: string;
}

export function PriceRange({
  minPrice,
  maxPrice,
  onChange,
  error,
  currency = "đ",
}: PriceRangeProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        Khoảng giá
      </label>

      <div className="gap-3 grid grid-cols-2">
        <TextInput
          type="number"
          placeholder={`Giá thấp nhất`}
          value={minPrice ?? ""}
          onChange={(e) => onChange?.(e.target.value, maxPrice)}
          error={error}
          suffix={"đ"}
        />
        <TextInput
          type="number"
          placeholder={`Giá cao nhất`}
          value={maxPrice ?? ""}
          onChange={(e) => onChange?.(minPrice, e.target.value)}
          error={error}
          suffix={"đ"}
        />
      </div>

      {minPrice && maxPrice && (
        <p className="text-xs text-slate-600">
          Giá: {parseInt(minPrice).toLocaleString("vi-VN")} - {parseInt(maxPrice).toLocaleString("vi-VN")} {currency}
        </p>
      )}

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

// Form Section Component
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <div className="border-b border-slate-200 pb-6 last:border-b-0">
      <h3 className="mb-1 text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mb-4 text-sm text-slate-600">{description}</p>
      )}
      <div className="gap-4 flex flex-col">{children}</div>
    </div>
  );
}
