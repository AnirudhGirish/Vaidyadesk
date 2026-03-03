import { z } from "zod";

// Add payment schema
export const addPaymentSchema = z.object({
  bill_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_mode: z.enum(["cash", "upi", "card", "netbanking", "cheque"]),
  reference_number: z.string().optional(),
  payment_type: z.enum(["payment", "advance", "refund"]).default("payment"),
  notes: z.string().optional(),
});

export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
