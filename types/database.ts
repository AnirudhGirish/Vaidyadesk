// Database types matching the Supabase schema
// Generated from existing schema in project: llawzcwijpeexwhxktgp

// ============== Enums ==============

export type UserRole = "doctor" | "frontdesk";
export type Gender = "male" | "female" | "other";
export type PatientType = "new" | "returning" | "followup";
export type VisitType = "walkin" | "appointment";
export type VisitStatus = "waiting" | "with_doctor" | "completed" | "cancelled";
export type DurationType = "single" | "package";
export type MedicineType = "ayurvedic" | "general";
export type TreatmentStatus = "active" | "completed" | "cancelled" | "paused";
export type PaymentStatus = "paid" | "partial" | "due" | "advance";
export type PaymentMode = "cash" | "upi" | "card" | "netbanking" | "cheque";
export type PaymentType = "payment" | "advance" | "refund";
export type DiscountType = "flat" | "percentage" | "none";
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "arrived"
  | "completed"
  | "cancelled"
  | "no_show";
export type AuditAction = "create" | "update" | "delete";

// ============== Tables ==============

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url: string | null;
  signature_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  uhid: string;
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  patient_type: PatientType;
  referred_by: string | null;
  blood_group: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientClinicalProfile {
  id: string;
  patient_id: string;
  prakriti: string[];
  vikriti: string[];
  dosha_analysis: Record<string, unknown> | null;
  nadi_pariksha: string | null;
  chronic_diseases: string[];
  known_allergies: string[];
  lifestyle_notes: string | null;
  diet_recommendations: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  visit_date: string;
  visit_time: string | null;
  visit_type: VisitType;
  chief_complaint: string | null;
  current_symptoms: string | null;
  doctor_notes: string | null;
  internal_notes: string | null;
  status: VisitStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicineItem {
  medicine_id: string | null;
  name: string;
  type: MedicineType;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

export interface VisitPrescription {
  id: string;
  visit_id: string;
  patient_id: string;
  medicines: MedicineItem[];
  treatment_notes: string | null;
  diet_advice: string | null;
  lifestyle_advice: string | null;
  follow_up_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogueService {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_type: DurationType;
  package_days: number | null;
  base_price: number;
  gst_applicable: boolean;
  gst_rate: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogueMedicine {
  id: string;
  name: string;
  type: MedicineType;
  form: string | null;
  unit: string | null;
  price_per_unit: number | null;
  gst_applicable: boolean;
  gst_rate: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientTreatment {
  id: string;
  patient_id: string;
  visit_id: string | null;
  service_id: string | null;
  service_name: string;
  package_days: number | null;
  sessions_total: number;
  sessions_consumed: number;
  start_date: string;
  end_date: string | null;
  status: TreatmentStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreatmentSession {
  id: string;
  patient_treatment_id: string;
  patient_id: string;
  session_number: number;
  session_date: string;
  session_time: string | null;
  marked_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface BillItem {
  item_id: string;
  item_type: "service" | "medicine";
  name: string;
  quantity: number;
  unit_price: number;
  gst_applicable: boolean;
  gst_rate: number;
  gst_amount: number;
  line_total: number;
}

export interface GstBreakdown {
  rate: number;
  taxable_amount: number;
  gst_amount: number;
}

export interface Bill {
  id: string;
  bill_number: string;
  patient_id: string;
  visit_id: string | null;
  bill_date: string;
  bill_items: BillItem[];
  subtotal: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  gst_breakdown: GstBreakdown | null;
  total_amount: number;
  payment_status: PaymentStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  bill_id: string;
  patient_id: string;
  payment_date: string;
  amount: number;
  payment_mode: PaymentMode;
  reference_number: string | null;
  payment_type: PaymentType;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: AuditAction;
  changed_by: string | null;
  changed_by_role: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface ClinicSettings {
  id: string;
  clinic_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  logo_url: string | null;
  default_gst_rate: number;
  max_frontdesk_discount: number;
  bill_prefix: string;
  financial_year_start_month: number;
  updated_at: string;
  updated_by: string | null;
}

// NEW: Bill number sequences table for internal bill number generation
export interface BillNumberSequence {
  financial_year: string;
  last_number: number;
}

// ============== Database Schema Type ==============

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      patients: {
        Row: Patient;
        Insert: Omit<Patient, "id" | "uhid" | "created_at" | "updated_at">;
        Update: Partial<Omit<Patient, "id" | "created_at" | "updated_at">>;
      };
      patient_clinical_profile: {
        Row: PatientClinicalProfile;
        Insert: Omit<
          PatientClinicalProfile,
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Omit<
            PatientClinicalProfile,
            "id" | "patient_id" | "created_at" | "updated_at"
          >
        >;
      };
      visits: {
        Row: Visit;
        Insert: Omit<Visit, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Visit, "id" | "created_at" | "updated_at">>;
      };
      visit_prescriptions: {
        Row: VisitPrescription;
        Insert: Omit<VisitPrescription, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<
            VisitPrescription,
            "id" | "visit_id" | "patient_id" | "created_at" | "updated_at"
          >
        >;
      };
      catalogue_services: {
        Row: CatalogueService;
        Insert: Omit<CatalogueService, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<CatalogueService, "id" | "created_at" | "updated_at">
        >;
      };
      catalogue_medicines: {
        Row: CatalogueMedicine;
        Insert: Omit<CatalogueMedicine, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<CatalogueMedicine, "id" | "created_at" | "updated_at">
        >;
      };
      patient_treatments: {
        Row: PatientTreatment;
        Insert: Omit<PatientTreatment, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<PatientTreatment, "id" | "created_at" | "updated_at">
        >;
      };
      treatment_sessions: {
        Row: TreatmentSession;
        Insert: Omit<TreatmentSession, "id" | "created_at">;
        Update: Partial<Omit<TreatmentSession, "id" | "created_at">>;
      };
      bills: {
        Row: Bill;
        Insert: Omit<Bill, "id" | "bill_number" | "created_at" | "updated_at">;
        Update: Partial<Omit<Bill, "id" | "created_at" | "updated_at">>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at">;
        Update: Partial<Omit<Payment, "id" | "created_at">>;
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<Appointment, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Appointment, "id" | "created_at" | "updated_at">>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: Partial<Omit<AuditLog, "id" | "created_at">>;
      };
      clinic_settings: {
        Row: ClinicSettings;
        Insert: Omit<ClinicSettings, "id" | "updated_at">;
        Update: Partial<Omit<ClinicSettings, "id" | "updated_at">>;
      };
      bill_number_sequences: {
        Row: BillNumberSequence;
        Insert: BillNumberSequence;
        Update: Partial<Omit<BillNumberSequence, "financial_year">>;
      };
    };
  };
}

// ============== Join Types for API Responses ==============

export interface VisitWithPatient extends Visit {
  patients: {
    full_name: string;
    uhid: string;
    date_of_birth: string;
    gender: Gender;
    patient_type: PatientType;
  } | null;
}

export interface BillWithPatient extends Bill {
  patients: {
    id: string;
    full_name: string;
    uhid: string;
    phone: string;
  } | null;
}

export interface PaymentWithBill extends Payment {
  bills: {
    bill_number: string;
    total_amount: number;
    payment_status: PaymentStatus;
  } | null;
}

export interface TreatmentWithPatient extends PatientTreatment {
  patients: {
    full_name: string;
    uhid: string;
  } | null;
}

export interface AppointmentWithPatient extends Appointment {
  patients: {
    full_name: string;
    uhid: string;
    phone: string;
  } | null;
}

export interface AuditLogWithProfile extends AuditLog {
  profiles: {
    full_name: string;
    role: UserRole;
  } | null;
}
