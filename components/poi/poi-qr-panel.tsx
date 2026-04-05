"use client";

import { Copy, Download, ExternalLink, QrCode } from "lucide-react";
import { useMemo, useState } from "react";

import { getPoiQrInfo } from "@/shared/utils/poi-qr";

type PoiQrPanelProps = {
  poiId: string;
  poiName: string;
  ownerLabel: "admin" | "vendor";
};

function copyText(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }
  return Promise.reject(new Error("Clipboard không khả dụng"));
}

export function PoiQrPanel(props: PoiQrPanelProps) {
  const { poiId, poiName, ownerLabel } = props;

  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"neutral" | "success" | "error">("neutral");

  const qr = useMemo(() => getPoiQrInfo(poiId), [poiId]);

  if (!qr) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Không thể tạo QR cho POI này vì ID không hợp lệ.
      </section>
    );
  }

  const customerUrl =
    typeof window !== "undefined" ? `${window.location.origin}${qr.customerPath}` : qr.customerPath;

  const showNotice = (tone: "neutral" | "success" | "error", text: string) => {
    setNoticeTone(tone);
    setNotice(text);
    window.setTimeout(() => setNotice(null), 2200);
  };

  const handleCopyPayload = async () => {
    try {
      await copyText(qr.payload);
      showNotice("success", "Đã copy payload QR.");
    } catch {
      showNotice("error", "Không thể copy payload trên trình duyệt này.");
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyText(customerUrl);
      showNotice("success", "Đã copy link chi tiết POI.");
    } catch {
      showNotice("error", "Không thể copy link trên trình duyệt này.");
    }
  };

  const handleDownloadQr = () => {
    const anchor = document.createElement("a");
    anchor.href = qr.imageUrl;
    anchor.download = `poi-${poiId}-qr.png`;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.click();
    showNotice("neutral", "Đang mở ảnh QR để tải/in.");
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            QR Cho {ownerLabel.toUpperCase()}
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">QR POI: {poiName}</h2>
          <p className="mt-1 text-xs text-slate-500">POI ID: {poiId}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          <QrCode className="h-3.5 w-3.5" />
          Ready
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[230px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <img
            src={qr.imageUrl}
            alt={`QR code for ${poiName}`}
            className="h-full w-full rounded-lg border border-slate-200 bg-white object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-500">Payload QR (khuyên dùng)</p>
            <p className="mt-1 font-mono text-sm text-slate-800">{qr.payload}</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-500">Link chi tiết POI (customer)</p>
            <p className="mt-1 break-all text-sm text-slate-700">{customerUrl}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopyPayload()}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy payload
            </button>
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </button>
            <button
              type="button"
              onClick={handleDownloadQr}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100"
            >
              <Download className="h-3.5 w-3.5" />
              Tải QR PNG
            </button>
            <a
              href={qr.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Mở ảnh QR
            </a>
          </div>

          {notice ? (
            <p
              className={`rounded-lg px-3 py-2 text-xs ${
                noticeTone === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : noticeTone === "error"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {notice}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
