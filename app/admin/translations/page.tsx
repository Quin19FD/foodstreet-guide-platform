"use client";

import {
  AlertCircle,
  CheckCircle2,
  Filter,
  Globe,
  Languages,
  MapPin,
  RefreshCw,
  Search,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AdminLayout } from "@/components/layouts/admin-layout";

type Translation = {
  id: string;
  poiId: string;
  language: string;
  name: string | null;
  description: string | null;
  audioScript: string | null;
  createdAt: string;
  updatedAt: string;
  poi: {
    id: string;
    name: string;
    category: string | null;
  };
  audios: Array<{
    id: string;
    audioUrl: string;
    isActive: boolean;
    createdAt: string;
  }>;
};

type TranslationsResponse = {
  total: number;
  translations: Translation[];
  take: number;
  skip: number;
};

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

export default function AdminTranslationsPage() {
  const [translations, setTranslations] = useState<Translation[]>([]);
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
    const byLanguage = translations.reduce(
      (acc, t) => {
        acc[t.language] = (acc[t.language] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byPOI = translations.reduce(
      (acc, t) => {
        acc[t.poiId] = (acc[t.poiId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const withAudio = translations.filter((t) => t.audios.length > 0).length;
    const withoutAudio = translations.filter((t) => t.audios.length === 0).length;

    return {
      total: translations.length,
      languages: Object.keys(byLanguage).length,
      pois: Object.keys(byPOI).length,
      withAudio,
      withoutAudio,
      byLanguage,
    };
  }, [translations]);

  // Filter translations
  const filteredTranslations = useMemo(() => {
    let result = translations;

    if (currentTab === "with-audio") {
      result = result.filter((t) => t.audios.length > 0);
    } else if (currentTab === "without-audio") {
      result = result.filter((t) => t.audios.length === 0);
    }

    if (search) {
      result = result.filter(
        (t) =>
          t.poi.name.toLowerCase().includes(search.toLowerCase()) ||
          t.name?.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (languageFilter) {
      result = result.filter((t) => t.language === languageFilter);
    }

    return result;
  }, [translations, currentTab, search, languageFilter]);

  // Load translations
  const loadTranslations = async () => {
    setIsLoading(true);
    setAlert(null);

    try {
      const params = new URLSearchParams({
        take: String(take),
        skip: String(skip),
      });

      const res = await fetch(`/api/admin/translations?${params}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Không thể tải danh sách bản dịch");
      }

      const data = (await res.json()) as TranslationsResponse;
      setTranslations(data.translations);
      setTotal(data.total);
    } catch (error) {
      console.error("Error loading translations:", error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể tải danh sách bản dịch",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTranslations();
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
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-pink-50 to-purple-50 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 p-3 text-white shadow-lg">
              <Languages className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quản lý Bản dịch</h1>
              <p className="mt-1 text-sm text-slate-600">
                Quản lý nội dung đa ngôn ngữ cho các địa điểm POI
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
              type="button"
              onClick={() => setAlert(null)}
              className="text-current/70 hover:text-current transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-pink-200 p-2">
                <Languages className="h-4 w-4 text-pink-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-900">{stats.total}</p>
                <p className="text-xs text-pink-700">Tổng bản dịch</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-200 p-2">
                <Globe className="h-4 w-4 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">{stats.languages}</p>
                <p className="text-xs text-purple-700">Ngôn ngữ</p>
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

          <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-200 p-2">
                <Volume2 className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{stats.withAudio}</p>
                <p className="text-xs text-green-700">Có Audio</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-slate-200 p-2">
                <Volume2 className="h-4 w-4 text-slate-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.withoutAudio}</p>
                <p className="text-xs text-slate-700">Chưa có Audio</p>
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
                  placeholder="Tìm theo tên POI, tên bản dịch, description..."
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
                type="button"
                onClick={loadTranslations}
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
            type="button"
            onClick={() => setCurrentTab("all")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              currentTab === "all"
                ? "border-b-2 border-pink-600 text-pink-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("with-audio")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              currentTab === "with-audio"
                ? "border-b-2 border-green-600 text-green-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Có Audio
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("without-audio")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              currentTab === "without-audio"
                ? "border-b-2 border-slate-600 text-slate-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Chưa có Audio
          </button>
        </div>

        {/* Translations List */}
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
                  Mô tả
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                  Audio Script
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                  Số Audio
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                  Cập nhật
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading && filteredTranslations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredTranslations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    Không tìm thấy bản dịch nào
                  </td>
                </tr>
              ) : (
                filteredTranslations.map((translation) => (
                  <tr key={translation.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{translation.poi.name}</p>
                          {translation.poi.category && (
                            <p className="text-xs text-slate-500">{translation.poi.category}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getLanguageBadge(translation.language)}`}
                      >
                        {getLanguageName(translation.language)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-xs">
                      <p className="line-clamp-1">{translation.name || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-md">
                      <p className="line-clamp-2">{translation.description || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-xs">
                      <p className="line-clamp-1">{translation.audioScript || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            translation.audios.length > 0
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          {translation.audios.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {new Date(translation.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {new Date(translation.updatedAt).toLocaleDateString("vi-VN")}
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
            Hiển thị <strong>{filteredTranslations.length}</strong> trong tổng{" "}
            <strong>{total}</strong> bản dịch
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSkip(Math.max(0, skip - take))}
              disabled={skip === 0 || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Trang trước
            </button>
            <button
              type="button"
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
