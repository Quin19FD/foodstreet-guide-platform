"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../login/login.module.css";

type Step = "request" | "verify" | "reset" | "done";

function pickError(input: unknown, fallback: string): string {
  if (!input || typeof input !== "object") return fallback;
  const maybe = input as { error?: string; issues?: Array<{ message?: string }> };
  return maybe.issues?.[0]?.message ?? maybe.error ?? fallback;
}

export default function CustomerForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitRequestOtp = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/customer/password/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể gửi OTP"));
      }

      setMessage("Nếu email tồn tại, OTP đã được gửi. Vui lòng kiểm tra email.");
      setStep("verify");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const submitVerifyOtp = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/customer/password/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "OTP không hợp lệ"));
      }

      setStep("reset");
      setMessage("OTP hợp lệ. Bạn có thể đặt mật khẩu mới.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const submitReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError("Mật khẩu mới phải ít nhất 8 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }

    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/customer/password/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        throw new Error(pickError(data, "Không thể đặt lại mật khẩu"));
      }

      setStep("done");
      setMessage("Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <div className={styles.leftBg} />
        <div className={styles.leftOverlay} />
      </div>

      <div className={styles.right}>
        <div className={styles.formHeader}>
          <p className={styles.formEyebrow}>Customer</p>
          <h2 className={styles.formTitle}>
            Quên mật khẩu<span>.</span>
          </h2>
          <p className={styles.formSub}>Luồng OTP: Email → OTP → Mật khẩu mới</p>
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email đã đăng ký</label>
            <div className={styles.inputWrap}>
              <span className={styles.icon}>✉</span>
              <input
                id="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || step === "done"}
              />
            </div>
          </div>

          {step !== "request" ? (
            <div className={styles.field}>
              <label htmlFor="otp">OTP</label>
              <div className={styles.inputWrap}>
                <span className={styles.icon}>#</span>
                <input
                  id="otp"
                  className={styles.input}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isLoading || step === "done"}
                />
              </div>
            </div>
          ) : null}

          {step === "reset" ? (
            <>
              <div className={styles.field}>
                <label htmlFor="new-password">Mật khẩu mới</label>
                <div className={styles.inputWrap}>
                  <span className={styles.icon}>🔒</span>
                  <input
                    id="new-password"
                    type="password"
                    className={styles.input}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
                <div className={styles.inputWrap}>
                  <span className={styles.icon}>🔁</span>
                  <input
                    id="confirm-password"
                    type="password"
                    className={styles.input}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          ) : null}

          {error ? <p style={{ color: "#ffb4b4", fontSize: 13 }}>{error}</p> : null}
          {message ? <p style={{ color: "#93c5fd", fontSize: 13 }}>{message}</p> : null}

          {step === "request" ? (
            <button
              type="button"
              className={styles.btnLogin}
              onClick={() => void submitRequestOtp()}
              disabled={isLoading}
            >
              <span className={styles.btnInner}>
                <span>{isLoading ? "Đang gửi OTP..." : "Gửi OTP"}</span>
                <span>→</span>
              </span>
            </button>
          ) : null}

          {step === "verify" ? (
            <button
              type="button"
              className={styles.btnLogin}
              onClick={() => void submitVerifyOtp()}
              disabled={isLoading}
            >
              <span className={styles.btnInner}>
                <span>{isLoading ? "Đang kiểm tra OTP..." : "Xác thực OTP"}</span>
                <span>→</span>
              </span>
            </button>
          ) : null}

          {step === "reset" ? (
            <button
              type="button"
              className={styles.btnLogin}
              onClick={() => void submitReset()}
              disabled={isLoading}
            >
              <span className={styles.btnInner}>
                <span>{isLoading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}</span>
                <span>→</span>
              </span>
            </button>
          ) : null}

          {step === "done" ? (
            <button
              type="button"
              className={styles.btnLogin}
              onClick={() => router.replace("/customer/login")}
            >
              <span className={styles.btnInner}>
                <span>Quay lại đăng nhập</span>
                <span>→</span>
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
