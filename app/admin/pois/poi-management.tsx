"use client";

import { CheckCircle2, Eye, Lock, RefreshCw, Unlock, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PoiStatus = "PENDING" | "APPROVED" | "REJECTED";

type Poi = {
  id: string;
  name: string;
  category?: string | null;
  status: PoiStatus;
  isActive?: boolean;
  rejectionReason?: string | null;
  updatedAt: string;
  owner: {
    id: string;
    email: string;
    name: string;
  };
  translations: Array<{
    id: string;
    language: string;
    name?: string | null;
    description?: string | null;
    audios?: Array<{ id: string; audioUrl: string }>;
  }>;
  images: Array<{ id: string; imageUrl: string; description?: string | null }>;
  menuItems: Array<{ id: string; name?: string | null; price?: number | null }>;
};

type PoiListResponse = {
  total: number;
  pois: Poi[];
};

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function pickError(input: unknown, fallback: string): string {
  if (!input || typeof input !== "object") return fallback;
  const maybe = input as { error?: string; issues?: Array<{ message?: string }> };
  return maybe.issues?.[0]?.message ?? maybe.error ?? fallback;
}

function statusBadge(status: PoiStatus): string {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

export function AdminPoiManagement() {
  const router = useRouter();
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PoiStatus | "ALL">("ALL");


  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({ take: "100", skip: "0", includeLocked: "1" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/pois?${params.toString()}`, { method: "GET" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể tải danh sách POI"));
      }

      const data = (await res.json().catch(() => null)) as PoiListResponse | null;
      setPois(data?.pois ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingCount = useMemo(() => pois.filter((poi) => poi.status === "PENDING").length, [pois]);

  const approvePoi = async (poi: Poi) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/pois/${poi.id}/decision`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "APPROVE" }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể duyệt POI"));
      }

      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const rejectPoi = async (poi: Poi) => {
    const reason = window.prompt("Nhập lý do từ chối POI:", poi.rejectionReason ?? "");
    if (reason == null) return;

    const trimmed = reason.trim();
    if (!trimmed) {
      setErrorMessage("Vui lòng nhập lý do từ chối");
      return;
    }

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/pois/${poi.id}/decision`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "REJECT", rejectionReason: trimmed }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể từ chối POI"));
      }

      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const lockPoi = async (poi: Poi) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/pois/${poi.id}/lock`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể khóa POI"));
      }
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const unlockPoi = async (poi: Poi) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/pois/${poi.id}/unlock`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể mở khóa POI"));
      }
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản lý POI</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dữ liệu đã nối API thật. Admin có thể duyệt, từ chối, khóa/mở khóa POI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            Pending: {pendingCount}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => void load()}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as PoiStatus | "ALL")}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-orange-500 focus:ring-2"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-[1080px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">POI</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Khóa/Mở</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pois.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={6}>
                  Không có POI phù hợp.
                </td>
              </tr>
            ) : (
              pois.map((poi) => (
                <tr key={poi.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{poi.name}</p>
                    <p className="text-xs text-slate-500">{poi.category ?? "-"}</p>
                    {poi.status === "REJECTED" && poi.rejectionReason ? (
                      <p className="mt-1 text-xs text-rose-600">Lý do: {poi.rejectionReason}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <p className="font-medium">{poi.owner.name}</p>
                    <p className="text-xs text-slate-500">{poi.owner.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(poi.status)}`}>
                      {poi.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {poi.isActive === false ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        Đang khóa
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Đang mở
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(poi.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {poi.status !== "APPROVED" ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                          onClick={() => void approvePoi(poi)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Duyệt
                        </button>
                      ) : null}

                      {poi.status !== "REJECTED" ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
                          onClick={() => void rejectPoi(poi)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Từ chối
                        </button>
                      ) : null}

                      {poi.isActive === false ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          onClick={() => void unlockPoi(poi)}
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          Mở khóa
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          onClick={() => void lockPoi(poi)}
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Khóa
                        </button>
                      )}

                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => router.push(`/admin/pois/${poi.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      
    </div>
  );
}

