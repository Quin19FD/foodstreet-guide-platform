import { z } from "zod";

export const poiCreateSchema = z.object({
  name: z.string().min(1, "Tên POI không được để trống").max(255),
  slug: z.string().optional(),
  category: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
});

export const poiUpdateSchema = z
  .object({
    name: z.string().min(1, "Tên POI không được để trống").max(255).optional(),
    slug: z.string().optional(),
    category: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    priceMin: z.number().int().min(0).optional(),
    priceMax: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.priceMin !== undefined && data.priceMax !== undefined) {
        return data.priceMin <= data.priceMax;
      }
      return true;
    },
    {
      message: "Giá tối thiểu không được lớn hơn giá tối đa",
      path: ["priceMin"],
    },
  );
