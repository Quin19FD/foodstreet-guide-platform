"use client";

import { Save, Upload, UserCircle2, X } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";

import { VendorLayout } from "@/components/layouts/vendor-layout";

type MeResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phoneNumber?: string;
    avatarUrl?: string;
  };
};

type UploadAvatarResponse = {
  url?: string;
  error?: string;
  issues?: Array<{ message?: string }>;
};

function pickError(input: unknown, fallback: string): string {
  if (!input || typeof input !== "object") return fallback;
  const maybe = input as { error?: string; issues?: Array<{ message?: string }> };
  return maybe.issues?.[0]?.message ?? maybe.error ?? fallback;
}

export default function VendorSettingsPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const avatarToShow = useMemo(() => {
    if (removeAvatar) return "";
    return avatarPreviewUrl ?? avatarUrl;
  }, [avatarPreviewUrl, avatarUrl, removeAvatar]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch("/api/vendor/auth/me", { method: "GET" });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as unknown;
          throw new Error(pickError(data, "Không thể tải hồ sơ"));
        }
        const data = (await res.json().catch(() => null)) as MeResponse | null;
        if (!isMounted || !data?.user) return;
        setEmail(data.user.email ?? "");
        setName(data.user.name ?? "");
        setPhoneNumber(data.user.phoneNumber ?? "");
        setAvatarUrl(data.user.avatarUrl ?? "");
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const onSelectAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (avatarPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarFile(file);
    setRemoveAvatar(false);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setSuccessMessage(null);
  };

  const clearSelectedAvatar = () => {
    if (avatarPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let nextAvatarUrl: string | null | undefined = undefined;

      if (avatarFile) {
        const form = new FormData();
        form.append("file", avatarFile);

        const uploadRes = await fetch("/api/vendor/auth/avatar-upload", {
          method: "POST",
          body: form,
        });

        const uploadData = (await uploadRes.json().catch(() => null)) as UploadAvatarResponse | null;
        if (!uploadRes.ok || !uploadData?.url) {
          throw new Error(pickError(uploadData, "Upload avatar thất bại"));
        }
        nextAvatarUrl = uploadData.url;
      } else if (removeAvatar) {
        nextAvatarUrl = null;
      }

      const payload: Record<string, unknown> = {
        email: email.trim(),
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || null,
      };

      if (nextAvatarUrl !== undefined) {
        payload.avatarUrl = nextAvatarUrl;
      }

      const res = await fetch("/api/vendor/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as MeResponse | null;
      if (!res.ok) {
        throw new Error(pickError(data, "Không thể cập nhật hồ sơ"));
      }

      if (data?.user) {
        setEmail(data.user.email ?? "");
        setName(data.user.name ?? "");
        setPhoneNumber(data.user.phoneNumber ?? "");
        setAvatarUrl(data.user.avatarUrl ?? "");
      }

      clearSelectedAvatar();
      setRemoveAvatar(false);
      setSuccessMessage("Đã cập nhật thông tin cá nhân");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thông tin cá nhân Vendor</h1>
          <p className="mt-1 text-sm text-slate-500">
            Chọn ảnh từ máy rồi bấm Lưu để upload lên Cloudinary và cập nhật DB.
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[260px_minmax(0,1fr)]">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avatar</p>
            <div className="flex justify-center">
              {avatarToShow ? (
                <img src={avatarToShow} alt="avatar" className="h-36 w-36 rounded-full border border-slate-200 object-cover" />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-400">
                  <UserCircle2 className="h-16 w-16" />
                </div>
              )}
            </div>
            {avatarFile ? (
              <p className="text-xs text-slate-500">Ảnh mới: {avatarFile.name}</p>
            ) : (
              <p className="text-xs text-slate-500">Chưa chọn ảnh mới</p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={onSelectAvatar}
              disabled={isLoading || isSaving}
              className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearSelectedAvatar}
                disabled={isLoading || isSaving || !avatarFile}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Bỏ ảnh mới
              </button>
              <button
                type="button"
                onClick={() => {
                  clearSelectedAvatar();
                  setRemoveAvatar(true);
                }}
                disabled={isLoading || isSaving || (!avatarUrl && !avatarPreviewUrl)}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-50"
              >
                Xóa avatar
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2" disabled={isLoading || isSaving} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Họ tên" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2" disabled={isLoading || isSaving} />
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Số điện thoại" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2 md:col-span-2" disabled={isLoading || isSaving} />
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          onClick={() => void saveProfile()}
          disabled={isLoading || isSaving}
        >
          {avatarFile ? <Upload className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </VendorLayout>
  );
}