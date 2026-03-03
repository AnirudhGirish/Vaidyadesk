# AyuClinic — Patient Management System

> A production-grade clinic management platform built for Dr. Shetty's Ayurvedic Clinic. Manages patients, consultations, treatments, billing, and daily operations for a two-role clinic team.

---

## Project Status

| Layer           | Status                                      |
| --------------- | ------------------------------------------- |
| Backend API     | ✅ Complete & Verified                      |
| Database Schema | ✅ Complete (Supabase)                      |
| Authentication  | ✅ Complete (Google OAuth)                  |
| Frontend UI     | 🚧 In Progress (`frontend/ui-build` branch) |

---

## Tech Stack

| Concern    | Technology                           |
| ---------- | ------------------------------------ |
| Framework  | Next.js 16 (App Router)              |
| Language   | TypeScript (strict mode)             |
| Database   | Supabase (PostgreSQL)                |
| Auth       | Supabase Auth — Google OAuth         |
| Styling    | Tailwind CSS                         |
| Validation | Zod                                  |
| Fonts      | Cormorant Garamond, DM Sans, DM Mono |

---

## Architecture

### Security Model

```
Frontend (SSR/CSR)
      ↓
Next.js API Routes  ← All data operations happen here
      ↓
Supabase (service role key)  ← Never exposed to browser
```

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — used only for Supabase Auth session management
- `SUPABASE_SERVICE_ROLE_KEY` — used only in server-side API routes, never in client code
- Zero direct database access from frontend components

### Two Roles

| Role        | Access                                                                               |
| ----------- | ------------------------------------------------------------------------------------ |
| `doctor`    | Full access — clinical notes, prescriptions, reports, catalogue management, settings |
| `frontdesk` | Patient registration, queue management, billing, appointments                        |

---

## Project Structure

```
/app
  /api                    ← All backend API routes
    /auth                 ← OAuth callback + session
    /patients             ← Patient CRUD + clinical profiles
    /visits               ← Visits + prescriptions
    /catalogue            ← Services + medicines
    /treatments           ← Treatment packages + sessions
    /bills                ← Billing with GST calculation
    /payments             ← Payment recording
    /queue                ← Daily queue management
    /appointments         ← Appointment scheduling
    /reports              ← Revenue, patients, treatments, dues
    /audit                ← Audit log viewer
    /settings             ← Clinic settings + signature upload
  /auth
    /callback             ← OAuth session establishment (client)
    /redirect             ← Role-based dashboard redirect
  /login                  ← Google OAuth login page

/lib
  /supabase
    /server.ts            ← Service role client (API routes only)
    /auth.ts              ← Auth helper client (session only)
  /middleware
    /auth.ts              ← requireAuth() — uses getUser() for security
    /role.ts              ← requireRole() — doctor/frontdesk enforcement
  /utils
    /uhid.ts              ← UHID generation via DB sequence
    /bill-number.ts       ← Bill number generation via DB sequence
    /gst.ts               ← GST + discount calculation
    /response.ts          ← Standardised API response helpers
    /audit.ts             ← Audit log helper
    /treatment.ts         ← Shared treatment session logic
    /cn.ts                ← Tailwind class merging utility

/types
  /database.ts            ← TypeScript types matching Supabase schema
  /api.ts                 ← Request/response types

/proxy.ts                 ← Route protection middleware
```

---

## Database Schema

15 tables in Supabase PostgreSQL:

| Table                       | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| `profiles`                  | User accounts with role assignment                    |
| `patients`                  | Patient master records with UHID                      |
| `patient_clinical_profiles` | Prakriti, Vikriti, Dosha, Nadi Pariksha (doctor only) |
| `visits`                    | Consultation records with status flow                 |
| `visit_prescriptions`       | Medicines + advice per consultation                   |
| `catalogue_services`        | Clinic service catalogue with GST                     |
| `catalogue_medicines`       | Medicine catalogue                                    |
| `patient_treatments`        | Treatment package instances                           |
| `treatment_sessions`        | Individual session records                            |
| `bills`                     | Tax invoices with line items as JSONB                 |
| `payments`                  | Payment records (multi-mode)                          |
| `appointments`              | Scheduled appointments                                |
| `clinic_settings`           | Clinic configuration                                  |
| `audit_logs`                | Immutable audit trail                                 |
| `bill_number_sequences`     | Financial year bill numbering                         |

