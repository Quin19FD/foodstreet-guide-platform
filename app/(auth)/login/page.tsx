'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1800));

    // Demo: redirect to admin dashboard
    setIsLoading(false);
    router.push('/admin/dashboard');
  };

  return (
    <div className={styles.wrapper}>
      {/* LEFT PANEL */}
      <div className={styles.left}>
        <div className={styles.leftBg}></div>
        <div className={styles.leftOverlay}></div>

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
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i}></span>
          ))}
        </div>

        {/* Bottom content */}
        <div className={styles.leftContent}>
          <div className={styles.tagLine}>Nền tảng quản lý</div>
          <h1 className={styles.slogan}>
            Nơi hương vị<br />
            <em>trở thành</em><br />
            câu chuyện.
          </h1>
          <p className={styles.motto}>
            Kết nối thực khách với những khu phố ẩm thực sống động nhất —
            từng con phố, từng hương thơm, từng ký ức đáng nhớ.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={styles.right}>
        <div className={styles.cornerDeco}></div>
        <div className={styles.cornerDecoBl}></div>

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
                placeholder="admin@phố-ẩm-thực.vn"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="password">Mật khẩu</label>
            <div className={styles.inputWrap}>
              <span className={styles.icon}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••••"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.togglePw}
                onClick={togglePassword}
                title="Hiện/Ẩn mật khẩu"
                aria-label="Toggle password"
              >
                👁
              </button>
            </div>
          </div>

          {/* Options */}
          <div className={styles.optionsRow}>
            <label className={styles.remember}>
              <input
                type="checkbox"
                className={styles.rememberCheckbox}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className={styles.checkmark}></span>
              <span className={styles.rememberText}>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" className={styles.forgotLink}>
              Quên mật khẩu?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.btnLogin}
            disabled={isLoading}
          >
            <span className={styles.btnInner}>
              <span>{isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'}</span>
              <span>{isLoading ? '⟳' : '→'}</span>
            </span>
          </button>
        </form>

        {/* Footer */}
        <div className={styles.formFooter}>
          <p>
            Chỉ dành cho <strong>quản trị viên được uỷ quyền</strong>
            .<br />
            Mọi hoạt động được ghi lại và giám sát.
          </p>
        </div>

        <span className={styles.verBadge}>v2.4.1 © 2026</span>
      </div>
    </div>
  );
}
