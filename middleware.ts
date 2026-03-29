import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_AUTH_COOKIES, VENDOR_AUTH_COOKIES } from "@/infrastructure/security/auth-cookies";

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
  if (pathname === "/admin/register") return NextResponse.next();
  if (pathname === "/admin/forgot-password") return NextResponse.next();
  if (pathname === "/vendor/login" || pathname === "/vendor/register") return NextResponse.next();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const access = request.cookies.get(ADMIN_AUTH_COOKIES.access)?.value;
    const refresh = request.cookies.get(ADMIN_AUTH_COOKIES.refresh)?.value;

    if (access || refresh) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/vendor" || pathname.startsWith("/vendor/")) {
    const access = request.cookies.get(VENDOR_AUTH_COOKIES.access)?.value;
    const refresh = request.cookies.get(VENDOR_AUTH_COOKIES.refresh)?.value;

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
