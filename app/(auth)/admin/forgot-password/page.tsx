"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../login/login.module.css";

type ApiError = { error?: string; retryAfterSeconds?: number; issues?: Array<{ message?: string }> };

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailTrimmed = useMemo(() => email.trim(), [email]);

  const requestOtp = async () => {
    setErrorMessage(null);
    setMessage(null);
    setOtpVerified(false);

    if (!emailTrimmed) {
      setErrorMessage("Email không được để trống");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/password/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed }),
      });

      if (res.ok) {
        setMessage("Nếu email tồn tại, hệ thống đã gửi OTP (hiệu lực 2 phút).");
        return;
      }

      const data = (await res.json().catch(() => null)) as ApiError | null;
      if (res.status === 429) {
        const seconds = data?.retryAfterSeconds ?? 60;
        setErrorMessage(`Bạn thao tác quá nhanh. Vui lòng thử lại sau ${seconds}s.`);
        return;
      }

      const issueMessage = data?.issues?.[0]?.message;
      setErrorMessage(issueMessage ?? data?.error ?? "Gửi OTP thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    setErrorMessage(null);
    setMessage(null);

    if (!emailTrimmed) {
      setErrorMessage("Email không được để trống");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setErrorMessage("OTP phải gồm 6 chữ số");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/password/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed, otp: otp.trim() }),
      });

      if (res.ok) {
        setOtpVerified(true);
        setMessage("OTP hợp lệ. Bạn có thể nhập mật khẩu mới.");
        return;
      }

      const data = (await res.json().catch(() => null)) as ApiError | null;
      const issueMessage = data?.issues?.[0]?.message;
      setErrorMessage(issueMessage ?? data?.error ?? "OTP không hợp lệ hoặc đã hết hạn");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    setErrorMessage(null);
    setMessage(null);

    if (!otpVerified) {
      setErrorMessage("Vui lòng xác thực OTP trước");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Xác nhận mật khẩu không khớp");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/password/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed, otp: otp.trim(), newPassword }),
      });

      if (res.ok) {
        router.replace("/admin/login?reset=1");
        return;
      }

      const data = (await res.json().catch(() => null)) as ApiError | null;
      const issueMessage = data?.issues?.[0]?.message;
      setErrorMessage(issueMessage ?? data?.error ?? "Đổi mật khẩu thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <div className={styles.leftBg} />
        <div className={styles.leftOverlay} />

        <div className={styles.logoBadge}>
          <div className={styles.logoIcon}>🍜</div>
          <div className={styles.logoText}>
            Phố Ẩm Thực
            <span className={styles.logoTextSub}>Culinary District</span>
          </div>
        </div>

        <div className={styles.leftContent}>
          <div className={styles.tagLine}>Khôi phục tài khoản</div>
          <h1 className={styles.slogan}>
            Đặt lại
            <br />
            <em>mật khẩu</em>
            <br />
            admin.
          </h1>
          <p className={styles.motto}>OTP có hiệu lực 2 phút. Vui lòng kiểm tra email đã đăng ký.</p>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.cornerDeco} />
        <div className={styles.cornerDecoBl} />

        <div className={styles.formHeader}>
          <p className={styles.formEyebrow}>Cổng quản trị</p>
          <h2 className={styles.formTitle}>
            Quên mật khẩu<span>.</span>
          </h2>
          <p className={styles.formSub}>Nhập email để nhận OTP và đặt lại mật khẩu.</p>
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrap}>
              <span className={styles.icon}>✉</span>
              <input
                id="email"
                type="email"
                placeholder="admin@foodstreet.vn"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>

          <button type="button" className={styles.btnLogin} disabled={isLoading} onClick={requestOtp}>
            <span className={styles.btnInner}>
              <span>{isLoading ? "Đang gửi..." : "Gửi OTP"}</span>
              <span>{isLoading ? "⟳" : "→"}</span>
            </span>
          </button>

          <div className={styles.field} style={{ marginTop: 14 }}>
            <label htmlFor="otp">OTP</label>
            <div className={styles.inputWrap}>
              <span className={styles.icon}>🔑</span>
              <input
                id="otp"
                inputMode="numeric"
                placeholder="6 chữ số"
                className={styles.input}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="button" className={styles.btnLogin} disabled={isLoading} onClick={verifyOtp}>
            <span className={styles.btnInner}>
              <span>{isLoading ? "Đang xác thực..." : "Xác thực OTP"}</span>
              <span>{isLoading ? "⟳" : "→"}</span>
            </span>
          </button>

          <div className={styles.field} style={{ marginTop: 14, opacity: otpVerified ? 1 : 0.6 }}>
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <div className={styles.inputWrap}>
              <span className={styles.icon}>🔒</span>
              <input
                id="newPassword"
                type="password"
                placeholder="Ít nhất 8 ký tự"
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading || !otpVerified}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className={styles.field} style={{ opacity: otpVerified ? 1 : 0.6 }}>
            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
            <div className={styles.inputWrap}>
              <span className={styles.icon}>🔁</span>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || !otpVerified}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="button"
            className={styles.btnLogin}
            disabled={isLoading || !otpVerified}
            onClick={resetPassword}
          >
            <span className={styles.btnInner}>
              <span>{isLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}</span>
              <span>{isLoading ? "⟳" : "→"}</span>
            </span>
          </button>

          {errorMessage ? (
            <div
              className={styles.field}
              role="alert"
              style={{ color: "#ffb4b4", fontSize: 13, marginTop: 10 }}
            >
              {errorMessage}
            </div>
          ) : null}

          {message ? (
            <div className={styles.field} style={{ color: "#b9f6ca", fontSize: 13, marginTop: 10 }}>
              {message}
            </div>
          ) : null}

          <div style={{ marginTop: 14, textAlign: "center" }}>
            <a href="/admin/login" className={styles.forgotLink}>
              Quay lại đăng nhập
            </a>
          </div>
        </div>

        <span className={styles.verBadge}>v2.4.1 © 2026</span>
      </div>
    </div>
  );
}

