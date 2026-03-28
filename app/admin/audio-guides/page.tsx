"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Badge,
  CheckCircle2,
  Filter,
  Headphones,
  Languages,
  MapPin,
  RefreshCw,
  Search,
  Volume2,
  X,
} from "lucide-react";

import { AdminLayout } from "@/components/layouts/admin-layout";

type AudioGuide = {
  id: string;
  poiId: string;
  poiName: string;
  category: string | null;
  language: string;
  name: string | null;
  description: string | null;
  audioScript: string | null;
  audioUrl: string;
  isActive: boolean;
  createdAt: string;
  translationUpdatedAt: string;
};

type AudioGuidesResponse = {
  total: number;
  audioGuides: AudioGuide[];
  take: number;
  skip: number;
};

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

export default function AdminAudioGuidesPage() {
  const [audioGuides, setAudioGuides] = useState<AudioGuide[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [currentTab, setCurrentTab] = useState("all");

  // Pagination
  const [take] = useState(20);
  const [skip, setSkip] = useState(0);

  // Calculate stats
  const stats = useMemo(() => {
    const byLanguage = audioGuides.reduce(
      (acc, guide) => {
        acc[guide.language] = (acc[guide.language] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byPOI = audioGuides.reduce(
      (acc, guide) => {
        acc[guide.poiId] = (acc[guide.poiId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const active = audioGuides.filter((g) => g.isActive).length;
    const inactive = audioGuides.filter((g) => !g.isActive).length;

    return {
      total: audioGuides.length,
      languages: Object.keys(byLanguage).length,
      pois: Object.keys(byPOI).length,
      active,
      inactive,
      byLanguage,
    };
  }, [audioGuides]);

  // Filter audio guides
  const filteredGuides = useMemo(() => {
    let result = audioGuides;

    if (currentTab === "active") {
      result = result.filter((g) => g.isActive);
    } else if (currentTab === "inactive") {
      result = result.filter((g) => !g.isActive);
    }

    if (search) {
      result = result.filter(
        (g) =>
          g.poiName.toLowerCase().includes(search.toLowerCase()) ||
          (g.description && g.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (languageFilter) {
      result = result.filter((g) => g.language === languageFilter);
    }

    return result;
  }, [audioGuides, currentTab, search, languageFilter]);

  // Load audio guides
  const loadAudioGuides = async () => {
    setIsLoading(true);
    setAlert(null);

    try {
      const params = new URLSearchParams({
        take: String(take),
        skip: String(skip),
      });

      const res = await fetch(`/api/admin/audio-guides?${params}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Không thể tải danh sách audio guides");
      }

      const data = (await res.json()) as AudioGuidesResponse;
      setAudioGuides(data.audioGuides);
      setTotal(data.total);
    } catch (error) {
      console.error("Error loading audio guides:", error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể tải danh sách audio guides",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAudioGuides();
  }, [take, skip]);

  // Get language badge color
  const getLanguageBadge = (language: string) => {
    const colors: Record<string, string> = {
      vi: "bg-blue-100 text-blue-800 border-blue-200",
      en: "bg-red-100 text-red-800 border-red-200",
      fr: "bg-purple-100 text-purple-800 border-purple-200",
      ja: "bg-pink-100 text-pink-800 border-pink-200",
      ko: "bg-cyan-100 text-cyan-800 border-cyan-200",
      zh: "bg-amber-100 text-amber-800 border-amber-200",
    };
    return colors[language] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Get language display name
  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      vi: "Tiếng Việt",
      en: "English",
      fr: "Français",
      ja: "日本語",
      ko: "한국어",
      zh: "中文",
    };
    return names[code] || code.toUpperCase();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 text-white shadow-lg">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quản lý Audio Guides</h1>
              <p className="mt-1 text-sm text-slate-600">
                Quản lý script, ngôn ngữ và audio TTS cho các địa điểm POI
              </p>
            </div>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 ${
              alert.type === "success"
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {alert.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium">{alert.message}</p>
            </div>
            <button
              onClick={() => setAlert(null)}
              className="text-current/70 hover:text-current transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-cyan-200 p-2">
                <Volume2 className="h-4 w-4 text-cyan-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-900">{stats.total}</p>
                <p className="text-xs text-cyan-700">Tổng Audio</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-200 p-2">
                <MapPin className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">{stats.pois}</p>
                <p className="text-xs text-blue-700">Địa điểm</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-200 p-2">
                <Languages className="h-4 w-4 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">{stats.languages}</p>
                <p className="text-xs text-purple-700">Ngôn ngữ</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-200 p-2">
                <CheckCircle2 className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                <p className="text-xs text-green-700">Hoạt động</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-slate-200 p-2">
                <Headphones className="h-4 w-4 text-slate-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.inactive}</p>
                <p className="text-xs text-slate-700">Ngừng hoạt động</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên POI, description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Tất cả ngôn ngữ</option>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="zh">中文</option>
              </select>
              <button
                onClick={loadAudioGuides}
                disabled={isLoading}
                className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setCurrentTab("all")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              currentTab === "all"
                ? "border-b-2 border-cyan-600 text-cyan-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setCurrentTab("active")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              currentTab === "active"
                ? "border-b-2 border-green-600 text-green-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hoạt động
          </button>
          <button
            onClick={() => setCurrentTab("inactive")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              currentTab === "inactive"
                ? "border-b-2 border-slate-600 text-slate-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ngừng hoạt động
          </button>
        </div>

        {/* Audio Guides List */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                  POI
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                  Ngôn ngữ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                  Tên bản dịch
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                  Audio Script
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                  Ngày cập nhật
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading && filteredGuides.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredGuides.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    Không tìm thấy audio guide nào
                  </td>
                </tr>
              ) : (
                filteredGuides.map((guide) => (
                  <tr key={guide.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{guide.poiName}</p>
                          {guide.category && (
                            <p className="text-xs text-slate-500">{guide.category}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getLanguageBadge(guide.language)}`}
                      >
                        {getLanguageName(guide.language)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{guide.name || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-md">
                      <p className="line-clamp-2">
                        {guide.audioScript || guide.description || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          guide.isActive
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-slate-100 text-slate-800 border-slate-200"
                        }`}
                      >
                        {guide.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {new Date(guide.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {new Date(guide.translationUpdatedAt).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Hiển thị <strong>{filteredGuides.length}</strong> trong tổng <strong>{total}</strong>{" "}
            audio guides
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSkip(Math.max(0, skip - take))}
              disabled={skip === 0 || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Trang trước
            </button>
            <button
              onClick={() => setSkip(skip + take)}
              disabled={skip + take >= total || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
