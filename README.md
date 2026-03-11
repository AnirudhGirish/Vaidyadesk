<div align="center">

<br />
<br />

# Vaidya Desk

**Clinical Management Infrastructure for Modern Ayurvedic Practice**

<br />

[![Build](https://img.shields.io/badge/build-passing-2D6A4F?style=flat-square&logo=vercel&logoColor=white)](/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_17-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/license-proprietary-B8922A?style=flat-square)](/LICENSE)

<br />

*A zero-trust, full-stack clinical operations platform — built for Dr. Shetty's Ayurvedic Clinic.*  
*Engineered by [SynkBuilds](#-about-synkbuilds).*

<br />

[Overview](#-overview) · [Architecture](#-architecture) · [Database](#-database) · [API](#-api-reference) · [Security](#-security) · [Setup](#-developer-setup) · [SynkBuilds](#-about-synkbuilds)

<br />

</div>

---

## Overview

Vaidya Desk is a production-grade clinic management platform built from the ground up for the operational complexity of a modern Ayurvedic practice. It handles everything from the moment a patient walks in to the moment a GST-compliant invoice is sent — with complete clinical charting, Ayurvedic profiling, real-time queue management, multi-session treatment tracking, and deep financial analytics woven into a single, cohesive system.

Every layer — database, API, and UI — is built to production standards. No compromises on security, no shortcuts on data integrity, no ambiguity in the user experience.

<br />

### Project Status

| Layer | Status | Details |
| :--- | :---: | :--- |
| Backend API | ✅ Complete | 34 route handlers, Zod validation, role-based access |
| Database | ✅ Complete | 15 tables, 50 indexes, 20 triggers, 40 RLS policies |
| Authentication | ✅ Complete | Google OAuth via Supabase SSR, cookie-based sessions |
| Frontend | ✅ Complete | 20+ SSR pages, real-time queue, print templates |
| Audit & Compliance | ✅ Complete | Immutable audit trail, GST-compliant invoicing |

<br />

---

## Architecture

Vaidya Desk follows a strict **server-first architecture**. The frontend never touches the database directly. All data flows through authenticated Next.js API routes using a server-only service role client. The browser holds only an OAuth session — nothing more.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│   Next.js Pages (SSR)  ──►  fetch('/api/...')               │
│   React Client Components ──►  fetch('/api/...')            │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────┐
│                   Next.js API Routes                         │
│   requireAuth() → requireRole() → business logic            │
│   Service Role Client (server-only, never exposed)          │
└────────────────────────────┬────────────────────────────────┘
                             │ Supabase SDK (service role)
┌────────────────────────────▼────────────────────────────────┐
│              Supabase PostgreSQL 17                          │
│   RLS Policies · Triggers · Sequences · Functions           │
└─────────────────────────────────────────────────────────────┘
```

<br />

### Tech Stack

| Concern | Choice | Reason |
| :--- | :--- | :--- |
| Framework | Next.js 16 (App Router) | SSR-first, API routes, middleware |
| Language | TypeScript 5 (strict) | End-to-end type safety |
| Database | Supabase / PostgreSQL 17 | RLS, triggers, sequences, realtime |
| Auth | Supabase Auth + Google OAuth | Cookie-based SSR sessions via `@supabase/ssr` |
| Styling | Tailwind CSS 4 | Utility-first, custom design token system |
| Validation | Zod 4 | Schema validation at every API boundary |
| Forms | React Hook Form 7 | Controlled forms with Zod resolver |
| Charts | Recharts 3 (dynamic import) | Revenue and analytics visualizations |
| Icons | Lucide React | Consistent, tree-shakeable icon set |
| Fonts | Cormorant Garamond · DM Sans · DM Mono | Premium Ayurvedic-aligned typography |

<br />

### Rendering Strategy

| Layer | Approach | Rationale |
| :--- | :--- | :--- |
| All data pages | Server Components + `fetch` | Zero client JS for data fetching |
| Forms, modals, toasts | `use client` boundary | Interactivity where strictly needed |
| Queue page | CSR + Supabase Realtime | Live updates without polling |
| Charts | `dynamic(() => import(...), { ssr: false })` | No bundle cost on non-report pages |
| Print templates | `@media print` CSS | Native browser printing, no dependencies |

<br />

---

## Database

Vaidya Desk's data layer is designed with the same precision as the application itself. Fifteen normalized PostgreSQL tables, backed by atomic sequences, row-level security on every table, and a full trigger system for timestamps, audit logging, and treatment lifecycle management.

<br />

### Schema

```
profiles                    ← Staff accounts, roles (doctor | frontdesk)
├── patients                ← Master patient records with auto-generated UHID
│   ├── patient_clinical_profiles   ← Prakriti, Vikriti, Nadi Pariksha (doctor-only)
│   ├── visits              ← Consultation records (waiting → with_doctor → completed)
│   │   └── visit_prescriptions     ← Medicines + clinical advice per visit
│   ├── patient_treatments  ← Multi-session package instances
│   │   └── treatment_sessions      ← Individual session records with rollback safety
│   ├── bills               ← GST-compliant invoices (JSONB line items)
│   │   └── payments        ← Multi-mode payment records (cash, UPI, card, cheque)
│   └── appointments        ← Scheduled appointments with soft cancellation
│
catalogue_services          ← Services with duration_type (single | package), GST
catalogue_medicines         ← Medicines with type (ayurvedic | general)
clinic_settings             ← Business config, bill prefix, GST rate, signature URL
audit_logs                  ← Immutable action trail (insert/update/delete)
bill_number_sequences       ← Financial-year-aware bill numbering state
```

<br />

### Database Mechanics

**Concurrency-safe ID generation**

UHID and bill numbers are generated inside the database via PostgreSQL sequences and row-level locks — not application code. This eliminates race conditions entirely under concurrent load.

```sql
-- UHID: AYU-2026-00001
SELECT generate_next_uhid();

-- Bill number: AYU/25-26/0001 (April-start financial year)
SELECT generate_next_bill_number('AYU', '25-26');
```

**Automatic lifecycle triggers**

- `handle_updated_at` — BEFORE UPDATE on all mutable tables
- `handle_new_patient` — BEFORE INSERT on `patients`, generates UHID
- `handle_new_bill` — BEFORE INSERT on `bills`, generates bill number
- `handle_new_user` — on auth signup, creates `profiles` row with `frontdesk` role
- `audit_log_trigger` — AFTER INSERT/UPDATE/DELETE on financial and clinical tables
- Treatment completion — automatically sets `status = 'completed'` when `sessions_consumed = sessions_total`

**Indexes**

50 indexes including compound descending indexes on `bills.bill_date` and `visits.visit_date`, GIN full-text indexes on patient names and catalogue items, and unique constraints on UHID and phone.

**Row-Level Security**

40 policies across 14 tables. No table is unprotected. The `profiles` table prevents role escalation via `WITH CHECK`. Clinical tables are fully restricted to the `doctor` role at the database level — not just the application level.

<br />

### Enum Types

```
user_role          doctor | frontdesk
gender             male | female | other
patient_type       new | returning | followup
visit_status       waiting | with_doctor | completed | cancelled
appointment_status scheduled | confirmed | arrived | completed | cancelled | no_show
payment_status     paid | partial | due | advance
payment_mode       cash | upi | card | netbanking | cheque
duration_type      single | package
treatment_status   active | completed | cancelled | paused
medicine_type      ayurvedic | general
discount_type      flat | percentage | none
audit_action       create | update | delete
```

<br />

---

## Security

Vaidya Desk is built on a zero-trust security model. Every assumption is verified. No implicit trust exists anywhere in the stack.

<br />

### Principles

**1. The browser never holds privileged credentials**
`SUPABASE_SERVICE_ROLE_KEY` exists only in server-side API routes. It is never shipped to the client, never referenced in a `use client` component, never in `NEXT_PUBLIC_*`.

**2. Every API route is authenticated before execution**
`requireAuth()` is called at the top of every handler. It uses `auth.getUser()` — not `getSession()` — which makes a live network call to Supabase to verify the JWT. Sessions cannot be spoofed with a modified local token.

**3. Role enforcement is layered**
`requireRole(auth, 'doctor')` is called on sensitive operations. Clinical profiles, prescriptions, reports, settings, and catalogue management require the doctor role at both the API layer and the database RLS layer. Frontdesk bypassing the API and calling Supabase directly would still be blocked by RLS.

**4. Data integrity is enforced at the database level**
Foreign key constraints, enum type checking, NOT NULL constraints, and trigger-level validations mean the database will reject malformed data even if application-level validation fails.

<br />

### Role Matrix

| Capability | Doctor | Frontdesk |
| :--- | :---: | :---: |
| Patient registration & management | ✅ | ✅ |
| Queue & appointment management | ✅ | ✅ |
| Billing & payments | ✅ | ✅ |
| Clinical profiles (Prakriti/Vikriti) | ✅ | ❌ |
| Prescriptions & doctor notes | ✅ | ❌ |
| Treatment session management | ✅ | ✅ |
| Analytics & reports | ✅ | ❌ |
| Audit log viewer | ✅ | ❌ |
| Clinic settings & signature | ✅ | ❌ |
| Catalogue management | ✅ | Read-only |

<br />

---

## API Reference

All responses conform to a consistent envelope structure:

```typescript
// Success
{ "success": true, "data": T, "meta"?: { "total": number, "page": number, "per_page": number } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Patient not found" } }
```

HTTP status codes follow REST conventions: `200` reads · `201` creates · `401` unauthenticated · `403` unauthorized · `404` not found · `409` conflict · `422` validation failure · `500` internal error.

<br />

### Endpoints

**Auth**
```
GET  /api/auth/session              Current user — userId, role, fullName, signatureUrl
```

**Patients**
```
GET  /api/patients                  List  ?search= &page= &per_page=
POST /api/patients                  Register — auto-generates UHID via DB sequence
GET  /api/patients/:id              Full patient record
PUT  /api/patients/:id              Update patient details
GET  /api/patients/:id/clinical     Ayurvedic clinical profile          [doctor only]
PUT  /api/patients/:id/clinical     Save clinical profile               [doctor only]
```

**Visits & Prescriptions**
```
GET  /api/visits                    List  ?patient_id= &date=
POST /api/visits                    Create visit, auto-assigns queue token
GET  /api/visits/:id                Visit detail (doctor_notes filtered for frontdesk)
PUT  /api/visits/:id                Update — triggers session auto-mark on completion
GET  /api/visits/:id/prescription   Prescription or null
PUT  /api/visits/:id/prescription   Save prescription                   [doctor only]
```

**Catalogue**
```
GET  /api/catalogue/services        Full service list
POST /api/catalogue/services        Create service                      [doctor only]
PUT  /api/catalogue/services/:id    Update service                      [doctor only]
GET  /api/catalogue/medicines       Full medicine list
POST /api/catalogue/medicines       Create medicine                     [doctor only]
PUT  /api/catalogue/medicines/:id   Update medicine                     [doctor only]
```

**Treatments**
```
GET  /api/treatments                List  ?patient_id=
POST /api/treatments                Create treatment package instance
GET  /api/treatments/:id            Treatment with all sessions
PUT  /api/treatments/:id            Update status or notes
POST /api/treatments/:id/session    Mark session — atomic with rollback safety
```

**Billing**
```
GET  /api/bills                     List  ?patient_id= &payment_status= &from_date= &to_date= &page=
POST /api/bills                     Create — GST calc, auto-treatment creation, payment rollback
GET  /api/bills/:id                 Bill with patient info and payment history
PUT  /api/bills/:id                 Edit bill                           [doctor only]
POST /api/payments                  Add payment — recalculates payment_status
```

**Queue & Appointments**
```
GET    /api/queue                   Today's queue with token numbers and patient data
POST   /api/queue                   Add patient to today's queue
PUT    /api/queue/:id/status        Advance visit status
GET    /api/appointments            List  ?date= &status=
POST   /api/appointments            Create appointment
PUT    /api/appointments/:id        Update appointment
DELETE /api/appointments/:id        Soft cancel — sets status = 'cancelled'
```

**Reports & Admin**
```
GET  /api/reports/revenue           Revenue by date range              [doctor only]
GET  /api/reports/patients          Patient growth statistics          [doctor only]
GET  /api/reports/treatments        Treatment analytics                [doctor only]
GET  /api/reports/dues              Outstanding dues list              [doctor only]
GET  /api/audit                     Audit log  ?table_name= &from_date= &to_date=  [doctor only]
GET  /api/settings                  Clinic configuration
PUT  /api/settings                  Update settings                    [doctor only]
POST /api/settings/signature        Upload doctor signature to Storage [doctor only]
```

<br />

---

## Frontend

### Pages

| Route | Role | Description |
| :--- | :--- | :--- |
| `/login` | Public | Google OAuth entry point |
| `/doctor/dashboard` | Doctor | Stats, queue preview, quick actions |
| `/frontdesk/dashboard` | Frontdesk | Live queue, recent activity |
| `/patients` | Both | Searchable patient list with pagination |
| `/patients/new` | Both | Registration form with inline UHID on success |
| `/patients/:id` | Both | Full profile — Overview, Clinical, Billing, Treatments tabs |
| `/patients/:id/edit` | Both | Edit patient details |
| `/patients/:id/clinical` | Doctor | Ayurvedic profile editor |
| `/visits/:id` | Both | Consultation view — notes, prescription builder |
| `/doctor/queue` | Doctor | Real-time queue with Supabase Realtime |
| `/frontdesk/queue` | Frontdesk | Real-time queue with status controls |
| `/billing` | Both | Bill list with filters |
| `/billing/new` | Both | Multi-step bill creation — patient → items → discount → payment |
| `/billing/:id` | Both | Bill detail with A4 print |
| `/appointments` | Both | Calendar view with scheduling |
| `/treatments` | Both | Treatment tracker with session progress |
| `/catalogue` | Both | Services and medicines management |
| `/reports` | Doctor | Revenue, patient, treatment charts |
| `/audit` | Doctor | Audit log with filters |
| `/settings` | Doctor | Clinic config, GST settings, signature upload |

<br />

### Design System

| Token | Value | Usage |
| :--- | :--- | :--- |
| Primary | `#1A3D2B` Forest green | Navigation, primary actions |
| Accent | `#B8922A` Warm gold | CTAs, highlights, active states |
| Background | `#FAF8F5` Off-white | Page backgrounds |
| Surface | `#FFFFFF` | Cards, modals |
| Border | `#E8E2D9` | Dividers, input borders |
| Display font | Cormorant Garamond | Headings, patient names |
| UI font | DM Sans | Body text, labels, buttons |
| Data font | DM Mono | UHIDs, bill numbers, amounts |

<br />

### Print Templates

Both templates use CSS `@media print` — no external libraries, no PDF generation overhead, no additional API calls. The browser renders and prints natively.

- **A4 Tax Invoice** — clinic header, itemized table, GST breakdown (CGST + SGST), payment summary, balance due
- **A4 Prescription** — clinic header, patient info, medicines with dosage/frequency/duration, diet and lifestyle advice, doctor signature

<br />

---

## Developer Setup

### Prerequisites

- Node.js 18 or above
- A provisioned Supabase project (PostgreSQL 17)
- Google Cloud Console OAuth 2.0 credentials

### Environment

Create `.env.local` at the repository root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> `SUPABASE_SERVICE_ROLE_KEY` is used exclusively in server-side API routes. It is never referenced in any client component or `NEXT_PUBLIC_*` variable.

### Database Initialization

Run the following against your Supabase project in order:

1. Full schema — all 15 tables, enums, foreign keys, constraints
2. Functions and triggers — `handle_updated_at`, `handle_new_patient`, `handle_new_bill`, `handle_new_user`, `audit_log_trigger`
3. Sequences — `CREATE SEQUENCE uhid_sequence START 1`
4. RPC functions — `generate_next_uhid()`, `generate_next_bill_number(prefix, financial_year)`
5. Storage — create a private bucket named `signatures`
6. Seed — insert one row into `clinic_settings` with your clinic's details

In Supabase Authentication → URL Configuration, add:

```
http://localhost:3000/auth/callback
```

In Google Cloud Console → OAuth 2.0 → Authorized Redirect URIs, add:

```
https://your-project.supabase.co/auth/v1/callback
```

### Install and Run

```bash
npm install
npm run dev
```

### First Login

The first sign-in automatically creates a profile with the `frontdesk` role. To grant doctor access:

```sql
UPDATE profiles SET role = 'doctor' WHERE email = 'your@email.com';
```

### Production Build

```bash
npm run build   # must exit with code 0
npm start
```

All 34 dynamic API routes and 3 static auth pages compile cleanly with zero TypeScript errors.

<br />

---

## Roadmap

Phase 1 is complete and production-verified. The following capabilities are scoped for Phase 2:

**AI Clinical Assistant**
Doctor types shorthand keywords — AI expands them into structured clinical notes, treatment plans, and patient summaries. Clinic-specific context trained on Ayurvedic terminology.

**Prescription to Billing**
Medicines and treatments prescribed during a consultation automatically populate the billing flow, eliminating double-entry between the consultation and billing desk.

**WhatsApp & SMS Delivery**
Post-visit prescription summaries and bill copies delivered directly to the patient's WhatsApp. Appointment reminders 24 hours in advance. Automated follow-up for outstanding dues.

**Session Auto-Billing**
When a treatment session is marked complete, optionally auto-generate the corresponding charge and bill.

<br />

---

## About SynkBuilds

Vaidya Desk was designed and engineered by **SynkBuilds**.

SynkBuilds is a software development agency specializing in production-grade systems for real-world operational environments. We build across the full spectrum — custom IoT hardware, native mobile applications, enterprise platforms, and premium web applications — with a consistent focus on security, performance, and design quality.

Our belief: mission-critical business software should be as refined as the service it supports.

**Built for production. Engineered for scale. Designed for elegance.**

*[synkbuilds.com](#) · [hello@synkbuilds.com](#)*

<br />

---

<div align="center">

*© 2026 Vaidya Desk. A SynkBuilds product. All rights reserved.*

<br />

[![Made with Next.js](https://img.shields.io/badge/Made_with-Next.js-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![Powered by Supabase](https://img.shields.io/badge/Powered_by-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)

</div>