import { describe, expect, it } from "vitest";

import { getPoiQrInfo } from "@/shared/utils/poi-qr";

describe("getPoiQrInfo", () => {
  it("creates payload and image URL for valid poi id", () => {
    const qr = getPoiQrInfo("cma9abc123xyz", 300);
    expect(qr).toEqual({
      poiId: "cma9abc123xyz",
      payload: "poi:cma9abc123xyz",
      imageUrl:
        "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=poi%3Acma9abc123xyz",
      customerPath: "/customer/pois/cma9abc123xyz",
    });
  });

  it("returns null for invalid poi id", () => {
    expect(getPoiQrInfo("invalid poi id")).toBeNull();
  });
});
