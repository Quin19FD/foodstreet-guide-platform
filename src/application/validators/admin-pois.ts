import { z } from "zod";

export const poiDecisionSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"], {
      errorMap: () => ({
        message: "Trạng thái phải là APPROVED hoặc REJECTED",
      }),
    }),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "REJECTED" && !data.rejectionReason?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: "Vui lòng nhập lý do từ chối",
      path: ["rejectionReason"],
    },
  );
