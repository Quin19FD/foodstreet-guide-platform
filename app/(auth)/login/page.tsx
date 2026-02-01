/**
 * Login Page
 *
 * User authentication page.
 */

import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">FoodStreet Guide</h1>
          <p className="text-muted-foreground mt-2">Đăng nhập vào tài khoản của bạn</p>
        </div>

        <form className="space-y-6 bg-card p-6 rounded-lg border">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90"
          >
            Đăng nhập
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Đăng ký
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
