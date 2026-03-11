import React from 'react'
import Link from 'next/link'
import { VaidyaLogo } from '@/components/common/VaidyaLogo'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | Vaidya Desk',
  description: 'Terms of Service for Vaidya Desk Patient Management System',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-warm-50)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-4"
        style={{
          background: 'rgba(250, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-warm-200)',
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-forest-700)' }}
            >
              <VaidyaLogo className="w-4 h-4" style={{ color: 'var(--color-gold-400)' }} />
            </div>
            <span
              className="font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)', fontSize: '1.1rem' }}
            >
              Vaidya Desk
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            style={{ color: 'var(--color-forest-700)', background: 'var(--color-forest-50)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-sm font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--color-gold-500)' }}>
            Legal
          </p>
          <h1
            className="text-4xl md:text-5xl font-semibold mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
          >
            Terms of Service
          </h1>
          <p className="text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
            Last Updated: March 2026
          </p>
        </div>

        <div
          className="prose prose-sm md:prose-base max-w-none"
          style={{
            color: 'rgba(44,44,44,0.8)',
            '--tw-prose-headings': 'var(--color-forest-700)',
            '--tw-prose-links': 'var(--color-gold-600)',
          } as React.CSSProperties}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem', color: 'var(--color-forest-700)' }}>1. Agreement to Terms</h2>
          <p className="mb-6 leading-relaxed">
            These Terms of Service constitute a legally binding agreement made between you and Dr. Shetty&apos;s Ayurvedic Clinic concerning your access to and use of the Vaidya Desk software. By accessing the system, you agree that you have read, understood, and agree to be bound by all of these Terms of Service.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem', color: 'var(--color-forest-700)' }}>2. User Representations & Authorization</h2>
          <p className="mb-4 leading-relaxed">By using Vaidya Desk, you represent and warrant that:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>You are an authorized medical or administrative staff member of the clinic.</li>
            <li>All registration information you submit via Google OAuth is truthful, accurate, and tied to your professional identity.</li>
            <li>You will maintain the strict confidentiality of patient medical data accessed through this software.</li>
            <li>Your use of the software will not violate any applicable healthcare privacy laws or regulations.</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem', color: 'var(--color-forest-700)' }}>3. Prohibited Activities</h2>
          <p className="mb-4 leading-relaxed">You may not access or use the system for any purpose other than that for which we make the system available. The system may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us. Prohibited activities include:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Retrieving patient data for purposes outside internal medical care and administration without explicit consent.</li>
            <li>Attempting to bypass the Role-Based Access Control (RBAC) restrictions set by administrators.</li>
            <li>Interfering with, disrupting, or creating an undue burden on the software or the networks connected to the software.</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem', color: 'var(--color-forest-700)' }}>4. System Liability & Availability</h2>
          <p className="mb-6 leading-relaxed">
            Vaidya Desk is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis. We cannot guarantee that the system will be available at all times. We may experience hardware, software, or network issues resulting in interruptions, delays, or errors. Medical professionals are advised to maintain robust physical operational protocols during any unexpected system downtimes.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem', color: 'var(--color-forest-700)' }}>5. Modifications and Interruptions</h2>
          <p className="mb-6 leading-relaxed">
            We reserve the right to change, modify, or remove the contents of the system at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our system. We also reserve the right to modify or discontinue all or part of the system without notice at any time.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center" style={{ background: 'var(--color-forest-900)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-xs text-yellow-600">
          © 2026 Vaidya Desk. Engineered by SynkBuilds. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
