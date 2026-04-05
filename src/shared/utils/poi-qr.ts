import { buildPoiQrPayload } from "@/shared/utils/qr-scan";

export type PoiQrInfo = {
  poiId: string;
  payload: string;
  imageUrl: string;
  customerPath: string;
};

function qrImageUrl(payload: string, size: number): string {
  const encoded = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
}

export function getPoiQrInfo(poiId: string, size = 360): PoiQrInfo | null {
  const payload = buildPoiQrPayload(poiId);
  if (!payload) return null;

  return {
    poiId,
    payload,
    imageUrl: qrImageUrl(payload, size),
    customerPath: `/customer/pois/${encodeURIComponent(poiId)}`,
  };
}
