import { createServiceClient } from "@/lib/supabase/server";

export async function autoMarkTreatmentSession(
  patientId: string,
  visitId: string,
  userId: string,
  db: ReturnType<typeof createServiceClient>,
): Promise<void> {
  const { data: treatments, error: treatmentError } = await db
    .from("patient_treatments")
    .select("id, sessions_consumed, sessions_total")
    .eq("patient_id", patientId)
    .eq("status", "active")
    .limit(1);

  if (treatmentError)
    throw new Error(`Failed to fetch treatments: ${treatmentError.message}`);
  if (!treatments?.length) return;

  const treatment = treatments[0] as {
    id: string;
    sessions_consumed: number;
    sessions_total: number;
  };
  if (treatment.sessions_consumed >= treatment.sessions_total) return;

  const today = new Date().toISOString().split("T")[0];

  const { data: existingSession } = await db
    .from("treatment_sessions")
    .select("id")
    .eq("patient_treatment_id", treatment.id)
    .eq("session_date", today)
    .maybeSingle();

  if (existingSession) return;

  const nextSessionNumber = treatment.sessions_consumed + 1;

  const { data: newSession, error: sessionInsertError } = await db
    .from("treatment_sessions")
    .insert({
      patient_treatment_id: treatment.id,
      patient_id: patientId,
      session_number: nextSessionNumber,
      session_date: today,
      marked_by: userId,
      notes: "Auto-marked on visit completion",
    } as never)
    .select("id")
    .single();

  if (sessionInsertError || !newSession) {
    throw new Error(`Failed to insert session: ${sessionInsertError?.message}`);
  }

  const { error: updateError } = await db
    .from("patient_treatments")
    .update({ sessions_consumed: nextSessionNumber } as never)
    .eq("id", treatment.id);

  if (updateError) {
    await db
      .from("treatment_sessions")
      .delete()
      .eq("id", (newSession as { id: string }).id);
    throw new Error(`Failed to update treatment count: ${updateError.message}`);
  }
}
