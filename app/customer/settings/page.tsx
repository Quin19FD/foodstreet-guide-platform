"use client";

import { useLiteMode } from "@/lib/hooks/use-lite-mode";
import { CheckCircle2, Settings, Volume2, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const AUTO_PROMPT_STORAGE_KEY = "customer_auto_prompt_enabled";

export default function CustomerSettingsPage() {
  const { liteMode, setLiteMode } = useLiteMode();
  const [autoPromptEnabled, setAutoPromptEnabled] = useState(true);
  const [savedHint, setSavedHint] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTO_PROMPT_STORAGE_KEY);
    if (stored === "0") setAutoPromptEnabled(false);
  }, []);

  const saveAutoPrompt = (next: boolean) => {
    setAutoPromptEnabled(next);
    window.localStorage.setItem(AUTO_PROMPT_STORAGE_KEY, next ? "1" : "0");
    setSavedHint("Đã lưu cài đặt.");
    window.setTimeout(() => setSavedHint(null), 1400);
  };

  const toggleLiteMode = () => {
    const next = !liteMode;
    setLiteMode(next);
    if (next) {
      setAutoPromptEnabled(false);
      window.localStorage.setItem(AUTO_PROMPT_STORAGE_KEY, "0");
    }
    setSavedHint("Đã cập nhật chế độ trải nghiệm.");
    window.setTimeout(() => setSavedHint(null), 1400);
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 pb-28">
      <header className="mb-4 rounded-2xl bg-white p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-700" />
          <h1 className="text-lg font-bold text-slate-900">Cài đặt trải nghiệm</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Tối ưu ứng dụng theo cấu hình thiết bị của bạn.
        </p>
      </header>

      {savedHint ? (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> {savedHint}
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Zap className="h-4 w-4 text-amber-600" /> Lite mode
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Giảm hiệu ứng, giảm tải dữ liệu, ưu tiên mượt trên thiết bị yếu.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleLiteMode}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                liteMode
                  ? "bg-amber-100 text-amber-700"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              {liteMode ? "Đang bật" : "Đang tắt"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Volume2 className="h-4 w-4 text-blue-600" /> Auto hỏi thuyết minh
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tự gợi ý nghe thuyết minh khi bạn đi gần POI.
              </p>
            </div>
            <button
              type="button"
              onClick={() => saveAutoPrompt(!autoPromptEnabled)}
              disabled={liteMode}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                liteMode
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : autoPromptEnabled
                    ? "bg-blue-100 text-blue-700"
                    : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              {autoPromptEnabled ? "Đang bật" : "Đang tắt"}
            </button>
          </div>
          {liteMode ? (
            <p className="mt-2 text-xs text-amber-600">
              Lite mode đang bật nên tính năng này tạm tắt.
            </p>
          ) : null}
        </div>
      </section>

      <div className="mt-5">
        <Link
          href="/customer/device-check"
          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          Chạy lại kiểm tra cấu hình thiết bị
        </Link>
      </div>
    </main>
  );
}
