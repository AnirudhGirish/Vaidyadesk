import { createServiceClient } from "@/lib/supabase/server";

export async function generateUHID(): Promise<string> {
  const db = createServiceClient();
  const { data, error } = await db.rpc("generate_next_uhid");
  if (error || !data)
    throw new Error(`Failed to generate UHID: ${error?.message}`);
  return data as string;
}
