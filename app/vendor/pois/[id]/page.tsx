"use client";

import { ArrowLeft, Edit3, Lock, RefreshCw, RotateCcw, Unlock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { PoiDetailView, type PoiDetailData } from "@/components/poi/poi-detail-view";
import { VendorLayout } from "@/components/layouts/vendor-layout";

type VendorMeResponse = {
  user: {
    id: string;
    email: string;
    name: string;
  };
};

function pickError(input: unknown, fallback: string): string {
  if (!input || typeof input !== "object") return fallback;
  const maybe = input as { error?: string; issues?: Array<{ message?: string }> };
  return maybe.issues?.[0]?.message ?? maybe.error ?? fallback;
}

export default function VendorPoiDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const poiId = params?.id;

  const [poi, setPoi] = useState<PoiDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!poiId) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/vendor/pois/${poiId}`, { method: "GET" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể tải chi tiết POI"));
      }

      const data = (await res.json().catch(() => null)) as { poi?: PoiDetailData } | null;
      if (!data?.poi) throw new Error("Không tìm thấy POI");
      setPoi(data.poi);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }, [poiId]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsCheckingAuth(true);
      const meRes = await fetch("/api/vendor/auth/me", { method: "GET" }).catch(() => null);
      if (meRes?.ok) {
        if (isMounted) setIsCheckingAuth(false);
        if (isMounted) await load();
        return;
      }

      const refreshed = await fetch("/api/vendor/auth/refresh", { method: "POST" }).catch(() => null);
      if (!refreshed?.ok) {
        router.replace("/vendor/login");
        return;
      }

      const meAfter = await fetch("/api/vendor/auth/me", { method: "GET" }).catch(() => null);
      if (!meAfter?.ok) {
        router.replace("/vendor/login");
        return;
      }

      const meData = (await meAfter.json().catch(() => null)) as VendorMeResponse | null;
      if (!meData?.user) {
        router.replace("/vendor/login");
        return;
      }

      if (isMounted) setIsCheckingAuth(false);
      if (isMounted) await load();
    })();

    return () => {
      isMounted = false;
    };
  }, [load, router]);

  const lockPoi = async () => {
    if (!poi) return;
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/vendor/pois/${poi.id}/lock`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể khóa POI"));
      }
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const unlockPoi = async () => {
    if (!poi) return;
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/vendor/pois/${poi.id}/unlock`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể mở khóa POI"));
      }
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const resubmitPoi = async () => {
    if (!poi) return;
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/vendor/pois/${poi.id}/resubmit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể gửi duyệt lại"));
      }
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  if (isCheckingAuth) {
    return <div className="p-6 text-sm text-slate-500">Đang kiểm tra phiên đăng nhập vendor...</div>;
  }

  return (
    <VendorLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => router.push("/vendor")}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách POI
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => void load()}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
            onClick={() => router.push("/vendor")}
          >
            <Edit3 className="h-4 w-4" />
            Về trang quản lý để chỉnh sửa
          </button>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {isLoading && !poi ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải chi tiết POI...</div>
        ) : null}

        {!isLoading && !poi ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Không tìm thấy POI.</div>
        ) : null}

        {poi ? (
          <PoiDetailView
            poi={poi}
            headerActions={
              <>
                {poi.isActive === false ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    onClick={() => void unlockPoi()}
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    Mở khóa
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    onClick={() => void lockPoi()}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Khóa
                  </button>
                )}

                {poi.status === "REJECTED" ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600"
                    onClick={() => void resubmitPoi()}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Gửi duyệt lại
                  </button>
                ) : null}
              </>
            }
          />
        ) : null}
      </div>
    </VendorLayout>
  );
}




