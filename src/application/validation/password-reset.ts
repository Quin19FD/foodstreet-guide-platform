import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống")
    .email("Email không đúng định dạng")
    .transform((value) => value.toLowerCase()),
});

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống")
    .email("Email không đúng định dạng")
    .transform((value) => value.toLowerCase()),
  otp: z.string().trim().regex(/^\d{6}$/, "OTP phải gồm 6 chữ số"),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống")
    .email("Email không đúng định dạng")
    .transform((value) => value.toLowerCase()),
  otp: z.string().trim().regex(/^\d{6}$/, "OTP phải gồm 6 chữ số"),
  newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
});
