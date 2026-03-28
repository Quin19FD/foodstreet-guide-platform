"use client";

import { ArrowLeft, CheckCircle2, Lock, RefreshCw, Unlock, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { PoiDetailView, type PoiDetailData } from "@/components/poi/poi-detail-view";

function pickError(input: unknown, fallback: string): string {
  if (!input || typeof input !== "object") return fallback;
  const maybe = input as { error?: string; issues?: Array<{ message?: string }> };
  return maybe.issues?.[0]?.message ?? maybe.error ?? fallback;
}

export function AdminPoiDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const poiId = params?.id;

  const [poi, setPoi] = useState<PoiDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!poiId) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/pois/${poiId}`, { method: "GET" });
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
    void load();
  }, [load]);

  const decide = async (decision: "APPROVE" | "REJECT") => {
    if (!poi) return;

    let rejectionReason: string | undefined;
    if (decision === "REJECT") {
      const reason = window.prompt("Nhập lý do từ chối POI:", poi.rejectionReason ?? "");
      if (reason == null) return;
      const trimmed = reason.trim();
      if (!trimmed) {
        setErrorMessage("Vui lòng nhập lý do từ chối");
        return;
      }
      rejectionReason = trimmed;
    }

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/pois/${poi.id}/decision`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, ...(rejectionReason ? { rejectionReason } : {}) }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể cập nhật quyết định duyệt"));
      }

      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const toggleLock = async (nextLocked: boolean) => {
    if (!poi) return;

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/pois/${poi.id}/${nextLocked ? "lock" : "unlock"}`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, `Không thể ${nextLocked ? "khóa" : "mở khóa"} POI`));
      }

      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => router.push("/admin/pois")}
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
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading && !poi ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Đang tải chi tiết POI...
        </div>
      ) : null}

      {!isLoading && !poi ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Không tìm thấy POI.
        </div>
      ) : null}

      {poi ? (
        <PoiDetailView
          poi={poi}
          showOwner
          headerActions={
            <>
              {poi.status !== "APPROVED" ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
                  onClick={() => void decide("APPROVE")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Duyệt POI
                </button>
              ) : null}

              {poi.status !== "REJECTED" ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600"
                  onClick={() => void decide("REJECT")}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Từ chối
                </button>
              ) : null}

              {poi.isActive === false ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  onClick={() => void toggleLock(false)}
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Mở khóa
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  onClick={() => void toggleLock(true)}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Khóa
                </button>
              )}
            </>
          }
        />
      ) : null}
    </div>
  );
}