### Key Database Features

- `uhid_sequence` — PostgreSQL sequence for race-condition-safe UHID generation
- `generate_next_uhid()` — DB function returning `AYU-YYYY-NNNNN`
- `generate_next_bill_number()` — DB function returning `PREFIX/YY-YY/NNNN`
- `update_updated_at` trigger — auto-updates timestamps on all mutable tables
- `check_treatment_completion` trigger — auto-completes treatment when all sessions consumed
- RLS enabled on all tables (data access via service role from API routes)

---

## API Reference

All responses follow a consistent envelope:

```json
{ "success": true, "data": {}, "meta": { "total": 0, "page": 1, "per_page": 20 } }
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Patient not found" } }
```

### Endpoints

| Method | Route                          | Description                            | Role   |
| ------ | ------------------------------ | -------------------------------------- | ------ |
| GET    | `/api/auth/session`            | Current user session + profile         | Any    |
| GET    | `/api/patients`                | List patients with search + pagination | Any    |
| POST   | `/api/patients`                | Register new patient (auto UHID)       | Any    |
| GET    | `/api/patients/:id`            | Full patient record                    | Any    |
| PUT    | `/api/patients/:id`            | Update patient                         | Any    |
| GET    | `/api/patients/:id/clinical`   | Clinical profile                       | Doctor |
| PUT    | `/api/patients/:id/clinical`   | Save clinical profile                  | Doctor |
| GET    | `/api/visits`                  | List visits (filter by patient/date)   | Any    |
| POST   | `/api/visits`                  | Create visit                           | Any    |
| GET    | `/api/visits/:id`              | Visit detail (filtered by role)        | Any    |
| PUT    | `/api/visits/:id`              | Update visit + auto-session marking    | Any    |
| GET    | `/api/visits/:id/prescription` | Get prescription                       | Any    |
| PUT    | `/api/visits/:id/prescription` | Save prescription                      | Doctor |
| GET    | `/api/catalogue/services`      | List services                          | Any    |
| POST   | `/api/catalogue/services`      | Create service                         | Doctor |
| PUT    | `/api/catalogue/services/:id`  | Update service                         | Doctor |
| GET    | `/api/catalogue/medicines`     | List medicines                         | Any    |
| POST   | `/api/catalogue/medicines`     | Create medicine                        | Doctor |
| PUT    | `/api/catalogue/medicines/:id` | Update medicine                        | Doctor |
| GET    | `/api/treatments`              | List treatment packages                | Any    |
| POST   | `/api/treatments`              | Create treatment package               | Any    |
| GET    | `/api/treatments/:id`          | Treatment with sessions                | Any    |
| PUT    | `/api/treatments/:id`          | Update status/notes                    | Any    |
| POST   | `/api/treatments/:id/session`  | Mark session (with rollback safety)    | Any    |
| GET    | `/api/bills`                   | List bills with filters                | Any    |
| POST   | `/api/bills`                   | Create bill with GST + auto-treatment  | Any    |
| GET    | `/api/bills/:id`               | Bill with patient + payments           | Any    |
| PUT    | `/api/bills/:id`               | Edit bill                              | Doctor |
| POST   | `/api/payments`                | Add payment to bill                    | Any    |
| GET    | `/api/queue`                   | Today's queue with token numbers       | Any    |
| POST   | `/api/queue`                   | Add patient to queue                   | Any    |
| PUT    | `/api/queue/:id/status`        | Update visit status                    | Any    |
| GET    | `/api/appointments`            | List appointments                      | Any    |
| POST   | `/api/appointments`            | Create appointment                     | Any    |
| PUT    | `/api/appointments/:id`        | Update appointment                     | Any    |
| DELETE | `/api/appointments/:id`        | Cancel appointment (soft delete)       | Any    |
| GET    | `/api/reports/revenue`         | Revenue by date range                  | Doctor |
| GET    | `/api/reports/patients`        | Patient growth stats                   | Doctor |
| GET    | `/api/reports/treatments`      | Treatment statistics                   | Doctor |
| GET    | `/api/reports/dues`            | Outstanding dues list                  | Doctor |
| GET    | `/api/audit`                   | Audit log with filters                 | Doctor |
| GET    | `/api/settings`                | Clinic settings                        | Any    |
| PUT    | `/api/settings`                | Update settings                        | Doctor |
| POST   | `/api/settings/signature`      | Upload doctor signature                | Doctor |

