import { z } from "zod";

/**
 * Patient Validation Schemas
 */

// Indian mobile phone validation (starts with 6-9, followed by 9 digits)
const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, {
  message: "Invalid phone number. Must be 10 digits starting with 6-9",
});

// Date validation (YYYY-MM-DD)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Invalid date format. Use YYYY-MM-DD",
});

// Create Patient Schema
export const createPatientSchema = z.object({
  full_name: z.string().min(2).max(100),
  date_of_birth: dateSchema.refine((val) => new Date(val) < new Date()),
  gender: z.enum(["male", "female", "other"]),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  patient_type: z.enum(["new", "returning", "followup"]).default("new"),
  referred_by: z.string().optional(),
  blood_group: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: phoneSchema.optional(),
});

// Update Patient Schema
export const updatePatientSchema = z
  .object({
    full_name: z.string().min(2).max(100).optional(),
    date_of_birth: dateSchema
      .refine((val) => new Date(val) < new Date())
      .optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    phone: phoneSchema.optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    patient_type: z.enum(["new", "returning", "followup"]).optional(),
    referred_by: z.string().optional(),
    blood_group: z.string().optional(),
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: phoneSchema.optional(),
  })
  .strict();

// Clinical Profile Schema (Doctor only)
export const clinicalProfileSchema = z.object({
  prakriti: z.array(z.string()).optional(),
  vikriti: z.array(z.string()).optional(),
  dosha_analysis: z.record(z.string(), z.unknown()).optional(),
  nadi_pariksha: z.string().optional(),
  chronic_diseases: z.array(z.string()).optional(),
  known_allergies: z.array(z.string()).optional(),
  lifestyle_notes: z.string().optional(),
  diet_recommendations: z.string().optional(),
});
