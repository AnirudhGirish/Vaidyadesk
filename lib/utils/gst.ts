import type { BillItemInput } from "@/types/api";

/**
 * Calculated Bill Item
 * Includes line totals and GST amounts
 */
export type CalculatedBillItem = BillItemInput & {
  line_subtotal: number;
  gst_amount: number;
  line_total: number;
};

/**
 * Bill Totals
 * Final calculated amounts for a bill
 */
export type BillTotals = {
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  gst_amount: number;
  total_amount: number;
};

/**
 * GST Breakdown by rate
 */
export type GstBreakdown = {
  rate: number;
  taxable_amount: number;
  gst_amount: number;
};

/**
 * Round to 2 decimal places
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate bill items with GST
 *
 * For each item, calculates:
 * - line_subtotal = quantity * unit_price
 * - gst_amount = line_subtotal * (gst_rate / 100) if gst_applicable
 * - line_total = line_subtotal + gst_amount
 */
export function calculateBillItems(
  items: BillItemInput[],
): CalculatedBillItem[] {
  return items.map((item) => {
    const line_subtotal = round(item.quantity * item.unit_price);
    const gst_amount = item.gst_applicable
      ? round(line_subtotal * (item.gst_rate / 100))
      : 0;
    return {
      ...item,
      line_subtotal,
      gst_amount,
      line_total: round(line_subtotal + gst_amount),
    };
  });
}

/**
 * Calculate bill totals
 *
 * Computes:
 * - subtotal: sum of all line_subtotals
 * - discount_amount: based on discount type (flat or percentage)
 * - taxable_amount: subtotal - discount
 * - gst_amount: GST on discounted amount (proportionally distributed)
 * - total_amount: taxable_amount + gst_amount
 */
export function calculateBillTotals(
  items: CalculatedBillItem[],
  discountType: "flat" | "percentage" | "none",
  discountValue: number,
): BillTotals {
  const subtotal = items.reduce((sum, i) => sum + i.line_subtotal, 0);

  // Calculate discount amount
  let discount_amount = 0;
  if (discountType === "flat") {
    discount_amount = Math.min(discountValue, subtotal);
  } else if (discountType === "percentage") {
    discount_amount = round(subtotal * (discountValue / 100));
  }

  const taxable_amount = round(subtotal - discount_amount);

  // Calculate GST on discounted amount proportionally
  // Each item's GST is reduced proportionally based on its share of the subtotal
  const gst_amount = items.reduce((sum, item) => {
    if (!item.gst_applicable) return sum;
    if (subtotal === 0) return sum;
    const itemShare = item.line_subtotal / subtotal;
    const itemDiscounted = item.line_subtotal - discount_amount * itemShare;
    return sum + round(itemDiscounted * (item.gst_rate / 100));
  }, 0);

  const total_amount = round(taxable_amount + gst_amount);

  return {
    subtotal: round(subtotal),
    discount_amount: round(discount_amount),
    taxable_amount: round(taxable_amount),
    gst_amount: round(gst_amount),
    total_amount,
  };
}

/**
 * Calculate GST breakdown by rate
 * Groups items by GST rate and calculates totals for each rate
 */
export function calculateGstBreakdown(
  items: CalculatedBillItem[],
  discountAmount: number,
): GstBreakdown[] {
  const subtotal = items.reduce((sum, i) => sum + i.line_subtotal, 0);

  // Group items by GST rate
  const rateGroups = new Map<number, { taxable: number; gst: number }>();

  items.forEach((item) => {
    if (!item.gst_applicable) return;

    const existing = rateGroups.get(item.gst_rate) || { taxable: 0, gst: 0 };
    const itemShare = item.line_subtotal / subtotal;
    const itemDiscounted = item.line_subtotal - discountAmount * itemShare;

    rateGroups.set(item.gst_rate, {
      taxable: existing.taxable + itemDiscounted,
      gst: existing.gst + round(itemDiscounted * (item.gst_rate / 100)),
    });
  });

  return Array.from(rateGroups.entries()).map(([rate, values]) => ({
    rate,
    taxable_amount: round(values.taxable),
    gst_amount: round(values.gst),
  }));
}

/**
 * Determine payment status based on paid amount vs total
 */
export function determinePaymentStatus(
  totalAmount: number,
  paidAmount: number,
): "paid" | "partial" | "due" | "advance" {
  if (paidAmount <= 0) return "due";
  if (paidAmount >= totalAmount) return "paid";
  if (paidAmount > totalAmount) return "advance";
  return "partial";
}
