/* eslint-disable @typescript-eslint/no-unused-vars */
// API Request and Response types : /types/api.ts

import type {
  Profile,
  Patient,
  PatientClinicalProfile,
  Visit,
  VisitPrescription,
  CatalogueService,
  CatalogueMedicine,
  PatientTreatment,
  TreatmentSession,
  Bill,
  Payment,
  Appointment,
  AuditLog,
  ClinicSettings,
  UserRole,
  VisitStatus,
  PaymentStatus,
  AppointmentStatus,
  TreatmentStatus,
} from "./database";

// ============== Standard API Response ==============

export interface ApiResponse<T = null> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
  };
}

// ============== Auth Types ==============

export interface SessionResponse {
  userId: string;
  role: UserRole;
  fullName: string;
  email: string;
  signatureUrl: string | null;
}

// ============== Patient Types ==============

export interface CreatePatientRequest {
  full_name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: "male" | "female" | "other";
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  patient_type?: "new" | "returning" | "followup";
  referred_by?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface UpdatePatientRequest {
  full_name?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  patient_type?: "new" | "returning" | "followup";
  referred_by?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface PatientListResponse {
  id: string;
  uhid: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string | null;
  city: string | null;
  patient_type: string;
  is_active: boolean;
  created_at: string;
}

// Internal type for inserting patient into database
export interface PatientCreateInput {
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  patient_type: "new" | "returning" | "followup";
  referred_by?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  uhid: string;
  created_by: string;
}

// ============== Clinical Profile Types ==============

export interface ClinicalProfileRequest {
  prakriti?: string[];
  vikriti?: string[];
  dosha_analysis?: Record<string, unknown>;
  nadi_pariksha?: string;
  chronic_diseases?: string[];
  known_allergies?: string[];
  lifestyle_notes?: string;
  diet_recommendations?: string;
}

// ============== Visit Types ==============

export interface CreateVisitRequest {
  patient_id: string;
  visit_date?: string; // YYYY-MM-DD, defaults to today
  visit_time?: string; // HH:MM
  visit_type?: "walkin" | "appointment";
  chief_complaint?: string;
  current_symptoms?: string;
}

export interface UpdateVisitRequest {
  chief_complaint?: string;
  current_symptoms?: string;
  doctor_notes?: string;
  internal_notes?: string;
  status?: VisitStatus;
}

export interface VisitListResponse extends Visit {
  patients: {
    full_name: string;
    uhid: string;
  } | null;
}

// ============== Prescription Types ==============

export interface MedicineItemRequest {
  medicine_id?: string | null;
  name: string;
  type?: "ayurvedic" | "general";
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface PrescriptionRequest {
  medicines: MedicineItemRequest[];
  treatment_notes?: string;
  diet_advice?: string;
  lifestyle_advice?: string;
  follow_up_notes?: string;
}

// ============== Catalogue Types ==============

export interface CreateServiceRequest {
  name: string;
  description?: string;
  category?: string;
  duration_type?: "single" | "package";
  package_days?: number;
  base_price: number;
  gst_applicable?: boolean;
  gst_rate?: number;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  category?: string;
  duration_type?: "single" | "package";
  package_days?: number;
  base_price?: number;
  gst_applicable?: boolean;
  gst_rate?: number;
  is_active?: boolean;
}

export interface CreateMedicineRequest {
  name: string;
  type?: "ayurvedic" | "general";
  form?: string;
  unit?: string;
  price_per_unit?: number;
  gst_applicable?: boolean;
  gst_rate?: number;
}

export interface UpdateMedicineRequest {
  name?: string;
  type?: "ayurvedic" | "general";
  form?: string;
  unit?: string;
  price_per_unit?: number;
  gst_applicable?: boolean;
  gst_rate?: number;
  is_active?: boolean;
}

// ============== Treatment Types ==============

export interface CreateTreatmentRequest {
  patient_id: string;
  visit_id?: string;
  service_id?: string;
  service_name: string;
  package_days?: number;
  sessions_total: number;
  start_date?: string;
  notes?: string;
}

export interface UpdateTreatmentRequest {
  status?: TreatmentStatus;
  notes?: string;
  end_date?: string;
}

export interface MarkSessionRequest {
  notes?: string;
}

// ============== Bill Types ==============

export interface BillItemInput {
  item_id: string;
  item_type: "service" | "medicine";
  name: string;
  quantity: number;
  unit_price: number;
  gst_applicable: boolean;
  gst_rate: number;
}

export interface CreateBillRequest {
  patient_id: string;
  visit_id?: string;
  bill_date?: string;
  items: BillItemInput[];
  discount_type?: "flat" | "percentage" | "none";
  discount_value?: number;
  notes?: string;
  initial_payments?: {
    amount: number;
    payment_mode: "cash" | "upi" | "card" | "netbanking" | "cheque";
    reference_number?: string;
  }[];
}

export interface UpdateBillRequest {
  items?: BillItemInput[];
  discount_type?: "flat" | "percentage" | "none";
  discount_value?: number;
  notes?: string;
}

export interface BillWithDetails extends Bill {
  patients: {
    id: string;
    full_name: string;
    uhid: string;
    phone: string;
    email: string | null;
    address: string | null;
  } | null;
  payments: Payment[];
}

// ============== Payment Types ==============

export interface AddPaymentRequest {
  bill_id: string;
  amount: number;
  payment_mode: "cash" | "upi" | "card" | "netbanking" | "cheque";
  reference_number?: string;
  payment_type?: "payment" | "advance" | "refund";
  notes?: string;
}

// ============== Queue Types ==============

export interface QueueItem {
  id: string;
  token: number;
  visit_type: string;
  visit_time: string | null;
  chief_complaint: string | null;
  status: VisitStatus;
  created_at: string;
  patients: {
    id: string;
    full_name: string;
    uhid: string;
    date_of_birth: string;
    gender: string;
    patient_type: string;
  };
}

export interface UpdateQueueStatusRequest {
  status: VisitStatus;
}

// ============== Appointment Types ==============

export interface CreateAppointmentRequest {
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  appointment_date?: string;
  appointment_time?: string;
  duration_minutes?: number;
  status?: AppointmentStatus;
  notes?: string;
}

// ============== Report Types ==============

export interface RevenueReportItem {
  date: string;
  total_billed: number;
  total_collected: number;
  total_due: number;
  bill_count: number;
}

export interface PatientReportItem {
  month: string;
  new_patients: number;
  returning_patients: number;
  followup_patients: number;
}

export interface TreatmentReportItem {
  service_name: string;
  active_count: number;
  completed_count: number;
  total_sessions: number;
  consumed_sessions: number;
}

export interface DueReportItem {
  bill_id: string;
  bill_number: string;
  bill_date: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  days_overdue: number;
}

// ============== Audit Types ==============

export interface AuditLogWithUser extends AuditLog {
  profiles: {
    full_name: string;
    role: UserRole;
  } | null;
}

// ============== Settings Types ==============

export interface UpdateSettingsRequest {
  clinic_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  logo_url?: string;
  default_gst_rate?: number;
  max_frontdesk_discount?: number;
  bill_prefix?: string;
  financial_year_start_month?: number;
}

// ============== Error Codes ==============

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
