import React from 'react'
import Link from 'next/link'
import { VaidyaLogo } from '@/components/common/VaidyaLogo'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Vaidya Desk',
  description: 'Privacy Policy for Vaidya Desk Patient Management System',
}

export default function PrivacyPage() {
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
            Privacy Policy
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
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem', color: 'var(--color-forest-700)' }}>1. Introduction</h2>
          <p className="mb-6 leading-relaxed">
            Welcome to Vaidya Desk (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting the privacy and security of your personal and medical information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Vaidya Desk Patient Management System.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem', color: 'var(--color-forest-700)' }}>2. Information We Collect</h2>
          <p className="mb-4 leading-relaxed">We may collect information about you in a variety of ways. The information we may collect includes:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Personal Data:</strong> Name, age, email address, phone number, and physical address.</li>
            <li><strong>Medical Data (PHI):</strong> Ayurvedic clinical profiles (Prakriti, Vikriti, Dosha), consultation notes, prescriptions, and medical history.</li>
            <li><strong>Financial Data:</strong> Billing information, payment records, and transaction history.</li>
            <li><strong>Authentication Data:</strong> Google OAuth profile information required to authenticate clinic staff access.</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem', color: 'var(--color-forest-700)' }}>3. Use of Your Information</h2>
          <p className="mb-4 leading-relaxed">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the system to:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Facilitate medical consultations and generate accurate prescriptions.</li>
            <li>Process billing, generate GST-compliant invoices, and track payments.</li>
            <li>Manage clinic appointments and operational queuing.</li>
            <li>Generate internal analytics to improve clinic performance.</li>
            <li>Ensure the strict security and integrity of the system through audit logs.</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem', color: 'var(--color-forest-700)' }}>4. Security of Your Information</h2>
          <p className="mb-6 leading-relaxed">
            We use administrative, technical, and physical security measures to help protect your personal information. Vaidya Desk operates on a Zero-Trust Architecture backed by Supabase Row-Level Security (RLS). While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem', color: 'var(--color-forest-700)' }}>5. Contact Us</h2>
          <p className="mb-6 leading-relaxed">
            If you have questions or comments about this Privacy Policy, please contact us at: <br />
            <strong>Dr. Shetty&apos;s Ayurvedic Clinic</strong><br />
            Kalaburagi, Karnataka, India
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
