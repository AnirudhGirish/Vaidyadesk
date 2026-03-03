import { z } from "zod";

// Bill item input schema
export const billItemInputSchema = z.object({
  item_id: z.string().uuid(),
  item_type: z.enum(["service", "medicine"]),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  gst_applicable: z.boolean(),
  gst_rate: z.number().min(0).max(28),
});

// Initial payment schema
export const initialPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_mode: z.enum(["cash", "upi", "card", "netbanking", "cheque"]),
  reference_number: z.string().optional(),
});

// Create bill schema
export const createBillSchema = z.object({
  patient_id: z.string().uuid(),
  visit_id: z.string().uuid().optional(),
  bill_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  items: z.array(billItemInputSchema).min(1),
  discount_type: z.enum(["flat", "percentage", "none"]).default("none"),
  discount_value: z.number().min(0).default(0),
  notes: z.string().optional(),
  initial_payments: z.array(initialPaymentSchema).default([]),
});

// Update bill schema
export const updateBillSchema = z.object({
  discount_type: z.enum(["flat", "percentage", "none"]).optional(),
  discount_value: z.number().min(0).optional(),
  notes: z.string().optional(),
  payment_status: z.enum(["paid", "partial", "due", "advance"]).optional(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
