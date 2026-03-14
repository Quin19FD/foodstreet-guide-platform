import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ACCESS_COOKIE = "fs_admin_access_token";
const ADMIN_REFRESH_COOKIE = "fs_admin_refresh_token";

const VENDOR_ACCESS_COOKIE = "fs_vendor_access_token";
const VENDOR_REFRESH_COOKIE = "fs_vendor_refresh_token";

/**
 * Middleware bảo vệ route admin/vendor.
 *
 * Luồng:
 * - Nếu vào /admin/* mà không có access_token và cũng không có refresh_token => redirect về /admin/login.
 * - Nếu vào /vendor/* mà không có access_token và cũng không có refresh_token => redirect về /vendor/login.
 *
 * Ghi chú: middleware không verify JWT (Edge runtime), chỉ check sự tồn tại cookie.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public auth pages
  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname === "/vendor/login" || pathname === "/vendor/register") return NextResponse.next();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const access = request.cookies.get(ADMIN_ACCESS_COOKIE)?.value;
    const refresh = request.cookies.get(ADMIN_REFRESH_COOKIE)?.value;

    if (access || refresh) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/vendor" || pathname.startsWith("/vendor/")) {
    const access = request.cookies.get(VENDOR_ACCESS_COOKIE)?.value;
    const refresh = request.cookies.get(VENDOR_REFRESH_COOKIE)?.value;

    if (access || refresh) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = "/vendor/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*"],
};
