/**
 * Auth cookie name constants.
 *
 * Extracted from auth.ts so that middleware (Edge runtime) can import
 * cookie names without pulling in node:crypto via jwt.ts.
 */

export type UserRole = "ADMIN" | "VENDOR" | "USER";

export type RoleAuthCookies = {
  access: string;
  refresh: string;
  remember: string;
};

export const AUTH_COOKIES: Record<UserRole, RoleAuthCookies> = {
  ADMIN: {
    access: "fs_admin_access_token",
    refresh: "fs_admin_refresh_token",
    remember: "fs_admin_remember_me",
  },
  VENDOR: {
    access: "fs_vendor_access_token",
    refresh: "fs_vendor_refresh_token",
    remember: "fs_vendor_remember_me",
  },
  USER: {
    access: "fs_customer_access_token",
    refresh: "fs_customer_refresh_token",
    remember: "fs_customer_remember_me",
  },
};

export const ADMIN_AUTH_COOKIES = AUTH_COOKIES.ADMIN;
export const VENDOR_AUTH_COOKIES = AUTH_COOKIES.VENDOR;
export const CUSTOMER_AUTH_COOKIES = AUTH_COOKIES.USER;
