import { z } from "zod";

const optionalStringSchema = z.string().trim().min(1).optional();

const poiIdsSchema = z
  .array(z.string().uuid("POI ID không hợp lệ"))
  .min(1, "Tour phải có ít nhất 1 điểm dừng");

export const adminCreateTourSchema = z.object({
  name: z.string().trim().min(1, "Tên tour không được để trống").max(255),
  description: optionalStringSchema,
  imageUrl: z.string().trim().url("Image URL không hợp lệ").optional(),
  durationMinutes: z.number().int().positive("Thời lượng phải lớn hơn 0").max(1440).optional(),
  poiIds: poiIdsSchema,
});

export const adminUpdateTourSchema = z.object({
  name: z.string().trim().min(1, "Tên tour không được để trống").max(255).optional(),
  description: optionalStringSchema.nullable(),
  imageUrl: z.string().trim().url("Image URL không hợp lệ").optional().nullable(),
  durationMinutes: z
    .number()
    .int()
    .positive("Thời lượng phải lớn hơn 0")
    .max(1440)
    .optional()
    .nullable(),
  poiIds: poiIdsSchema.optional(),
  isActive: z.boolean().optional(),
});

export type AdminCreateTourInput = z.infer<typeof adminCreateTourSchema>;
export type AdminUpdateTourInput = z.infer<typeof adminUpdateTourSchema>;
