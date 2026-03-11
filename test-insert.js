
const { createClient } = require('@supabase/supabase-js');

(async () => {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    );

    // Get an appointment
    const { data: appt } = await supabase.from('appointments').select('*').limit(1).single();
    if (!appt) {
      console.log('No appointment found');
      return;
    }
    console.log('Testing Appt ID:', appt.id);

    // Call the PUT endpoint logic directly or via server
    const today = new Date().toISOString().split("T")[0];
    const { error: insertErr } = await supabase.from('visits').insert({
        patient_id: appt.patient_id,
        visit_date: today,
        visit_time: appt.appointment_time || null,
        visit_type: "appointment",
        status: "waiting",
        created_by: appt.doctor_id || null,
    });
    
    if (insertErr) {
        console.error("Insert error:", insertErr);
    } else {
        console.log("Insert success");
    }
})();
