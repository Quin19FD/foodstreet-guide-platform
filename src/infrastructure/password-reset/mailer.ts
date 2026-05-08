import * as nodemailer from "nodemailer";

type SendOtpEmailInput = {
  to: string;
  otp: string;
  ttlSeconds: number;
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
  var __passwordResetTransporter: nodemailer.Transporter | undefined;
}

function getEnv(name: string): string | null {
  const value = process.env[name];
  return value?.trim() ? value.trim() : null;
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
  if (globalThis.__passwordResetTransporter) {
    return globalThis.__passwordResetTransporter;
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

  globalThis.__passwordResetTransporter = transporter;
  return transporter;
}

export async function sendPasswordResetOtpEmail(input: SendOtpEmailInput): Promise<void> {
  const smtp = resolveSmtpConfig();

  if (!smtp.ok) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`SMTP chưa cấu hình đầy đủ cho tính năng gửi OTP: ${smtp.missing.join(", ")}`);
    }

    console.log(`[DEV][OTP] to=${input.to} otp=${input.otp}`);
    console.warn(
      `[DEV][OTP] SMTP chưa cấu hình đầy đủ (${smtp.missing.join(", ")}) → không gửi mail thật`
    );
    return;
  }

  const subject = "Mã OTP đặt lại mật khẩu (hiệu lực 2 phút)";
  const text = `Mã OTP của bạn là: ${input.otp}
Hiệu lực: ${Math.ceil(input.ttlSeconds / 60)} phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`;

  const transporter = getTransporter(smtp.config);

  try {
    await transporter.sendMail({
      from: smtp.config.from,
      to: input.to,
      subject,
      text,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Gửi OTP qua SMTP thất bại (${smtp.config.host}:${smtp.config.port}, secure=${smtp.config.secure ? "yes" : "no"}): ${reason}`
    );
  }
}
