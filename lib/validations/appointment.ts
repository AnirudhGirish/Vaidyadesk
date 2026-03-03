import { z } from "zod";

// Create appointment schema
export const createAppointmentSchema = z.object({
  patient_id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration_minutes: z.number().int().positive().default(30),
  notes: z.string().optional(),
});

// Update appointment schema
export const updateAppointmentSchema = z.object({
  appointment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  appointment_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  duration_minutes: z.number().int().positive().optional(),
  status: z
    .enum([
      "scheduled",
      "confirmed",
      "arrived",
      "completed",
      "cancelled",
      "no_show",
    ])
    .optional(),
  notes: z.string().optional(),
});

// Add to queue schema
export const addToQueueSchema = z.object({
  patient_id: z.string().uuid(),
  visit_type: z.enum(["walkin", "appointment"]).default("walkin"),
  visit_time: z.string().optional(),
  chief_complaint: z.string().optional(),
});

// Queue status update schema
export const updateQueueStatusSchema = z.object({
  status: z.enum([
    "waiting",
    "arrived",
    "with_doctor",
    "completed",
    "cancelled",
  ]),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AddToQueueInput = z.infer<typeof addToQueueSchema>;
export type UpdateQueueStatusInput = z.infer<typeof updateQueueStatusSchema>;
