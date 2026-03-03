/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServiceClient } from "@/lib/supabase/server";

export async function generateBillNumber(): Promise<string> {
  const db = createServiceClient();
  const settingsResult = await db
    .from("clinic_settings")
    .select("bill_prefix")
    .single();
  const settings = settingsResult.data as { bill_prefix: string } | null;
  const prefix = settings?.bill_prefix ?? "AYU";
  const now = new Date();
  const month = now.getMonth() + 1;
  const fyStart = month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  const fyEnd = fyStart + 1;
  const financialYear = `${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`;
  const rpcResult = await (db as any).rpc("generate_next_bill_number", {
    p_prefix: prefix,
    p_financial_year: financialYear,
  });
  const data = rpcResult.data;
  const error = rpcResult.error;
  if (error || !data)
    throw new Error(`Failed to generate bill number: ${error?.message}`);
  return data as string;
}
