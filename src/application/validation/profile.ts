import { z } from "zod";

export const profileUpdateSchema = z
  .object({
    email: z.string().trim().email("Email không đúng định dạng").optional(),
    name: z.string().trim().min(1, "Tên không được để trống").optional(),
    phoneNumber: z.string().trim().min(1, "Số điện thoại không hợp lệ").optional().nullable(),
    avatarUrl: z.string().trim().url("Avatar URL không hợp lệ").optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (
      value.email === undefined &&
      value.name === undefined &&
      value.phoneNumber === undefined &&
      value.avatarUrl === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Không có dữ liệu để cập nhật",
      });
    }
  });

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
