import { z } from "zod";

// Create Visit Schema
export const createVisitSchema = z.object({
  patient_id: z.string().uuid("Invalid patient ID"),
  visit_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  visit_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .optional(),
  visit_type: z.enum(["walkin", "appointment"]).default("walkin"),
  chief_complaint: z.string().max(500).optional(),
  current_symptoms: z.string().max(1000).optional(),
});

// Update Visit Schema
export const updateVisitSchema = z
  .object({
    chief_complaint: z.string().max(500).optional(),
    current_symptoms: z.string().max(1000).optional(),
    doctor_notes: z.string().max(2000).optional(),
    internal_notes: z.string().max(1000).optional(),
    status: z
      .enum(["waiting", "with_doctor", "completed", "cancelled"])
      .optional(),
  })
  .strict();

// Prescription Medicine Item Schema
export const medicineItemSchema = z.object({
  medicine_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, "Medicine name is required"),
  type: z.enum(["ayurvedic", "general"]).optional(),
  dosage: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
  duration: z.string().max(100).optional(),
  instructions: z.string().max(500).optional(),
});

// Prescription Schema
export const prescriptionSchema = z.object({
  medicines: z.array(medicineItemSchema).default([]),
  treatment_notes: z.string().max(2000).optional(),
  diet_advice: z.string().max(1000).optional(),
  lifestyle_advice: z.string().max(1000).optional(),
  follow_up_notes: z.string().max(500).optional(),
});
