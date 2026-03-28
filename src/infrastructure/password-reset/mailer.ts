import * as nodemailer from "nodemailer";

type SendOtpEmailInput = {
  to: string;
  otp: string;
  ttlSeconds: number;
};

function getEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

export async function sendPasswordResetOtpEmail(input: SendOtpEmailInput): Promise<void> {
  const host = getEnv("SMTP_HOST");
  const portRaw = getEnv("SMTP_PORT");
  const fromEnv = getEnv("SMTP_FROM");
  const user = getEnv("SMTP_USER") ?? (fromEnv && fromEnv.includes("@") ? fromEnv : null);
  const passRaw = getEnv("SMTP_PASS");
  const pass =
    host === "smtp.gmail.com" && passRaw?.includes(" ") ? passRaw.replaceAll(" ", "") : passRaw;
  const from = fromEnv ?? user ?? "no-reply@foodstreet.local";

  const subject = "Mã OTP đặt lại mật khẩu (hiệu lực 2 phút)";
  const text = `Mã OTP của bạn là: ${input.otp}
Hiệu lực: ${Math.ceil(input.ttlSeconds / 60)} phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`;

  if (!host || !portRaw || !user || !pass) {
    console.log(`[DEV][OTP] to=${input.to} otp=${input.otp}`);
    console.warn("[DEV][OTP] SMTP chưa cấu hình đầy đủ → không gửi mail thật");
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

  // 🔥 CỰC KỲ QUAN TRỌNG: test SMTP
  await transport.verify();

  await transport.sendMail({
    from,
    to: input.to,
    subject,
    text,
  });
}
