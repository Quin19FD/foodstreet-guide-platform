import { z } from "zod";

const languageCodeSchema = z
  .string()
  .trim()
  .min(2, "Mã ngôn ngữ không hợp lệ")
  .max(10, "Mã ngôn ngữ không hợp lệ")
  .transform((value) => value.toLowerCase());

const imageCreateSchema = z.object({
  imageUrl: z.string().trim().url("Image URL không hợp lệ"),
  description: z.string().trim().max(500).optional(),
});

const imageUpdateSchema = z.object({
  id: z.string().uuid("Image id không hợp lệ"),
  imageUrl: z.string().trim().url("Image URL không hợp lệ").optional(),
  description: z.string().trim().max(500).optional().nullable(),
});

const menuItemCreateSchema = z.object({
  name: z.string().trim().min(1, "Tên món không được để trống").max(255),
  description: z.string().trim().max(2000).optional(),
  price: z.number().int().nonnegative().optional(),
  imageUrl: z.string().trim().url("Image URL không hợp lệ").optional(),
  isAvailable: z.boolean().optional(),
});

const menuItemUpdateSchema = z.object({
  id: z.string().uuid("MenuItem id không hợp lệ"),
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  price: z.number().int().nonnegative().optional().nullable(),
  imageUrl: z.string().trim().url("Image URL không hợp lệ").optional().nullable(),
  isAvailable: z.boolean().optional(),
});

/** Schema for PATCH /api/vendor/menu-items/:id — no id field (comes from URL). */
export const menuItemPatchSchema = menuItemUpdateSchema.omit({ id: true });

const translationCreateSchema = z.object({
  language: languageCodeSchema,
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().min(1).max(10000).optional(),
  audioScript: z.string().trim().min(1).max(10000).optional(),
});

const translationUpdateSchema = z.object({
  id: z.string().uuid("Translation id không hợp lệ"),
  name: z.string().trim().min(1).max(255).optional().nullable(),
  description: z.string().trim().min(1).max(10000).optional().nullable(),
  audioScript: z.string().trim().min(1).max(10000).optional().nullable(),
});

const audioCreateSchema = z.object({
  translationId: z.string().uuid("translationId không hợp lệ"),
  audioUrl: z.string().trim().url("Audio URL không hợp lệ"),
  isActive: z.boolean().optional(),
});

const audioUpdateSchema = z.object({
  id: z.string().uuid("Audio id không hợp lệ"),
  audioUrl: z.string().trim().url("Audio URL không hợp lệ").optional(),
  isActive: z.boolean().optional(),
});

export const vendorCreatePoiSchema = z.object({
  name: z.string().trim().min(1, "Tên POI không được để trống").max(255),
  slug: z.string().trim().min(1).max(255).optional(),
  category: z.string().trim().min(1).max(50).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  priceMin: z.number().int().nonnegative().optional().nullable(),
  priceMax: z.number().int().nonnegative().optional().nullable(),
  images: z.array(imageCreateSchema).optional(),
  menuItems: z.array(menuItemCreateSchema).optional(),
  viTranslation: z
    .object({
      name: z.string().trim().min(1).max(255).optional(),
      description: z.string().trim().min(1).max(10000),
      audioScript: z.string().trim().min(1).max(10000).optional(),
    })
    .strict(),
});

export const vendorUpdatePoiSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  slug: z.string().trim().min(1).max(255).optional().nullable(),
  category: z.string().trim().min(1).max(50).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  priceMin: z.number().int().nonnegative().optional().nullable(),
  priceMax: z.number().int().nonnegative().optional().nullable(),
  images: z
    .object({
      create: z.array(imageCreateSchema).optional(),
      update: z.array(imageUpdateSchema).optional(),
      deleteIds: z.array(z.string().uuid()).optional(),
    })
    .optional(),
  menuItems: z
    .object({
      create: z.array(menuItemCreateSchema).optional(),
      update: z.array(menuItemUpdateSchema).optional(),
      deleteIds: z.array(z.string().uuid()).optional(),
    })
    .optional(),
  translations: z
    .object({
      create: z.array(translationCreateSchema).optional(),
      update: z.array(translationUpdateSchema).optional(),
      deleteIds: z.array(z.string().uuid()).optional(),
    })
    .optional(),
  audios: z
    .object({
      create: z.array(audioCreateSchema).optional(),
      update: z.array(audioUpdateSchema).optional(),
      deleteIds: z.array(z.string().uuid()).optional(),
    })
    .optional(),
});

export const vendorResubmitPoiSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});

export const adminPoiDecisionSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    rejectionReason: z.string().trim().min(1, "Vui lòng nhập lý do từ chối").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === "REJECT" && !value.rejectionReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectionReason"],
        message: "Vui lòng nhập lý do từ chối",
      });
    }
  });

export type VendorCreatePoiInput = z.infer<typeof vendorCreatePoiSchema>;
export type VendorUpdatePoiInput = z.infer<typeof vendorUpdatePoiSchema>;
export type VendorResubmitPoiInput = z.infer<typeof vendorResubmitPoiSchema>;
export type AdminPoiDecisionInput = z.infer<typeof adminPoiDecisionSchema>;
