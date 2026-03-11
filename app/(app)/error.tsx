'use client'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-2xl"
                style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}
            >
                ⚠️
            </div>
            <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                Something went wrong
            </h2>
            <p className="text-sm mb-6 max-w-sm" style={{ color: 'rgba(44,44,44,0.55)', fontFamily: 'var(--font-sans)' }}>
                {error?.message ?? 'An unexpected error occurred. Please try again.'}
            </p>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="btn-primary text-sm px-5 py-2"
                >
                    Try Again
                </button>
                <Link href="/doctor/dashboard" className="btn-secondary text-sm px-5 py-2" style={{ textDecoration: 'none' }}>
                    Go to Dashboard
                </Link>
            </div>
        </div>
    )
}
