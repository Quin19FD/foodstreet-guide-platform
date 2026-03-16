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
  const user = getEnv("SMTP_USER");
  const pass = getEnv("SMTP_PASS");
  const from = getEnv("SMTP_FROM") ?? "no-reply@foodstreet.local";

  const subject = "Mã OTP đặt lại mật khẩu (hiệu lực 2 phút)";
  const text = `Mã OTP của bạn là: ${input.otp}\nHiệu lực: ${Math.ceil(
    input.ttlSeconds / 60
  )} phút.\n\nNếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`;

  if (!host || !portRaw || !user || !pass) {
    // Dev fallback: không có SMTP thì log OTP ra server console.
    // Production nên cấu hình SMTP_* để gửi mail thật.
    // eslint-disable-next-line no-console
    console.log(`[DEV][OTP] to=${input.to} otp=${input.otp} ttl=${input.ttlSeconds}s`);
    return;
  }

  const port = Number(portRaw);
  const secure = port === 465;

  try {
    const mod = await import("node:module");
    const require = mod.createRequire(import.meta.url);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require("nodemailer") as {
      createTransport: (options: unknown) => { sendMail: (mail: unknown) => Promise<unknown> };
    };

    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transport.sendMail({
      from,
      to: input.to,
      subject,
      text,
    });
  } catch (error) {
    // Best-effort: không chặn flow nếu gửi mail lỗi.
    // eslint-disable-next-line no-console
    console.error("[OTP] send email failed", error);
  }
}
