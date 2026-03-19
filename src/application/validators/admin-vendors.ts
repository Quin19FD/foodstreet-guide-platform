/**
 * Zod schemas cho Admin Vendor Management.
 */

import { z } from "zod";

export const vendorCreateSchema = z.object({
  email: z.string().trim().min(1, "Email không được để trống").email("Email không đúng định dạng"),
  name: z.string().trim().min(1, "Tên không được để trống"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  phoneNumber: z.string().trim().min(1).optional(),
  avatarUrl: z.string().trim().url("Avatar URL không hợp lệ").optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  rejectionReason: z.string().trim().min(1, "Lý do từ chối không được để trống").optional(),
});

export type VendorCreateInput = z.infer<typeof vendorCreateSchema>;

export const vendorUpdateSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống")
    .email("Email không đúng định dạng")
    .optional(),
  name: z.string().trim().min(1, "Tên không được để trống").optional(),
  phoneNumber: z.string().trim().min(1).optional().nullable(),
  avatarUrl: z.string().trim().url("Avatar URL không hợp lệ").optional().nullable(),
  isActive: z.boolean().optional(),
});

export type VendorUpdateInput = z.infer<typeof vendorUpdateSchema>;

export const vendorDecisionSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    rejectionReason: z.string().trim().min(1, "Lý do từ chối không được để trống").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "REJECTED" && !value.rejectionReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectionReason"],
        message: "Vui lòng nhập lý do từ chối",
      });
    }
  });

export type VendorDecisionInput = z.infer<typeof vendorDecisionSchema>;
