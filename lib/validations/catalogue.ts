import { z } from "zod";

// Service schemas
export const createServiceSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    description: z.string().optional(),
    category: z.string().optional(),
    duration_type: z.enum(["single", "package"]).default("single"),
    package_days: z.number().int().positive().optional(),
    base_price: z.number().positive("Base price must be positive"),
    gst_applicable: z.boolean().default(false),
    gst_rate: z.number().min(0).max(28).default(18),
  })
  .refine(
    (data) => {
      if (data.duration_type === "package" && !data.package_days) {
        return false;
      }
      return true;
    },
    {
      message: "package_days is required for package type",
      path: ["package_days"],
    },
  );

export const updateServiceSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    duration_type: z.enum(["single", "package"]).optional(),
    package_days: z.number().int().positive().optional(),
    base_price: z.number().positive().optional(),
    gst_applicable: z.boolean().optional(),
    gst_rate: z.number().min(0).max(28).optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.duration_type === "package" && !data.package_days) {
        return false;
      }
      return true;
    },
    {
      message: "package_days is required for package type",
      path: ["package_days"],
    },
  );

// Medicine schemas
export const createMedicineSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["ayurvedic", "general"]).default("ayurvedic"),
  form: z.string().optional(),
  unit: z.string().optional(),
  price_per_unit: z.number().positive().optional(),
  gst_applicable: z.boolean().default(false),
  gst_rate: z.number().min(0).max(28).default(18),
});

export const updateMedicineSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["ayurvedic", "general"]).optional(),
  form: z.string().optional(),
  unit: z.string().optional(),
  price_per_unit: z.number().positive().optional(),
  gst_applicable: z.boolean().optional(),
  gst_rate: z.number().min(0).max(28).optional(),
  is_active: z.boolean().optional(),
});

// Types for use in components
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateMedicineInput = z.infer<typeof createMedicineSchema>;
export type UpdateMedicineInput = z.infer<typeof updateMedicineSchema>;
