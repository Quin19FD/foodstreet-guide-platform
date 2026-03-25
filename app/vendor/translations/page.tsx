"use client";

import { useState } from "react";
import { Globe, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TextInput, Textarea, Select, FormSection } from "@/components/features/vendor/form-components";

interface Translation {
  id: string;
  language: string;
  description: string;
  audioUrl?: string;
}

interface POITranslation {
  poiId: string;
  poiName: string;
  translations: Translation[];
}

const LANGUAGES = [
  { label: "Tiếng Việt", value: "vi" },
  { label: "English", value: "en" },
  { label: "日本語", value: "ja" },
  { label: "中文", value: "zh" },
  { label: "한국어", value: "ko" },
  { label: "Français", value: "fr" },
];

export default function VendorTranslationsPage() {
  const [activeTab, setActiveTab] = useState<"pois" | "setup">("pois");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [translations, setTranslations] = useState<POITranslation[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Globe className="h-8 w-8" />
          Quản lý dịch
        </h1>
        <p className="mt-1 text-slate-600">
          Thêm mô tả và ghi âm hướng dẫn cho các đặc điểm địa điểm của bạn bằng nhiều ngôn ngữ
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-8">
        <button
          onClick={() => setActiveTab("pois")}
          className={`px-1 py-3 border-b-2 font-medium transition ${
            activeTab === "pois"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Dịch từng địa điểm
        </button>
        <button
          onClick={() => setActiveTab("setup")}
          className={`px-1 py-3 border-b-2 font-medium transition ${
            activeTab === "setup"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Thiết lập ngôn ngữ
        </button>
      </div>

      {/* Content */}
      {activeTab === "pois" ? (
        <div className="space-y-6">
          {/* Language Selector */}
          <Card>
            <CardContent className="pt-6">
              <Select
                label="Chọn ngôn ngữ"
                options={LANGUAGES}
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* POI Translation List */}
          <div className="space-y-4">
            {translations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Globe className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-600">
                    Bạn chưa có địa điểm nào
                  </p>
                  <Button
                    onClick={() => window.location.href = "/vendor/pois/create"}
                    variant="outline"
                    className="mt-4"
                  >
                    Tạo địa điểm
                  </Button>
                </CardContent>
              </Card>
            ) : (
              translations.map((poi) => (
                <Card key={poi.poiId}>
                  <CardHeader>
                    <CardTitle className="text-base">{poi.poiName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormSection
                      title="Mô tả"
                      description="Mô tả chi tiết cho ngôn ngữ này"
                    >
                      <Textarea
                        placeholder="Nhập mô tả..."
                        rows={4}
                        defaultValue={
                          poi.translations.find(
                            (t) => t.language === selectedLanguage
                          )?.description || ""
                        }
                      />
                    </FormSection>

                    <FormSection
                      title="Hướng dẫn âm thanh"
                      description="Tải lên tệp MP3 hướng dẫn cho ngôn ngữ này"
                    >
                      <div className="space-y-4">
                        {poi.translations.find(
                          (t) => t.language === selectedLanguage
                        )?.audioUrl && (
                          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="text-sm text-slate-700">
                              <p className="font-medium">Tệp âm thanh hiện có</p>
                              <p className="text-xs text-slate-500">
                                {poi.translations
                                  .find((t) => t.language === selectedLanguage)
                                  ?.audioUrl?.split("/")
                                  .pop() || "tệp âm thanh"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 transition cursor-pointer hover:bg-slate-100">
                          <Plus className="h-6 w-6 text-slate-400" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-slate-700">
                              Click để tải file âm thanh
                            </p>
                            <p className="text-xs text-slate-500">
                              MP3, WAV hoặc M4A (tối đa 10MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    </FormSection>

                    <div className="flex gap-2">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Lưu
                      </Button>
                      <Button variant="outline">
                        Hủy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Language Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Ngôn ngữ được hỗ trợ</CardTitle>
              <CardDescription>
                Chọn ngôn ngữ nào được bạn hỗ trợ cho các địa điểm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {LANGUAGES.map((lang) => (
                  <div key={lang.value} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      defaultChecked={lang.value === "vi"}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {lang.label}
                    </span>
                  </div>
                ))}
              </div>
              <Button className="mt-6 bg-blue-600 hover:bg-blue-700">
                Lưu cài đặt
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mẹo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>
                • Hãy chuẩn bị mô tả chính xác cho mỗi ngôn ngữ
              </p>
              <p>
                • Ghi âm hướng dẫn giọng nói rõ ràng và tự nhiên
              </p>
              <p>
                • Kiểm tra âm thanh trước khi lưu
              </p>
              <p>
                • Cập nhật thường xuyên khi có thay đổi thông tin
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
