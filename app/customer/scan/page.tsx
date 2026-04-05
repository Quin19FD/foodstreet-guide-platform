"use client";

import { parsePoiQrPayload } from "@/shared/utils/qr-scan";
import { ArrowLeft, Camera, CameraOff, QrCode, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type DetectResult = {
  rawValue?: string;
};

type BarcodeDetectorInstance = {
  detect: (image: ImageBitmapSource) => Promise<DetectResult[]>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

const SCAN_INTERVAL_MS = 500;

function getBarcodeDetectorConstructor(): BarcodeDetectorConstructor | null {
  if (typeof window === "undefined") return null;

  const detector = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;
  if (!detector) return null;
  return detector;
}

export default function CustomerScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);
  const isResolvingRef = useRef(false);

  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [supportsDetector, setSupportsDetector] = useState(false);
  const [statusText, setStatusText] = useState(
    "Nhấn 'Bật camera' để quét QR POI theo thời gian thực."
  );
  const [statusTone, setStatusTone] = useState<"neutral" | "success" | "warning" | "error">(
    "neutral"
  );
  const [lastPayload, setLastPayload] = useState<string | null>(null);
  const [manualPayload, setManualPayload] = useState("");

  const stopScanner = useCallback(() => {
    if (scanTimerRef.current != null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    detectorRef.current = null;
    isDetectingRef.current = false;
    setIsCameraRunning(false);
    setIsStartingCamera(false);
  }, []);

  const resolvePayloadAndNavigate = useCallback(
    async (rawPayload: string, source: "camera" | "manual") => {
      if (isResolvingRef.current) return;

      isResolvingRef.current = true;
      setLastPayload(rawPayload);
      setStatusTone("neutral");
      setStatusText("Đang phân tích mã QR...");

      try {
        const parsed = parsePoiQrPayload(rawPayload);
        if (!parsed) {
          setStatusTone("error");
          setStatusText(
            "QR không đúng định dạng POI. Hệ thống hỗ trợ: 'poi:<id>' hoặc link /customer/pois/<id>."
          );
          return;
        }

        setStatusText("Đã nhận diện POI, đang xác minh dữ liệu...");

        const response = await fetch(`/api/customer/pois/${parsed.poiId}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          setStatusTone("error");
          setStatusText("POI không tồn tại hoặc đã bị ẩn. Vui lòng quét mã khác.");
          return;
        }

        setStatusTone("success");
        setStatusText(
          source === "camera"
            ? "Quét thành công. Đang chuyển đến trang chi tiết POI..."
            : "Xác minh thành công. Đang chuyển đến trang chi tiết POI..."
        );
        stopScanner();
        router.push(`/customer/pois/${parsed.poiId}`);
      } catch {
        setStatusTone("error");
        setStatusText("Không thể xử lý mã QR do lỗi kết nối. Vui lòng thử lại.");
      } finally {
        isResolvingRef.current = false;
      }
    },
    [router, stopScanner]
  );

  const detectFrame = useCallback(async () => {
    if (isDetectingRef.current || isResolvingRef.current) return;
    if (!detectorRef.current || !videoRef.current) return;
    if (videoRef.current.readyState < 2) return;

    isDetectingRef.current = true;
    try {
      const result = await detectorRef.current.detect(videoRef.current);
      const payload = result.find((item) => item.rawValue?.trim())?.rawValue?.trim();
      if (payload) {
        await resolvePayloadAndNavigate(payload, "camera");
      }
    } catch {
      // Ignore transient detector errors to keep scanning loop alive.
    } finally {
      isDetectingRef.current = false;
    }
  }, [resolvePayloadAndNavigate]);

  const startScanner = useCallback(async () => {
    if (isStartingCamera || isCameraRunning) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatusTone("error");
      setStatusText(
        "Trình duyệt hiện tại không hỗ trợ camera. Bạn có thể dán nội dung QR để test."
      );
      return;
    }

    setIsStartingCamera(true);
    setStatusTone("neutral");
    setStatusText("Đang khởi động camera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        stopScanner();
        setStatusTone("error");
        setStatusText("Không thể khởi tạo màn hình camera.");
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const Detector = getBarcodeDetectorConstructor();
      if (!Detector) {
        setSupportsDetector(false);
        setIsCameraRunning(true);
        setIsStartingCamera(false);
        setStatusTone("warning");
        setStatusText(
          "Camera đã bật, nhưng trình duyệt không hỗ trợ quét QR realtime. Hãy dán mã ở ô bên dưới để test."
        );
        return;
      }

      detectorRef.current = new Detector({ formats: ["qr_code"] });
      setSupportsDetector(true);
      setIsCameraRunning(true);
      setIsStartingCamera(false);
      setStatusTone("neutral");
      setStatusText("Đưa mã QR POI vào khung camera để hệ thống tự nhận diện.");

      scanTimerRef.current = window.setInterval(() => {
        void detectFrame();
      }, SCAN_INTERVAL_MS);
    } catch (error) {
      stopScanner();
      const message =
        (error as { name?: string; message?: string })?.name === "NotAllowedError"
          ? "Bạn đã từ chối quyền camera. Hãy cấp quyền camera và thử lại."
          : "Không thể mở camera trên thiết bị này. Bạn có thể dùng cách dán mã để test.";
      setStatusTone("error");
      setStatusText(message);
    } finally {
      setIsStartingCamera(false);
    }
  }, [detectFrame, isCameraRunning, isStartingCamera, stopScanner]);

  useEffect(() => {
    setSupportsDetector(Boolean(getBarcodeDetectorConstructor()));
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 glass-header px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
            <div>
              <h1 className="font-semibold text-slate-900">Quét QR POI</h1>
              <p className="text-xs text-slate-500">Dành cho tài khoản USER</p>
            </div>
          </div>
          <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            {supportsDetector ? "Realtime scan" : "Manual fallback"}
          </div>
        </div>
      </header>

      <main className="space-y-4 p-4">
        <section className="card-elevated p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Camera scanner</h2>
            <div className="flex items-center gap-2">
              {isCameraRunning ? (
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                  Đang bật
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                  Chưa bật
                </span>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black">
            <video
              ref={videoRef}
              className="h-[320px] w-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 rounded-2xl border-2 border-dashed border-orange-300/90 bg-orange-500/10" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void startScanner();
              }}
              disabled={isStartingCamera || isCameraRunning}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-orange-600 disabled:opacity-70"
            >
              <Camera className="h-4 w-4" />
              {isStartingCamera ? "Đang mở camera..." : "Bật camera"}
            </button>
            <button
              type="button"
              onClick={stopScanner}
              disabled={!isCameraRunning && !isStartingCamera}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-70"
            >
              <CameraOff className="h-4 w-4" />
              Tắt camera
            </button>
            <button
              type="button"
              onClick={() => {
                setLastPayload(null);
                setStatusTone("neutral");
                setStatusText("Sẵn sàng quét mã mới.");
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Quét lại
            </button>
          </div>
        </section>

        <section className="card-elevated p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Trạng thái quét</h2>
          <p
            className={`rounded-xl px-3 py-2 text-sm ${
              statusTone === "success"
                ? "bg-emerald-50 text-emerald-700"
                : statusTone === "warning"
                  ? "bg-amber-50 text-amber-700"
                  : statusTone === "error"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-700"
            }`}
          >
            {statusText}
          </p>
          {lastPayload ? (
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Payload gần nhất: <span className="font-mono">{lastPayload}</span>
            </p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            Mã được hỗ trợ tốt nhất: <span className="font-mono">poi:&lt;poiId&gt;</span>
          </p>
        </section>

        <section className="card-elevated p-4">
          <div className="mb-2 flex items-center gap-2">
            <QrCode className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-slate-900">Test local không cần camera</h2>
          </div>
          <p className="text-sm text-slate-600">
            Dùng ô này để test trên máy dev hoặc browser không hỗ trợ quét realtime.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={manualPayload}
              onChange={(event) => setManualPayload(event.target.value)}
              placeholder="Ví dụ: poi:cma9abc123xyz hoặc /customer/pois/cma9abc123xyz"
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
            <button
              type="button"
              onClick={() => {
                if (!manualPayload.trim()) return;
                void resolvePayloadAndNavigate(manualPayload.trim(), "manual");
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Xử lý mã
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
