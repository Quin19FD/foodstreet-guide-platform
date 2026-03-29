import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { uploadToCloudinary } from "@/infrastructure/media/cloudinary";

import { ADMIN_AUTH_COOKIES, jsonError, verifyAdminAccessToken } from "../_shared";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_AUTH_COOKIES.access)?.value ?? null;
  if (!token) return jsonError(401, "Chưa đăng nhập");

  try {
    verifyAdminAccessToken(token);
  } catch {
    return jsonError(401, "Phiên đăng nhập không hợp lệ");
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return jsonError(400, "Dữ liệu upload không hợp lệ");

  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError(400, "Thiếu file ảnh");

  if (file.size > 10 * 1024 * 1024) {
    return jsonError(400, "File quá lớn. Giới hạn 10MB");
  }

  if (!file.type.toLowerCase().startsWith("image/")) {
    return jsonError(400, "File ảnh không hợp lệ");
  }

  try {
    const result = await uploadToCloudinary({
      file,
      folder: "foodstreet/profile/admin",
      resourceType: "image",
    });

    return NextResponse.json({
      ok: true,
      url: result.secureUrl,
      publicId: result.publicId,
      bytes: result.bytes,
      format: result.format,
    });
  } catch (error) {
    return jsonError(500, "Upload thất bại, vui lòng thử lại");
  }
}