---

## Key Business Logic

### UHID Format

`AYU-2026-00001` — generated atomically via PostgreSQL sequence. No race conditions.

### Bill Number Format

`AYU/25-26/0001` — financial year aware (April start), generated atomically via DB row lock.

### GST Calculation

1. Line subtotal = `quantity × unit_price`
2. GST = `subtotal × (gst_rate / 100)` if `gst_applicable`
3. Discount applied to subtotal first, GST recalculated on discounted amount
4. All amounts rounded to 2 decimal places

### Visit Status Flow

```
waiting → with_doctor → completed
                      → cancelled
```

When a visit is marked `completed`, the system automatically marks one session on any active treatment package for that patient.

### Treatment Package Flow

1. Doctor creates service of type `package` in catalogue
2. When billed, `patient_treatments` record auto-created with `sessions_total = package_days`
3. Each completed visit or manual mark increments `sessions_consumed`
4. DB trigger auto-sets status to `completed` when `sessions_consumed = sessions_total`

### Payment Status Logic

- `due` — no payments recorded
- `partial` — some payments, total < bill amount
- `paid` — total payments ≥ bill amount
- `advance` — payment made before bill exists

---

## Setup

### Prerequisites

- Node.js 18+
- Supabase project
- Google OAuth credentials

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase Configuration

1. Run the full schema SQL (all 15 tables + enums + triggers)
2. Run the UHID sequence SQL:
   ```sql
   CREATE SEQUENCE uhid_sequence START 1;
   CREATE OR REPLACE FUNCTION generate_next_uhid() ...
   ```
3. Run the bill number sequence SQL:
   ```sql
   CREATE TABLE bill_number_sequences ...
   CREATE OR REPLACE FUNCTION generate_next_bill_number() ...
   ```
4. Create storage bucket `signatures` (private)
5. In Authentication → URL Configuration add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`

### Google OAuth

In Google Cloud Console → OAuth credentials → Authorized redirect URIs:

```
https://your-project.supabase.co/auth/v1/callback
```

### Install and Run

```bash
npm install
npm run dev
```

### First Login

1. Navigate to `http://localhost:3000/login`
2. Sign in with Google
3. A profile is created with `role = frontdesk` by default
4. To set doctor role: go to Supabase table editor → `profiles` → update `role` to `doctor`

---

## Branches

| Branch              | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `main`              | Stable — complete backend, verified build |
| `frontend/ui-build` | Active — frontend UI development          |

---

## What's Next

The frontend UI is being built on the `frontend/ui-build` branch using Next.js App Router with:

- Cormorant Garamond + DM Sans typography
- Forest green + warm gold design system
- SSR-first with CSR only where necessary
- Mobile-first responsive layout
- Lighthouse 100 target

Pages being built: Login, Doctor Dashboard, Frontdesk Dashboard, Patient List, Patient Profile, Patient Registration, Visit/Consultation, Queue (with Supabase Realtime), Billing Flow, Appointments Calendar, Print Templates (A4 + Thermal), Treatment Tracker, Reports, Audit Log, Settings.

---

## License

Private — Dr. Shetty's Ayur Clinic. All rights reserved.
