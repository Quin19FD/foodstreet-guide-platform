import { createHash } from "node:crypto";
import { config } from "@/shared/config";

type CloudinaryUploadInput = {
  file: File;
  folder: string;
  resourceType: "image" | "video" | "auto" | "raw";
};

type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format?: string;
  bytes?: number;
};

function getCloudinaryEnv() {
  return {
    cloudName: config.cloudinary.cloudName,
    uploadPreset: config.cloudinary.uploadPreset,
    apiKey: config.cloudinary.apiKey,
    apiSecret: config.cloudinary.apiSecret,
  };
}

function sha1(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

export async function uploadToCloudinary(
  input: CloudinaryUploadInput
): Promise<CloudinaryUploadResult> {
  const env = getCloudinaryEnv();
  if (!env.cloudName) {
    throw new Error("Thiếu CLOUDINARY_CLOUD_NAME");
  }

  const url = `https://api.cloudinary.com/v1_1/${env.cloudName}/${input.resourceType}/upload`;
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("folder", input.folder);

  if (env.apiKey && env.apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureBase = `folder=${input.folder}&timestamp=${timestamp}${env.apiSecret}`;
    const signature = sha1(signatureBase);

    formData.append("api_key", env.apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
  } else {
    if (!env.uploadPreset) {
      throw new Error("Thiếu CLOUDINARY_UPLOAD_PRESET hoặc API key/secret");
    }
    formData.append("upload_preset", env.uploadPreset);
  }

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    resource_type?: string;
    format?: string;
    bytes?: number;
    error?: { message?: string };
  } | null;

  if (!response.ok || !data?.secure_url || !data.public_id) {
    throw new Error(data?.error?.message ?? "Upload Cloudinary thất bại");
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type ?? input.resourceType,
    format: data.format,
    bytes: data.bytes,
  };
}
