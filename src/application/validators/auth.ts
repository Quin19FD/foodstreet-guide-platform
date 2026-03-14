/**
 * Zod schemas cho Authentication.
 */

import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().trim().min(1, "Email không được để trống").email("Email không đúng định dạng"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
  rememberMe: z.boolean().optional(),
});

export type LoginRequestInput = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  email: z.string().trim().min(1, "Email không được để trống").email("Email không đúng định dạng"),
  name: z.string().trim().min(1, "Tên không được để trống"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  phoneNumber: z.string().trim().min(1).optional(),
  avatarUrl: z.string().trim().url("Avatar URL không hợp lệ").optional(),
  rememberMe: z.boolean().optional(),
});

export type RegisterRequestInput = z.infer<typeof registerRequestSchema>;
