"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import styles from "./login.module.css";

type AuthErrorResponse = {
  error?: string;
  retryAfterSeconds?: number;
  issues?: Array<{ message?: string }>;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => searchParams.get("next") ?? "/admin/dashboard", [searchParams]);
  const dotKeys = useMemo(() => Array.from({ length: 12 }, (_, idx) => `dot-${idx}`), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isBusy = isLoading || isAutoChecking;

  const emailTrimmed = useMemo(() => email.trim(), [email]);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const validateClient = (): string | null => {
    if (!emailTrimmed) return "Email không được để trống";
    // Regex đơn giản (frontend). Backend vẫn validate bằng zod.
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
    if (!isEmail) return "Email không đúng định dạng";
    if (!password) return "Mật khẩu không được để trống";
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsAutoChecking(true);
      setErrorMessage(null);

      try {
        const me = await fetch("/api/admin/session/me", { method: "GET" });
        if (me.ok) {
          router.replace(nextPath);
          return;
        }

        const refreshed = await fetch("/api/admin/session/refresh", { method: "POST" });
        if (refreshed.ok) {
          router.replace(nextPath);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setIsAutoChecking(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [nextPath, router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const clientError = validateClient();
    if (clientError) {
      setErrorMessage(clientError);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed, password, rememberMe }),
      });

      if (res.ok) {
        router.replace(nextPath);
        return;
      }

      const data = (await res.json().catch(() => null)) as AuthErrorResponse | null;
      if (res.status === 429) {
        const seconds = data?.retryAfterSeconds ?? 60;
        setErrorMessage(`Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau ${seconds}s.`);
        return;
      }

      const issueMessage = data?.issues?.[0]?.message;
      setErrorMessage(issueMessage ?? data?.error ?? "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* LEFT PANEL */}
      <div className={styles.left}>
        <div className={styles.leftBg} />
        <div className={styles.leftOverlay} />

        {/* Logo */}
        <div className={styles.logoBadge}>
          <div className={styles.logoIcon}>🍜</div>
          <div className={styles.logoText}>
            Phố Ẩm Thực
            <span className={styles.logoTextSub}>Culinary District</span>
          </div>
        </div>

        {/* Decorative dots */}
        <div className={styles.dotsStrip}>
          {dotKeys.map((key) => (
            <span key={key} />
          ))}
        </div>

        {/* Bottom content */}
        <div className={styles.leftContent}>
          <div className={styles.tagLine}>Nền tảng quản lý</div>
          <h1 className={styles.slogan}>
            Nơi hương vị
            <br />
            <em>trở thành</em>
            <br />
            câu chuyện.
          </h1>
          <p className={styles.motto}>
            Kết nối thực khách với những khu phố ẩm thực sống động nhất — từng con phố, từng hương
            thơm, từng ký ức đáng nhớ.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={styles.right}>
        <div className={styles.cornerDeco} />
        <div className={styles.cornerDecoBl} />

        {/* Header */}
        <div className={styles.formHeader}>
          <p className={styles.formEyebrow}>Cổng quản trị</p>
          <h2 className={styles.formTitle}>
            Đăng nhập<span>.</span>
          </h2>
          <p className={styles.formSub}>Dành riêng cho quản trị viên hệ thống.</p>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleLogin}>
          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="email">Tài khoản</label>
            <div className={styles.inputWrap}>
              <span className={styles.icon}>✉</span>
              <input
                type="email"
                id="email"
                placeholder="admin@foodstreet.vn"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                disabled={isBusy}
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="password">Mật khẩu</label>
            <div className={styles.inputWrap}>
              <span className={styles.icon}>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••••"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isBusy}
              />
              <button
                type="button"
                className={styles.togglePw}
                onClick={togglePassword}
                title="Hiện/Ẩn mật khẩu"
                aria-label="Toggle password"
                disabled={isBusy}
              >
                👁
              </button>
            </div>
          </div>

          {/* Error */}
          {errorMessage ? (
            <div
              className={styles.field}
              role="alert"
              style={{ color: "#ffb4b4", fontSize: 13, marginTop: -6 }}
            >
              {errorMessage}
            </div>
          ) : null}

          {/* Options */}
          <div className={styles.optionsRow}>
            <label className={styles.remember}>
              <input
                type="checkbox"
                className={styles.rememberCheckbox}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isBusy}
              />
              <span className={styles.checkmark} />
              <span className={styles.rememberText}>Ghi nhớ đăng nhập</span>
            </label>
            <a href="/admin/forgot-password" className={styles.forgotLink}>
              Quên mật khẩu?
            </a>
          </div>

          {/* Submit */}
          <button type="submit" className={styles.btnLogin} disabled={isBusy}>
            <span className={styles.btnInner}>
              <span>
                {isAutoChecking
                  ? "Đang kiểm tra phiên..."
                  : isLoading
                    ? "Đang xác thực..."
                    : "Đăng nhập ngay"}
              </span>
              <span>{isBusy ? "⟳" : "→"}</span>
            </span>
          </button>
        </form>

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <a href="/admin/register" className={styles.forgotLink}>
            Chưa có tài khoản? Đăng ký
          </a>
        </div>

        {/* Footer */}
        <div className={styles.formFooter}>
          <p>
            Chỉ dành cho <strong>quản trị viên được uỷ quyền</strong>.
            <br />
            Mọi hoạt động được ghi lại và giám sát.
          </p>
        </div>

        <span className={styles.verBadge}>v2.4.1 © 2026</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            fontSize: 16,
          }}
        >
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
