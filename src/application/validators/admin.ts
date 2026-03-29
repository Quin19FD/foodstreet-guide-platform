import { z } from "zod";

export const adminUsersPatchSchema = z
  .object({
    ids: z
      .array(z.string().uuid("User ID không hợp lệ"))
      .min(1, "Vui lòng chọn ít nhất một user"),
    action: z.enum(["activate", "deactivate", "approve", "reject"], {
      message: "Hành động không hợp lệ",
    }),
    rejectionReason: z.string().trim().min(1, "Vui lòng nhập lý do từ chối").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "reject" && !value.rejectionReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectionReason"],
        message: "Vui lòng nhập lý do từ chối",
      });
    }
  });

export const adminUsersDeleteSchema = z.object({
  ids: z
    .array(z.string().uuid("User ID không hợp lệ"))
    .min(1, "Vui lòng chọn ít nhất một user"),
});

export type AdminUsersPatchInput = z.infer<typeof adminUsersPatchSchema>;
export type AdminUsersDeleteInput = z.infer<typeof adminUsersDeleteSchema>;
