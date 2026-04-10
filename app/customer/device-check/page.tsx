"use client";

import { Cpu, Gauge, Languages, MapPin, Mic, Volume2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiteMode } from "@/lib/hooks/use-lite-mode";
import { useEffect, useMemo, useState } from "react";

type CheckStatus = "ok" | "warn" | "fail";

type CheckItem = {
  key: string;
  title: string;
  description: string;
  status: CheckStatus;
  suggestion: string;
};

const statusMeta: Record<CheckStatus, { label: string; icon: string; className: string }> = {
  ok: { label: "Tốt", icon: "✅", className: "text-emerald-600 bg-emerald-50" },
  warn: { label: "Lưu ý", icon: "⚠️", className: "text-amber-600 bg-amber-50" },
  fail: { label: "Chưa hỗ trợ", icon: "❌", className: "text-rose-600 bg-rose-50" },
};

function toStatusScore(status: CheckStatus) {
  if (status === "ok") return 2;
  if (status === "warn") return 1;
  return 0;
}

function getOverallStatus(items: CheckItem[]): CheckStatus {
  if (items.some((item) => item.status === "fail")) return "fail";
  if (items.some((item) => item.status === "warn")) return "warn";
  return "ok";
}

export default function CustomerDeviceCheckPage() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/customer/map";

  const [checks, setChecks] = useState<CheckItem[]>([]);
  const { liteMode, setLiteMode } = useLiteMode();

  useEffect(() => {
    const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
    const memory = navigatorWithMemory.deviceMemory;
    const cores = navigator.hardwareConcurrency;

    let performanceStatus: CheckStatus = "ok";
    let performanceSuggestion = "Thiết bị đủ tốt để bật đầy đủ hiệu ứng và tính năng nâng cao.";

    if ((typeof memory === "number" && memory <= 2) || (typeof cores === "number" && cores <= 2)) {
      performanceStatus = "fail";
      performanceSuggestion =
        "Thiết bị cấu hình thấp. Nên bật Lite mode để giảm hiệu ứng, tiết kiệm pin và tải nhanh hơn.";
    } else if (
      (typeof memory === "number" && memory <= 4) ||
      (typeof cores === "number" && cores <= 4) ||
      typeof memory !== "number"
    ) {
      performanceStatus = "warn";
      performanceSuggestion =
        "Thiết bị ở mức trung bình. Có thể bật Lite mode nếu thấy lag hoặc hao pin.";
    }

    const canPlayAudio =
      typeof window.Audio !== "undefined" &&
      !!document.createElement("audio").canPlayType("audio/mpeg");

    const audioStatus: CheckStatus = canPlayAudio ? "ok" : "fail";

    const ttsSupported =
      "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance !== "undefined";

    const hasMultiLanguage = Array.isArray(navigator.languages) && navigator.languages.length > 1;
    const browserStatus: CheckStatus = ttsSupported && hasMultiLanguage ? "ok" : "warn";

    const baseChecks: CheckItem[] = [
      {
        key: "performance",
        title: "Bộ nhớ & hiệu năng",
        description: `RAM ước lượng: ${memory ? `${memory} GB` : "không xác định"} • CPU: ${cores ? `${cores} luồng` : "không xác định"}`,
        status: performanceStatus,
        suggestion: performanceSuggestion,
      },
      {
        key: "audio",
        title: "Âm thanh",
        description: canPlayAudio
          ? "Thiết bị có thể phát âm thanh cho tính năng thuyết minh giọng nói."
          : "Không phát hiện khả năng phát âm thanh tương thích.",
        status: audioStatus,
        suggestion: canPlayAudio
          ? "Bạn có thể bật thuyết minh giọng nói khi khám phá POI."
          : "Hệ thống sẽ fallback sang văn bản mô tả.",
      },
      {
        key: "browser",
        title: "Trình duyệt & tính năng",
        description: `Text-to-Speech: ${ttsSupported ? "Có" : "Không"} • Đa ngôn ngữ: ${hasMultiLanguage ? "Có" : "Không"}`,
        status: browserStatus,
        suggestion:
          ttsSupported && hasMultiLanguage
            ? "Trình duyệt hỗ trợ tốt cho trải nghiệm giọng nói và đa ngôn ngữ."
            : "Một số tính năng nâng cao sẽ fallback sang nội dung văn bản.",
      },
    ];

    setChecks(baseChecks);

    if (navigator.permissions && navigator.geolocation) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          let geoStatus: CheckStatus = "warn";
          let geoDescription = "Quyền vị trí đang chờ cấp phép.";
          let geoSuggestion = "Hãy cho phép vị trí để hiển thị POI gần bạn chính xác hơn.";

          if (result.state === "granted") {
            geoStatus = "ok";
            geoDescription = "Đã cấp quyền vị trí. Có thể hiển thị POI gần bạn.";
            geoSuggestion = "Bạn sẽ nhận gợi ý ẩm thực theo vị trí hiện tại.";
          } else if (result.state === "denied") {
            geoStatus = "fail";
            geoDescription = "Trình duyệt đang chặn quyền vị trí (GPS).";
            geoSuggestion = "Mở quyền vị trí trong cài đặt trình duyệt để dùng bản đồ gần bạn.";
          }

          setChecks((prev) => [
            ...prev,
            {
              key: "location",
              title: "Vị trí (Location)",
              description: geoDescription,
              status: geoStatus,
              suggestion: geoSuggestion,
            },
          ]);
        })
        .catch(() => {
          setChecks((prev) => [
            ...prev,
            {
              key: "location",
              title: "Vị trí (Location)",
              description: "Không thể đọc trạng thái quyền vị trí từ trình duyệt.",
              status: "warn",
              suggestion: "Khi cần, hệ thống sẽ yêu cầu vị trí trực tiếp từ bạn.",
            },
          ]);
        });
    } else {
      setChecks((prev) => [
        ...prev,
        {
          key: "location",
          title: "Vị trí (Location)",
          description: "Thiết bị hoặc trình duyệt không hỗ trợ Geolocation API.",
          status: "fail",
          suggestion: "Hệ thống sẽ hiển thị danh sách POI mặc định theo khu vực phổ biến.",
        },
      ]);
    }
  }, []);

  const uniqueChecks = useMemo(() => {
    const map = new Map<string, CheckItem>();
    for (const item of checks) map.set(item.key, item);
    return Array.from(map.values());
  }, [checks]);

  const overall = useMemo(() => getOverallStatus(uniqueChecks), [uniqueChecks]);
  const score = useMemo(
    () => uniqueChecks.reduce((acc, item) => acc + toStatusScore(item.status), 0),
    [uniqueChecks]
  );

  const toggleLiteMode = () => {
    setLiteMode(!liteMode);
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
              Kiểm tra cấu hình thiết bị
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Hệ thống vừa kiểm tra nhanh để tối ưu trải nghiệm FoodStreet cho bạn.
            </p>
          </div>
          <div
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${statusMeta[overall].className}`}
          >
            {statusMeta[overall].icon} Tổng quan: {statusMeta[overall].label}
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          Điểm tương thích: <span className="font-semibold">{score}</span>/
          <span className="font-semibold">8</span>
        </div>

        <div className="space-y-3">
          {uniqueChecks.map((item) => {
            const icon =
              item.key === "performance" ? (
                <Gauge className="h-5 w-5" />
              ) : item.key === "audio" ? (
                <Volume2 className="h-5 w-5" />
              ) : item.key === "location" ? (
                <MapPin className="h-5 w-5" />
              ) : (
                <Cpu className="h-5 w-5" />
              );

            return (
              <section key={item.key} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-800">
                    {icon}
                    <h2 className="text-sm font-semibold md:text-base">{item.title}</h2>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta[item.status].className}`}
                  >
                    {statusMeta[item.status].icon}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{item.description}</p>
                <p className="mt-2 text-sm font-medium text-slate-800">Gợi ý: {item.suggestion}</p>
              </section>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-slate-800">
            <Mic className="h-5 w-5" />
            <Languages className="h-5 w-5" />
            <h3 className="text-sm font-semibold">Tối ưu trải nghiệm</h3>
          </div>
          <button
            type="button"
            onClick={toggleLiteMode}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {liteMode ? "Đang bật Lite mode (bấm để tắt)" : "Bật Lite mode để giảm tải"}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Lite mode sẽ ưu tiên giao diện nhẹ, giảm hiệu ứng và giảm tài nguyên tải về trên thiết
            bị yếu.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={nextPath}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Tiếp tục vào hệ thống
          </Link>
          <Link
            href="/customer/map"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Đến bản đồ
          </Link>
        </div>
      </div>
    </main>
  );
}
