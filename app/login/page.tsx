'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Stethoscope, ClipboardList, AlertCircle, Clock, ArrowLeft } from 'lucide-react'
import { VaidyaLogo } from '@/components/common/VaidyaLogo'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse" style={{ background: 'var(--color-warm-50)' }} />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const errorMessages: Record<string, { icon: typeof AlertCircle; msg: string; type: 'error' | 'warning' }> = {
    auth_failed: { icon: AlertCircle, msg: 'Authentication failed. Please try again.', type: 'error' },
    profile_failed: { icon: AlertCircle, msg: 'Account found but profile could not be loaded. Contact support.', type: 'error' },
    no_access: { icon: Clock, msg: 'Your Google account is not yet approved for clinic access. Please ask the doctor to grant you access from the Settings page.', type: 'warning' },
  }
  const urlError = errorCode ? errorMessages[errorCode] : null

  const handleLogin = async (role: 'doctor' | 'frontdesk') => {
    setLoading(role)
    setError(null)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })

      if (error) setError(error.message)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--color-warm-50)' }}
    >
      {/* Left decorative panel — hidden on mobile */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
        style={{ background: 'var(--color-forest-700)' }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'var(--color-gold-400)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'var(--color-gold-500)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-5"
          style={{ background: 'var(--color-gold-400)', border: '2px solid var(--color-gold-400)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(184,146,42,0.25)' }}
          >
            <VaidyaLogo className="w-6 h-6" style={{ color: 'var(--color-gold-400)' }} />
          </div>
          <h1
            className="text-4xl font-semibold text-white leading-tight mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Dr. Shetty&apos;s<br />Ayur Clinic
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-sans)' }}>
            Patient Management System
          </p>
        </div>

        {/* Feature bullets */}
        <div className="relative z-10 space-y-4">
          {[
            { text: 'Complete patient records & Ayurvedic profiles' },
            { text: 'Real-time queue & appointment management' },
            { text: 'GST-compliant billing & payment tracking' },
            { text: 'Treatment plans with session tracking' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--color-gold-400)' }}
              />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-sans)' }}>
                {f.text}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-sans)' }}>
          © 2026 Vaidya Desk. Secured by Supabase.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-16">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-forest-700)' }}
          >
            <VaidyaLogo className="w-5 h-5" style={{ color: 'var(--color-gold-400)' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-forest-700)' }}>
              Dr. Shetty&apos;s Ayur Clinic
            </p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-8 transition-colors text-sm font-medium"
            style={{ color: 'var(--color-forest-700)', background: 'var(--color-forest-50)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-warm-200)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-forest-50)'}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="mb-10">
            <h2
              className="text-3xl font-semibold mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
            >
              Welcome back
            </h2>
            <p className="text-sm" style={{ color: 'rgba(44,44,44,0.55)', fontFamily: 'var(--font-sans)' }}>
              Choose your role to continue to the clinic dashboard
            </p>
          </div>

          {(error || urlError) && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl mb-6"
              style={{ background: urlError?.type === 'warning' ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${urlError?.type === 'warning' ? '#FCD34D' : '#FCA5A5'}` }}
            >
              {urlError ? <urlError.icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: urlError.type === 'warning' ? '#D97706' : '#EF4444' }} /> : <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
              <p className="text-sm" style={{ color: urlError?.type === 'warning' ? '#92400E' : '#B91C1C', fontFamily: 'var(--font-sans)' }}>{error ?? urlError?.msg}</p>
            </div>
          )}

          <div className="space-y-3 mb-8">
            {/* Doctor login */}
            <button
              onClick={() => handleLogin('doctor')}
              disabled={!!loading}
              className="w-full group transition-all duration-200"
              style={{
                background: 'white',
                border: '1px solid var(--color-warm-300)',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: 'var(--shadow-warm-sm)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading && loading !== 'doctor' ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.borderColor = 'var(--color-forest-700)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-warm)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-warm-300)'
                e.currentTarget.style.boxShadow = 'var(--shadow-warm-sm)'
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-forest-50)' }}
              >
                {loading === 'doctor' ? (
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-forest-700)', borderTopColor: 'transparent' }} />
                ) : (
                  <Stethoscope className="w-6 h-6" style={{ color: 'var(--color-forest-700)' }} />
                )}
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>
                  Sign in as Doctor
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                  Full access: consultations, prescriptions, reports
                </p>
              </div>
              <div className="text-2xl" style={{ color: 'var(--color-warm-300)' }}>→</div>
            </button>

            {/* Frontdesk login */}
            <button
              onClick={() => handleLogin('frontdesk')}
              disabled={!!loading}
              className="w-full group transition-all duration-200"
              style={{
                background: 'white',
                border: '1px solid var(--color-warm-300)',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: 'var(--shadow-warm-sm)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading && loading !== 'frontdesk' ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.borderColor = 'var(--color-gold-500)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-warm)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-warm-300)'
                e.currentTarget.style.boxShadow = 'var(--shadow-warm-sm)'
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(212,168,67,0.1)' }}
              >
                {loading === 'frontdesk' ? (
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-gold-500)', borderTopColor: 'transparent' }} />
                ) : (
                  <ClipboardList className="w-6 h-6" style={{ color: 'var(--color-gold-500)' }} />
                )}
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>
                  Sign in as Front Desk
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                  Queue, billing, appointments & patient registration
                </p>
              </div>
              <div className="text-2xl" style={{ color: 'var(--color-warm-300)' }}>→</div>
            </button>
          </div>

          {/* Google auth note */}
          <p className="text-center text-xs" style={{ color: 'rgba(44,44,44,0.4)', fontFamily: 'var(--font-sans)' }}>
            Authentication is handled via Google OAuth. Use your clinic Google account.
            <br />
            <span style={{ color: 'rgba(44,44,44,0.3)' }}>Access is restricted to authorized clinic staff only.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
