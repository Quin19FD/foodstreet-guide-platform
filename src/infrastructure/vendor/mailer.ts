import * as nodemailer from "nodemailer";

import { config } from "@/shared/config";

type SendVendorApprovedEmailInput = {
  to: string;
  vendorName?: string | null;
};

type SendPoiApprovedEmailInput = {
  to: string;
  vendorName?: string | null;
  poiName: string;
};

type SendPoiRejectedEmailInput = {
  to: string;
  vendorName?: string | null;
  poiName: string;
  reason: string;
};

function getEnv(name: string): string | null {
  const value = process.env[name];
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getSmtpConfig(): {
  host: string | null;
  portRaw: string | null;
  fromEnv: string | null;
  user: string | null;
  pass: string | null;
} {
  const host = getEnv("SMTP_HOST");
  const portRaw = getEnv("SMTP_PORT");
  const fromEnv = getEnv("SMTP_FROM");
  const user = getEnv("SMTP_USER") ?? (fromEnv?.includes("@") ? fromEnv : null);
  const passRaw = getEnv("SMTP_PASS");
  const pass =
    host === "smtp.gmail.com" && passRaw?.includes(" ") ? passRaw.replaceAll(" ", "") : passRaw;

  return { host, portRaw, fromEnv, user, pass: pass ?? null };
}

async function sendMailOrDevLog(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const { host, portRaw, fromEnv, user, pass } = getSmtpConfig();
  const from = fromEnv ?? user ?? "no-reply@foodstreet.local";

  if (!host || !portRaw || !user || !pass) {
    console.log(`[DEV][VENDOR_MAIL] to=${input.to} subject=${input.subject}`);
    console.log(input.text);
    console.warn("[DEV][VENDOR_MAIL] SMTP chưa cấu hình đầy đủ → không gửi mail thật");
    return;
  }

  const port = Number(portRaw);
  const secure = port === 465;

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transport.verify();
  await transport.sendMail({ from, to: input.to, subject: input.subject, text: input.text });
}

export async function sendVendorApprovedEmail(input: SendVendorApprovedEmailInput): Promise<void> {
  const vendorName = input.vendorName?.trim() || "Vendor";
  const loginUrl = `${config.app.url}/vendor/login`;

  await sendMailOrDevLog({
    to: input.to,
    subject: "Tài khoản vendor đã được phê duyệt",
    text: `Xin chào ${vendorName},

Tài khoản vendor của bạn đã được admin phê duyệt. Bạn có thể đăng nhập tại:
${loginUrl}

Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.`,
  });
}

export async function sendPoiApprovedEmail(input: SendPoiApprovedEmailInput): Promise<void> {
  const vendorName = input.vendorName?.trim() || "Vendor";
  const vendorUrl = `${config.app.url}/vendor/pois`;

  await sendMailOrDevLog({
    to: input.to,
    subject: `POI "${input.poiName}" đã được phê duyệt`,
    text: `Xin chào ${vendorName},

POI "${input.poiName}" của bạn đã được admin phê duyệt. POI này giờ đã xuất hiện trên ứng dụng.

Bạn có thể quản lý POI tại:
${vendorUrl}

Nếu bạn không thực hiện tạo POI, hãy bỏ qua email này.`,
  });
}

export async function sendPoiRejectedEmail(input: SendPoiRejectedEmailInput): Promise<void> {
  const vendorName = input.vendorName?.trim() || "Vendor";
  const vendorUrl = `${config.app.url}/vendor/pois`;

  await sendMailOrDevLog({
    to: input.to,
    subject: `POI "${input.poiName}" bị từ chối`,
    text: `Xin chào ${vendorName},

POI "${input.poiName}" của bạn đã bị từ chối phê duyệt.
Lý do: ${input.reason}

Bạn có thể chỉnh sửa và gửi lại POI tại:
${vendorUrl}

Nếu cần hỗ trợ, hãy liên hệ admin.`,
  });
}
