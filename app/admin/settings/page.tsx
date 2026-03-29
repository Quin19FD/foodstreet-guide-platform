"use client";

import { Camera, Check, Info, Loader2, Mail, Phone, Trash2, User } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { AdminLayout } from "@/components/layouts/admin-layout";

const publicAppConfig = {
  name: "FoodStreet Guide",
  environment: process.env.NODE_ENV ?? "development",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

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

export default function AdminSettingsPage() {
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarToShow = useMemo(() => {
    if (removeAvatar) return "";
    return avatarPreviewUrl ?? avatarUrl;
  }, [avatarPreviewUrl, avatarUrl, removeAvatar]);

  const _hasChanges = useMemo(() => {
    return avatarFile !== null || removeAvatar;
  }, [avatarFile, removeAvatar]);

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
        const res = await fetch("/api/admin/session/me", { method: "GET" });
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

  const handleRemoveAvatar = () => {
    if (avatarPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setRemoveAvatar(true);
  };

  const saveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let nextAvatarUrl: string | null | undefined = undefined;

      if (avatarFile) {
        const form = new FormData();
        form.append("file", avatarFile);

        const uploadRes = await fetch("/api/admin/session/avatar-upload", {
          method: "POST",
          body: form,
        });

        const uploadData = (await uploadRes
          .json()
          .catch(() => null)) as UploadAvatarResponse | null;
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

      const res = await fetch("/api/admin/session/profile", {
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

      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      setRemoveAvatar(false);
      setSuccessMessage("Đã cập nhật hồ sơ thành công.");

      // Auto hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Có lỗi xảy ra trong quá trình lưu."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-settings h-6 w-6"
            >
              <title>Settings</title>
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cài đặt</h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý thông tin tài khoản và tùy chọn hệ thống của bạn.
            </p>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMessage && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow-sm animate-in fade-in flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-12">
          {/* Section: Profile */}
          <section className="grid grid-cols-1 gap-x-8 gap-y-8 pt-8 md:grid-cols-3">
            <div className="px-4 sm:px-0">
              <h2 className="text-lg font-semibold leading-7 text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Hồ sơ cá nhân
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Thông tin này sẽ được hiển thị công khai nên hãy chú ý nội dung bạn chia sẻ.
              </p>
            </div>

            <form
              onSubmit={saveProfile}
              className="bg-white shadow-md shadow-slate-200/40 border border-slate-200 sm:rounded-2xl md:col-span-2 overflow-hidden transition-all"
            >
              <div className="px-4 py-6 sm:p-8">
                <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  {/* Avatar field */}
                  <div className="col-span-full">
                    <span className="block text-sm font-medium leading-6 text-slate-900">
                      Ảnh đại diện
                    </span>
                    <div className="mt-4 flex items-center gap-x-5">
                      {avatarToShow ? (
                        <img
                          src={avatarToShow}
                          alt="Avatar"
                          className="h-20 w-20 rounded-full object-cover ring-4 ring-orange-50 shadow-sm"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 ring-4 ring-slate-50 shadow-sm">
                          <User className="h-10 w-10 text-slate-300" />
                        </div>
                      )}
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-orange-50 hover:text-orange-600 hover:ring-orange-200 transition-all duration-200"
                            disabled={isLoading || isSaving}
                          >
                            <Camera className="h-4 w-4 text-slate-400" />
                            Thay đổi
                          </button>

                          {(avatarToShow || avatarFile) && (
                            <button
                              type="button"
                              onClick={handleRemoveAvatar}
                              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-red-50 hover:ring-red-200 transition-all duration-200"
                              disabled={isLoading || isSaving}
                            >
                              <Trash2 className="h-4 w-4" />
                              Gỡ ảnh
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">JPG, GIF hoặc PNG. Tối đa 2MB.</p>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onSelectAvatar}
                        className="hidden"
                      />
                    </div>
                    {avatarFile && (
                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <Check className="h-3 w-3" />{" "}
                        <span>
                          Đã chọn ảnh mới: <span className="font-medium">{avatarFile.name}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name field */}
                  <div className="col-span-full sm:col-span-3">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium leading-6 text-slate-900"
                    >
                      Họ và tên
                    </label>
                    <div className="mt-2 relative rounded-lg shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full rounded-lg border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6 transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="Nguyễn Văn A"
                        disabled={isLoading || isSaving}
                      />
                    </div>
                  </div>

                  {/* Phone field */}
                  <div className="col-span-full sm:col-span-3">
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium leading-6 text-slate-900"
                    >
                      Số điện thoại
                    </label>
                    <div className="mt-2 relative rounded-lg shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Phone className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="block w-full rounded-lg border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6 transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="0912 345 678"
                        disabled={isLoading || isSaving}
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="col-span-full">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium leading-6 text-slate-900"
                    >
                      Địa chỉ Email
                    </label>
                    <div className="mt-2 relative rounded-lg shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-lg border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6 transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="admin@domain.com"
                        disabled={isLoading || isSaving}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Footer Action */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-8">
                <div className="text-sm">
                  {successMessage && (
                    <span className="flex items-center rounded-md bg-emerald-50 px-3 py-1.5 text-emerald-700 font-medium animate-in fade-in">
                      <Check className="mr-1.5 h-4 w-4" />
                      {successMessage}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-x-4">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="text-sm font-semibold leading-6 text-slate-600 hover:text-orange-600 disabled:opacity-50 transition-colors"
                    disabled={isLoading || isSaving}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                    disabled={isLoading || isSaving}
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Section Divider */}
          <div className="hidden sm:block">
            <div className="py-2">
              <div className="border-t border-slate-200/60" />
            </div>
          </div>

          {/* Section: Application Info */}
          <section className="grid grid-cols-1 gap-x-8 gap-y-8 pt-8 md:grid-cols-3">
            <div className="px-4 sm:px-0">
              <h2 className="text-lg font-semibold leading-7 text-slate-900 flex items-center gap-2">
                <Info className="h-5 w-5 text-orange-500" />
                Thông tin Hệ thống
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Các biến môi trường và thiết lập máy chủ đang chạy. Phần này chỉ có quyền đọc
                (Read-only).
              </p>
            </div>

            <div className="bg-white shadow-md shadow-slate-200/40 border border-slate-200 sm:rounded-2xl md:col-span-2 overflow-hidden">
              <div className="px-4 py-6 sm:p-8">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                      Nền tảng
                    </dt>
                    <dd className="mt-2 text-sm text-slate-900 font-semibold bg-slate-50 inline-flex px-3 py-1.5 rounded-md border border-slate-100">
                      {publicAppConfig.name}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                      Môi trường
                    </dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center rounded-md bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 ring-1 ring-inset ring-orange-600/20">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
                        {publicAppConfig.environment.toUpperCase()}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                      Base URL
                    </dt>
                    <dd className="mt-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200 font-mono shadow-inner">
                      {publicAppConfig.url}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="border-t border-slate-100 bg-orange-50/50 px-4 py-4 sm:px-8">
                <div className="flex items-start gap-3 text-sm text-orange-800">
                  <Info className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                  <p>
                    Để thay đổi các giá trị này, bạn cần truy cập file cấu hình{" "}
                    <code className="font-semibold bg-orange-100 px-1 py-0.5 rounded">.env</code>{" "}
                    trên máy chủ và khởi động lại dịch vụ.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
