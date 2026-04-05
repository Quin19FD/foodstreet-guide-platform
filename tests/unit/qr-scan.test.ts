import { describe, expect, it } from "vitest";

import { buildPoiQrPayload, parsePoiQrPayload } from "@/shared/utils/qr-scan";

describe("parsePoiQrPayload", () => {
  it("parses prefix format poi:<id>", () => {
    expect(parsePoiQrPayload("poi:cma9abc123xyz")).toEqual({
      poiId: "cma9abc123xyz",
      source: "prefix",
    });
  });

  it("parses full customer POI URL", () => {
    expect(parsePoiQrPayload("https://foodstreet.vn/customer/pois/cma9abc123xyz")).toEqual({
      poiId: "cma9abc123xyz",
      source: "path",
    });
  });

  it("parses relative POI path", () => {
    expect(parsePoiQrPayload("/customer/pois/cma9abc123xyz")).toEqual({
      poiId: "cma9abc123xyz",
      source: "path",
    });
  });

  it("parses poiId from query string", () => {
    expect(parsePoiQrPayload("https://foodstreet.vn/scan?poiId=cma9abc123xyz")).toEqual({
      poiId: "cma9abc123xyz",
      source: "query",
    });
  });

  it("returns null for district QR", () => {
    expect(parsePoiQrPayload("district:district-01")).toBeNull();
  });

  it("returns null for invalid text", () => {
    expect(parsePoiQrPayload("hello world")).toBeNull();
  });
});

describe("buildPoiQrPayload", () => {
  it("builds valid payload", () => {
    expect(buildPoiQrPayload("cma9abc123xyz")).toBe("poi:cma9abc123xyz");
  });

  it("returns null for invalid poi id", () => {
    expect(buildPoiQrPayload("poi id with space")).toBeNull();
  });
});
