'use client'
import Link from 'next/link'
import {
  Leaf, Users, Receipt, CalendarDays, BarChart3, Shield,
  Stethoscope, ClipboardList, Mail, Phone, MapPin,
  BookOpen, CheckCircle, ArrowRight, Zap, Heart, Clock
} from 'lucide-react'
import { VaidyaLogo } from '@/components/common/VaidyaLogo'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-warm-50)', fontFamily: 'var(--font-sans)' }}>

      {/* ─── Nav ─── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(250, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-warm-200)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-forest-700)' }}
            >
              <VaidyaLogo className="w-4 h-4" style={{ color: 'var(--color-gold-400)' }} />
            </div>
            <div>
              <span
                className="font-semibold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)', fontSize: '1.1rem' }}
              >
                Vaidya Desk
              </span>
              <span className="text-xs ml-1.5" style={{ color: 'rgba(44,44,44,0.4)' }}>by SynkBuilds</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Documentation', href: '#documentation' },
              { label: 'About', href: '#about' },
              { label: 'Contact', href: '#contact' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm transition-colors duration-200"
                style={{ color: 'rgba(44,44,44,0.6)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-forest-700)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(44,44,44,0.6)')}
              >
                {label}
              </a>
            ))}
          </div>
          <Link
            href="/login"
            className="btn-primary text-sm"
            style={{ padding: '8px 20px', textDecoration: 'none' }}
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(26,61,43,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8"
            style={{
              background: 'var(--color-forest-50)',
              color: 'var(--color-forest-700)',
              border: '1px solid var(--color-forest-100)',
            }}
          >
            {/* <VaidyaLogo className="w-3.5 h-3.5" /> */}
            <Leaf className="w-3.5 h-3.5" />
            Built exclusively for Dr. Shetty&apos;s Ayur Clinic
          </div>
          <h1
            className="font-semibold leading-tight mb-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              color: 'var(--color-forest-700)',
              letterSpacing: '-0.03em',
            }}
          >
            Patient Management<br />
            <span style={{ color: 'var(--color-gold-500)' }}>
              Rooted in Tradition
            </span>
          </h1>
          <p
            className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'rgba(44,44,44,0.6)' }}
          >
            Vaidya Desk is a comprehensive, purpose-built patient management system
            for Dr. Shetty&apos;s Ayurvedic Clinic — handling everything from patient
            registration and Ayurvedic profiling to GST billing, treatment session
            tracking, and real-time queue management.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="btn-primary flex items-center gap-2"
              style={{ padding: '12px 28px', textDecoration: 'none', fontSize: '0.95rem' }}
            >
              <Stethoscope className="w-4 h-4" />
              Doctor Portal
            </Link>
            <Link
              href="/login"
              className="btn-secondary flex items-center gap-2"
              style={{ padding: '12px 28px', textDecoration: 'none', fontSize: '0.95rem' }}
            >
              <ClipboardList className="w-4 h-4" />
              Front Desk Portal
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="max-w-4xl mx-auto px-6 mb-20"
        >
          <div
            className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x rounded-2xl overflow-hidden"
            style={{
              background: 'white',
              boxShadow: 'var(--shadow-warm)',
              border: '1px solid var(--color-warm-200)',
            }}
          >
            {[
              { value: '2', label: 'Staff Roles', icon: Users },
              { value: 'GST', label: 'Compliant Billing', icon: Receipt },
              { value: '∞', label: 'Patient Records', icon: Heart },
              { value: '24/7', label: 'Data Security', icon: Shield },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center py-6 px-4 gap-2">
                <Icon className="w-5 h-5" style={{ color: 'var(--color-gold-500)' }} />
                <p
                  className="text-2xl font-semibold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
                >
                  {value}
                </p>
                <p className="text-xs text-center" style={{ color: 'rgba(44,44,44,0.5)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20" style={{ background: 'white' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-gold-500)' }}>
              Features
            </p>
            <h2
              className="text-4xl font-semibold mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
            >
              Everything the clinic needs
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(44,44,44,0.6)' }}>
              From the moment a patient walks in to the final payment — Vaidya Desk handles every step.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Patient Management',
                desc: 'Register patients with unique UHIDs, maintain Ayurvedic profiles including Prakriti, Vikriti, Nadi Pariksha, and chronic conditions.',
                accent: 'green',
              },
              {
                icon: Clock,
                title: 'Real-time Queue',
                desc: 'Live queue management with token numbers, wait-time tracking, and instant status updates across all devices simultaneously.',
                accent: 'gold',
              },
              {
                icon: CalendarDays,
                title: 'Appointments',
                desc: 'Schedule, confirm, and manage appointments with a weekly calendar view. Auto-check-in creates a visit and adds to queue.',
                accent: 'green',
              },
              {
                icon: Receipt,
                title: 'GST Billing',
                desc: 'Multi-item bills with GST calculation, discount support, multiple payment modes, and auto-generated bill numbers (AYU/FY/No).',
                accent: 'gold',
              },
              {
                icon: Heart,
                title: 'Treatment Tracking',
                desc: 'Package treatment plans with visual session-dot progress tracking. Mark sessions individually or via billing auto-mark.',
                accent: 'green',
              },
              {
                icon: BarChart3,
                title: 'Reports & Analytics',
                desc: 'Revenue trends, patient growth, treatment statistics, and outstanding dues — all visualized for the doctor\'s review.',
                accent: 'gold',
              },
            ].map(({ icon: Icon, title, desc, accent }) => (
              <div
                key={title}
                className="p-6 rounded-2xl group transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  border: '1px solid var(--color-warm-200)',
                  background: 'var(--color-warm-50)',
                  boxShadow: 'var(--shadow-warm-sm)',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-warm)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-warm-sm)')}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: accent === 'green' ? 'var(--color-forest-50)' : 'rgba(212,168,67,0.1)',
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: accent === 'green' ? 'var(--color-forest-700)' : 'var(--color-gold-500)' }}
                  />
                </div>
                <h3
                  className="font-semibold mb-2"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--color-charcoal)' }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(44,44,44,0.6)' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Role cards ─── */}
      <section className="py-20" style={{ background: 'var(--color-warm-50)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2
              className="text-4xl font-semibold mb-3"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
            >
              Two portals, one system
            </h2>
            <p className="text-base" style={{ color: 'rgba(44,44,44,0.55)' }}>
              Role-based access ensures each staff member sees exactly what they need.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Doctor */}
            <div
              className="rounded-2xl p-8 flex flex-col gap-4"
              style={{ background: 'var(--color-forest-700)', boxShadow: 'var(--shadow-warm-lg)' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(184,146,42,0.25)' }}
              >
                <Stethoscope className="w-6 h-6" style={{ color: 'var(--color-gold-400)' }} />
              </div>
              <h3
                className="text-2xl font-semibold text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Doctor Portal
              </h3>
              <ul className="space-y-2">
                {[
                  'Full patient & Ayurvedic profiles',
                  'Consultation notes & prescriptions',
                  'Revenue reports & analytics',
                  'Catalogue & settings management',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-gold-400)' }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-2 flex items-center gap-2 text-sm font-medium self-start"
                style={{ color: 'var(--color-gold-400)', textDecoration: 'none' }}
              >
                Access Doctor Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Frontdesk */}
            <div
              className="rounded-2xl p-8 flex flex-col gap-4"
              style={{
                background: 'white',
                border: '1px solid var(--color-warm-200)',
                boxShadow: 'var(--shadow-warm)',
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(212,168,67,0.1)' }}
              >
                <ClipboardList className="w-6 h-6" style={{ color: 'var(--color-gold-500)' }} />
              </div>
              <h3
                className="text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
              >
                Front Desk Portal
              </h3>
              <ul className="space-y-2">
                {[
                  'Patient registration & search',
                  'Queue & appointment management',
                  'Billing & payment collection',
                  'Treatment session marking',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(44,44,44,0.65)' }}>
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-forest-500)' }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-2 flex items-center gap-2 text-sm font-medium self-start"
                style={{ color: 'var(--color-forest-700)', textDecoration: 'none' }}
              >
                Access Front Desk Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Documentation ─── */}
      <section id="documentation" className="py-20" style={{ background: 'white' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-gold-500)' }}>
                Documentation
              </p>
              <h2
                className="text-4xl font-semibold mb-6"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
              >
                How the system works
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(44,44,44,0.6)' }}>
                Vaidya Desk is a full-stack web application built on Next.js with a Supabase
                PostgreSQL backend. All data is secured with Row-Level Security and role-based
                access control — doctor and front desk staff see only what they need.
              </p>
              <div className="space-y-6">
                {[
                  {
                    step: '01',
                    title: 'Patient Registration',
                    desc: 'Front desk registers patients with a automatically generated UHID (e.g., AYU-2026-00001). Full name, DOB, gender, phone, blood group, and emergency contact are recorded.',
                  },
                  {
                    step: '02',
                    title: 'Queue & Consultation',
                    desc: 'Patients are added to the daily queue with a token number. Doctor calls them in, records chief complaint, symptoms, notes, and saves a prescription.',
                  },
                  {
                    step: '03',
                    title: 'Billing & Payment',
                    desc: 'Bills are created with services and medicines from the catalogue. GST is auto-calculated. Payments are recorded (cash, UPI, card, etc.) and a professional invoice is printed.',
                  },
                  {
                    step: '04',
                    title: 'Treatment Follow-up',
                    desc: 'Package treatments are tracked per session. As sessions are marked (via billing or manually), the progress bar updates. Status auto-completes when all sessions are done.',
                  },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-5">
                    <div
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        background: 'var(--color-forest-50)',
                        color: 'var(--color-forest-700)',
                        fontFamily: 'var(--font-mono)',
                        border: '1px solid var(--color-forest-100)',
                      }}
                    >
                      {step}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-sans)' }}>
                        {title}
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(44,44,44,0.6)' }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech stack */}
            <div>
              <div
                className="rounded-2xl p-8"
                style={{ background: 'var(--color-warm-50)', border: '1px solid var(--color-warm-200)' }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="w-5 h-5" style={{ color: 'var(--color-forest-700)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--color-forest-700)', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
                    Technical Overview
                  </h3>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Framework', value: 'Next.js 16 — App Router' },
                    { label: 'Database', value: 'Supabase (PostgreSQL)' },
                    { label: 'Auth', value: 'Google OAuth via Supabase' },
                    { label: 'Styling', value: 'Tailwind CSS v4' },
                    { label: 'Real-time', value: 'Supabase Realtime (queue)' },
                    { label: 'Billing', value: 'GST-compliant invoice generation' },
                    { label: 'Print', value: 'A4 + thermal (80mm) templates' },
                    { label: 'Security', value: 'Row-Level Security + role RBAC' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2.5" style={{ borderBottom: '1px solid var(--color-warm-200)' }}>
                      <span className="text-sm" style={{ color: 'rgba(44,44,44,0.5)' }}>{label}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--color-forest-700)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4" style={{ color: 'var(--color-gold-400)' }} />
                    <span className="text-sm font-medium text-white" style={{ fontFamily: 'var(--font-sans)' }}>
                      API Architecture
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    All data flows through type-safe Next.js API routes. The frontend never
                    touches Supabase directly — every operation is validated server-side with Zod
                    schemas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── What is Vaidya Desk ─── */}
      <section id="about" className="py-20" style={{ background: 'var(--color-warm-50)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-gold-500)' }}>
              The Software
            </p>
            <h2
              className="text-4xl font-semibold mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
            >
              What is Vaidya Desk
            </h2>
          </div>

          <div className="max-w-3xl mx-auto mb-20">
            <div
              className="rounded-2xl p-10 text-center"
              style={{
                background: 'white',
                border: '1px solid var(--color-warm-200)',
                boxShadow: 'var(--shadow-warm)',
              }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(184,146,42,0.1), rgba(184,146,42,0.25))',
                }}
              >
                <VaidyaLogo className="w-10 h-10" style={{ color: 'var(--color-gold-500)' }} />
              </div>
              <h3
                className="text-2xl font-semibold mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
              >
                Vaidya Desk
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-gold-500)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                Patient Management System
              </p>
              <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(44,44,44,0.65)' }}>
                Vaidya Desk was designed and built as a purpose-built, production-grade
                software solution for Dr. Shetty&apos;s Ayurvedic Clinic. Every feature was
                developed in close collaboration with the clinic&apos;s staff to ensure it
                meets real-world daily usage requirements.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(44,44,44,0.5)' }}>
                The system was built with modern technologies — Next.js, Supabase, and Tailwind CSS —
                and adheres to production-grade standards for security, performance, and reliability.
                The goal was to create software that feels as premium as the care the clinic provides.
              </p>
              <div
                className="mt-8 pt-6 flex justify-center gap-8"
                style={{ borderTop: '1px solid var(--color-warm-200)' }}
              >
                {[
                  { label: 'API Routes', value: '30+' },
                  { label: 'Pages Built', value: '20+' },
                  { label: 'Built for', value: 'Production' },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p
                      className="text-2xl font-semibold"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
                    >
                      {value}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(44,44,44,0.5)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Who built Vaidya Desk ─── */}
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-gold-500)' }}>
              The Team
            </p>
            <h2
              className="text-4xl font-semibold mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
            >
              Who Built Vaidya Desk
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-2xl p-10 text-center"
              style={{
                background: 'white',
                border: '1px solid var(--color-warm-200)',
                boxShadow: 'var(--shadow-warm)',
              }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--color-forest-700), var(--color-forest-500))',
                  fontFamily: 'var(--font-display)',
                }}
              >
                SB
              </div>
              <h3
                className="text-2xl font-semibold mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
              >
                SynkBuilds
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-gold-500)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                Premium Software Development & Solutions Agency
              </p>
              <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(44,44,44,0.65)' }}>
                Vaidya Desk was engineered by <strong>SynkBuilds</strong>, a team of expert software architectures from diverse domains capable of building any software and IoT hardware. We specialize in developing premium, elegant-looking software backed by highly secure, non-breaking backends.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(44,44,44,0.5)' }}>
                From Mobile Apps (iOS & Android) and intricate system software to high-performance Web Applications and beautiful Landing Pages, SynkBuilds delivers production-grade solutions tailored to real-world needs.
              </p>
              <div
                className="mt-8 pt-6 flex justify-center gap-8"
                style={{ borderTop: '1px solid var(--color-warm-200)' }}
              >
                {[
                  { label: 'Web & Mobile', value: 'Apps' },
                  { label: 'Hardware', value: 'IoT' },
                  { label: 'Secure', value: 'Systems' },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p
                      className="text-2xl font-semibold"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
                    >
                      {value}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(44,44,44,0.5)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact ─── */}
      <section id="contact" className="py-20" style={{ background: 'white' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-gold-500)' }}>
              Contact
            </p>
            <h2
              className="text-4xl font-semibold mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
            >
              Get in touch
            </h2>
            <p className="text-base" style={{ color: 'rgba(44,44,44,0.55)' }}>
              For technical support or clinic inquiries, reach us through any of these channels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Clinic Contact */}
            <div
              className="rounded-2xl p-8"
              style={{ background: 'var(--color-warm-50)', border: '1px solid var(--color-warm-200)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--color-forest-50)' }}
                >
                  <VaidyaLogo className="w-5 h-5" style={{ color: 'var(--color-forest-700)' }} />
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--color-forest-700)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                  Dr. Shetty&apos;s Ayur Clinic
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--color-gold-500)' }} />
                  <p className="text-sm" style={{ color: 'rgba(44,44,44,0.65)' }}>
                    Dr. Shetty&apos;s Ayurvedic Clinic<br />
                    Kalaburagi, Karnataka, India
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 shrink-0" style={{ color: 'var(--color-gold-500)' }} />
                  <p className="text-sm" style={{ color: 'rgba(44,44,44,0.65)' }}>+91 98XXX XXXXX</p>
                </div>
              </div>
            </div>

            {/* Developer Contact */}
            <div
              className="rounded-2xl p-8"
              style={{ background: 'var(--color-forest-700)', boxShadow: 'var(--shadow-warm-lg)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(184,146,42,0.25)' }}
                >
                  <Zap className="w-5 h-5" style={{ color: 'var(--color-gold-400)' }} />
                </div>
                <h3
                  className="font-semibold text-white"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}
                >
                  Technical Support
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 shrink-0" style={{ color: 'var(--color-gold-400)' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    anirudhgirish08@gmail.com
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 shrink-0" style={{ color: 'var(--color-gold-400)' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    chiragsb16@gmail.com
                  </p>
                </div>
                {/* <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 shrink-0" style={{ color: 'var(--color-gold-400)' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    +91 9XXXXXXXXX
                  </p>
                </div> */}
                <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  For access issues, data queries, or feature requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        className="py-10"
        style={{ background: 'var(--color-forest-900)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(184,146,42,0.2)' }}
            >
              <VaidyaLogo className="w-3.5 h-3.5" style={{ color: 'var(--color-gold-400)' }} />
            </div>
            <span
              className="text-sm font-medium text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Vaidya Desk
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © 2026 Dr. Shetty&apos;s Ayur Clinic. Built by SynkBuilds. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-xs font-medium"
              style={{ color: 'var(--color-gold-400)', textDecoration: 'none' }}
            >
              Staff Login →
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-6 pt-10 justify-center">
          <Link
            href="/privacy"
            className="text-xs font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-xs font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  )
}
