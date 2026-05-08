import * as nodemailer from "nodemailer";

import { config } from "@/shared/config";

type SendVendorApprovedEmailInput = {
  to: string;
  vendorName?: string | null;
};

type SendVendorRejectedEmailInput = {
  to: string;
  vendorName?: string | null;
  reason: string;
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

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __vendorMailerTransporter: nodemailer.Transporter | undefined;
}

function getEnv(name: string): string | null {
  const value = process.env[name];
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolveSmtpConfig(): { ok: true; config: SmtpConfig } | { ok: false; missing: string[] } {
  const host = getEnv("SMTP_HOST");
  const portRaw = getEnv("SMTP_PORT");
  const fromEnv = getEnv("SMTP_FROM");
  const user = getEnv("SMTP_USER") ?? (fromEnv?.includes("@") ? fromEnv : null);
  const passRaw = getEnv("SMTP_PASS");
  const pass =
    host === "smtp.gmail.com" && passRaw?.includes(" ") ? passRaw.replaceAll(" ", "") : passRaw;

  const missing = [
    !host ? "SMTP_HOST" : null,
    !portRaw ? "SMTP_PORT" : null,
    !user ? "SMTP_USER/SMTP_FROM" : null,
    !pass ? "SMTP_PASS" : null,
  ].filter((value): value is string => Boolean(value));

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  const port = Number(portRaw);
  const secure = port === 465;
  const resolvedUser = user as string;
  const from = fromEnv
    ? fromEnv.includes("@")
      ? fromEnv
      : `${fromEnv} <${resolvedUser}>`
    : resolvedUser;

  return {
    ok: true,
    config: {
      host: host as string,
      port,
      secure,
      user: resolvedUser,
      pass: pass as string,
      from,
    },
  };
}

function getTransporter(config: SmtpConfig): nodemailer.Transporter {
  if (globalThis.__vendorMailerTransporter) {
    return globalThis.__vendorMailerTransporter;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  globalThis.__vendorMailerTransporter = transporter;
  return transporter;
}

async function sendMailOrDevLog(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const smtp = resolveSmtpConfig();

  if (!smtp.ok) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `SMTP chưa cấu hình đầy đủ cho mail vendor: ${smtp.missing.join(", ")}`
      );
    }

    console.log(`[DEV][VENDOR_MAIL] to=${input.to} subject=${input.subject}`);
    console.log(input.text);
    console.warn(
      `[DEV][VENDOR_MAIL] SMTP chưa cấu hình đầy đủ (${smtp.missing.join(", ")}) -> không gửi mail thật`
    );
    return;
  }

  const transporter = getTransporter(smtp.config);

  try {
    await transporter.sendMail({
      from: smtp.config.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Gửi mail vendor qua SMTP thất bại (${smtp.config.host}:${smtp.config.port}, secure=${smtp.config.secure ? "yes" : "no"}): ${reason}`
    );
  }
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

export async function sendVendorRejectedEmail(input: SendVendorRejectedEmailInput): Promise<void> {
  const vendorName = input.vendorName?.trim() || "Vendor";
  const loginUrl = `${config.app.url}/vendor/login`;

  await sendMailOrDevLog({
    to: input.to,
    subject: "Tài khoản vendor bị từ chối",
    text: `Xin chào ${vendorName},

Yêu cầu đăng ký tài khoản vendor của bạn đã bị từ chối.
Lý do: ${input.reason}

Bạn có thể đăng ký lại sau khi chỉnh sửa thông tin (hoặc liên hệ admin).
Trang đăng nhập: ${loginUrl}`,
  });
}

export async function sendPoiApprovedEmail(input: SendPoiApprovedEmailInput): Promise<void> {
  const vendorName = input.vendorName?.trim() || "Vendor";

  await sendMailOrDevLog({
    to: input.to,
    subject: `POI "${input.poiName}" đã được phê duyệt`,
    text: `Xin chào ${vendorName},

POI "${input.poiName}" của bạn đã được admin phê duyệt.
POI có thể hiển thị với người dùng nếu đang mở khóa.

Trân trọng.`,
  });
}

export async function sendPoiRejectedEmail(input: SendPoiRejectedEmailInput): Promise<void> {
  const vendorName = input.vendorName?.trim() || "Vendor";

  await sendMailOrDevLog({
    to: input.to,
    subject: `POI "${input.poiName}" chưa được phê duyệt`,
    text: `Xin chào ${vendorName},

POI "${input.poiName}" chưa được phê duyệt.
Lý do: ${input.reason}

Bạn vui lòng chỉnh sửa POI và gửi duyệt lại.
Trân trọng.`,
  });
}
