"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import styles from "../login/login.module.css";

type AuthErrorResponse = {
  error?: string;
  issues?: Array<{ message?: string }>;
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => searchParams.get("next") ?? "/admin/dashboard", [searchParams]);
  const dotKeys = useMemo(() => Array.from({ length: 12 }, (_, idx) => `dot-${idx}`), []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailTrimmed = useMemo(() => email.trim(), [email]);
  const nameTrimmed = useMemo(() => name.trim(), [name]);

  const validateClient = (): string | null => {
    if (!nameTrimmed) return "Tên không được để trống";
    if (!emailTrimmed) return "Email không được để trống";
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
    if (!isEmail) return "Email không đúng định dạng";
    if (!password) return "Mật khẩu không được để trống";
    if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
    if (password !== confirmPassword) return "Xác nhận mật khẩu không khớp";
    return null;
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const clientError = validateClient();
    if (clientError) {
      setErrorMessage(clientError);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed, name: nameTrimmed, password, rememberMe }),
      });

      if (res.ok) {
        router.replace(nextPath);
        return;
      }

      const data = (await res.json().catch(() => null)) as AuthErrorResponse | null;
      const issueMessage = data?.issues?.[0]?.message;
      setErrorMessage(issueMessage ?? data?.error ?? "Đăng ký thất bại");
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

        <div className={styles.logoBadge}>
          <div className={styles.logoIcon}>🍜</div>
          <div className={styles.logoText}>
            Phố Ẩm Thực
            <span className={styles.logoTextSub}>Culinary District</span>
          </div>
        </div>

        <div className={styles.dotsStrip}>
          {dotKeys.map((key) => (
            <span key={key} />
          ))}
        </div>

        <div className={styles.leftContent}>
          <div className={styles.tagLine}>Khởi tạo hệ thống</div>
          <h1 className={styles.slogan}>
            Tạo
            <br />
            <em>admin</em>
            <br />
            đầu tiên.
          </h1>
          <p className={styles.motto}>
            Chỉ dùng cho lần thiết lập ban đầu. Sau khi đã có admin, hệ thống sẽ chặn tự đăng ký.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={styles.right}>
        <div className={styles.cornerDeco} />
        <div className={styles.cornerDecoBl} />

        <div className={styles.formHeader}>
          <p className={styles.formEyebrow}>Cổng quản trị</p>
          <h2 className={styles.formTitle}>
            Đăng ký<span>.</span>
          </h2>
          <p className={styles.formSub}>Tạo tài khoản admin đầu tiên để đăng nhập.</p>
        </div>

        <form className={styles.form} onSubmit={handleRegister}>
          <div className={styles.field}>
            <label htmlFor="name">Họ và tên</label>
            <div className={styles.inputWrap}>
              <span className={styles.icon}>👤</span>
              <input
                id="name"
                placeholder="Nguyễn Văn A"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
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
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Mật khẩu</label>
            <div className={styles.inputWrap}>
              <span className={styles.icon}>🔒</span>
              <input
                type="password"
                id="password"
                placeholder="••••••••••"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <div className={styles.inputWrap}>
              <span className={styles.icon}>🔁</span>
              <input
                type="password"
                id="confirmPassword"
                placeholder="••••••••••"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          </div>

          {errorMessage ? (
            <div
              className={styles.field}
              role="alert"
              style={{ color: "#ffb4b4", fontSize: 13, marginTop: -6 }}
            >
              {errorMessage}
            </div>
          ) : null}

          <div className={styles.optionsRow}>
            <label className={styles.remember}>
              <input
                type="checkbox"
                className={styles.rememberCheckbox}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span className={styles.checkmark} />
              <span className={styles.rememberText}>Ghi nhớ đăng nhập</span>
            </label>
            <a href="/admin/login" className={styles.forgotLink} aria-label="Back to login">
              Quay lại đăng nhập
            </a>
          </div>

          <button type="submit" className={styles.btnLogin} disabled={isLoading}>
            <span className={styles.btnInner}>
              <span>{isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}</span>
              <span>{isLoading ? "⟳" : "→"}</span>
            </span>
          </button>
        </form>

        <div className={styles.formFooter}>
          <p>
            Lưu ý: Nếu hệ thống đã có admin, API sẽ từ chối đăng ký.
            <br />
            Hãy dùng tài khoản hiện có để đăng nhập.
          </p>
        </div>

        <span className={styles.verBadge}>v2.4.1 © 2026</span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
      <RegisterForm />
    </Suspense>
  );
}
