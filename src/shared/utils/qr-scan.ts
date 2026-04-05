import { QRCode } from "@/domain/value-objects/qr-code";

export type ParsedPoiQr = {
  poiId: string;
  source: "prefix" | "path" | "query";
};

const POI_ID_PATTERN = /^[A-Za-z0-9_-]{3,128}$/;

function normalizePoiId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const decoded = (() => {
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  })();

  if (!POI_ID_PATTERN.test(decoded)) return null;
  return decoded;
}

function parseFromPrefix(raw: string): ParsedPoiQr | null {
  const parsed = QRCode.fromString(raw);
  if (parsed?.type === "poi") {
    const poiId = normalizePoiId(parsed.data);
    if (poiId) return { poiId, source: "prefix" };
  }

  const fallbackMatch = raw.match(/^poi:(.+)$/i);
  if (!fallbackMatch?.[1]) return null;

  const fallbackPoiId = normalizePoiId(fallbackMatch[1]);
  if (!fallbackPoiId) return null;
  return { poiId: fallbackPoiId, source: "prefix" };
}

function parseFromUrl(raw: string): ParsedPoiQr | null {
  const looksLikeUrl =
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("/") ||
    raw.includes("/customer/pois/") ||
    raw.includes("/pois/") ||
    raw.includes("poiId=");

  if (!looksLikeUrl) return null;

  let url: URL;
  try {
    url = new URL(raw, "https://foodstreet.local");
  } catch {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);

  const poiSegment = (() => {
    const customerPoisIndex = segments.findIndex(
      (segment, index) => segment === "customer" && segments[index + 1] === "pois"
    );
    if (customerPoisIndex !== -1) return segments[customerPoisIndex + 2] ?? null;

    const poisIndex = segments.findIndex((segment) => segment === "pois");
    if (poisIndex !== -1) return segments[poisIndex + 1] ?? null;

    return null;
  })();

  const pathPoiId = poiSegment ? normalizePoiId(poiSegment) : null;
  if (pathPoiId) return { poiId: pathPoiId, source: "path" };

  const queryPoiId =
    normalizePoiId(url.searchParams.get("poiId") ?? "") ||
    normalizePoiId(url.searchParams.get("poi") ?? "") ||
    normalizePoiId(url.searchParams.get("id") ?? "");

  if (!queryPoiId) return null;
  return { poiId: queryPoiId, source: "query" };
}

export function parsePoiQrPayload(payload: string): ParsedPoiQr | null {
  const raw = payload.trim();
  if (!raw) return null;

  return parseFromPrefix(raw) ?? parseFromUrl(raw);
}

export function buildPoiQrPayload(poiId: string): string | null {
  const normalized = normalizePoiId(poiId);
  if (!normalized) return null;
  return `poi:${normalized}`;
}
