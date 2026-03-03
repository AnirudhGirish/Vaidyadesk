import { z } from "zod";

// Update settings schema
export const updateSettingsSchema = z.object({
  clinic_name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gst_number: z.string().optional(),
  logo_url: z.string().optional(),
  default_gst_rate: z.number().min(0).max(28).optional(),
  max_frontdesk_discount: z.number().min(0).max(100).optional(),
  bill_prefix: z.string().min(1).optional(),
  financial_year_start_month: z.number().min(1).max(12).optional(),
});

// Signature upload schema
export const signatureUploadSchema = z.object({
  signature_data: z.string().min(1),
  file_name: z.string().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type SignatureUploadInput = z.infer<typeof signatureUploadSchema>;
