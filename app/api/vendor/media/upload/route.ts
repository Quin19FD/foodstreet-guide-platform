import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { uploadToCloudinary } from "@/infrastructure/media/cloudinary";

import { jsonError } from "../../auth/_shared";
import { requireVendor } from "../../pois/_shared";

export const runtime = "nodejs";

/**
 * POST /api/vendor/media/upload
 * multipart/form-data: file, kind=image|audio
 */
export async function POST(request: NextRequest) {
  const vendorResult = await requireVendor(request);
  if (vendorResult instanceof NextResponse) return vendorResult;

  const formData = await request.formData().catch(() => null);
  if (!formData) return jsonError(400, "Dữ liệu upload không hợp lệ");

  const file = formData.get("file");
  const kindRaw = String(formData.get("kind") ?? "image").toLowerCase();
  const kind = kindRaw === "audio" ? "audio" : "image";

  if (!(file instanceof File)) {
    return jsonError(400, "Thiếu file upload");
  }

  const maxBytes = kind === "audio" ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    return jsonError(400, `File quá lớn. Giới hạn ${kind === "audio" ? "25MB" : "10MB"}`);
  }

  const contentType = file.type.toLowerCase();
  if (kind === "image" && !contentType.startsWith("image/")) {
    return jsonError(400, "File ảnh không hợp lệ");
  }

  if (kind === "audio" && !contentType.startsWith("audio/")) {
    return jsonError(400, "File audio không hợp lệ");
  }

  const folder = kind === "audio" ? "foodstreet/vendor/audio" : "foodstreet/vendor/images";
  const resourceType = kind === "audio" ? "video" : "image";

  try {
    const result = await uploadToCloudinary({
      file,
      folder,
      resourceType,
    });

    return NextResponse.json({
      ok: true,
      url: result.secureUrl,
      publicId: result.publicId,
      resourceType: result.resourceType,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    return jsonError(500, error instanceof Error ? error.message : "Upload Cloudinary thất bại");
  }
}
