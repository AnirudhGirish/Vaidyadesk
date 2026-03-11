import Link from 'next/link'
import { Leaf } from 'lucide-react'

export default function NotFound() {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-6"
            style={{ background: 'var(--color-warm-50)' }}
        >
            <div className="text-center max-w-sm">
                {/* Icon */}
                <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                    style={{
                        background: 'white',
                        border: '1px solid var(--color-warm-200)',
                        boxShadow: 'var(--shadow-warm-lg)',
                    }}
                >
                    <Leaf className="w-9 h-9" style={{ color: 'var(--color-forest-600)' }} />
                </div>

                {/* 404 number */}
                <p
                    className="text-7xl font-bold mb-2 tracking-tighter"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--color-forest-100)',
                        letterSpacing: '-0.04em',
                    }}
                >
                    404
                </p>

                {/* Heading */}
                <h1
                    className="text-2xl font-semibold mb-3"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
                >
                    Page Not Found
                </h1>

                {/* Message */}
                <p
                    className="text-sm mb-8 leading-relaxed"
                    style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}
                >
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <Link
                        href="/"
                        className="btn-primary flex items-center justify-center gap-2"
                        style={{ textDecoration: 'none' }}
                    >
                        Go to Dashboard
                    </Link>
                    <Link
                        href="/appointments"
                        className="btn-secondary flex items-center justify-center gap-2"
                        style={{ textDecoration: 'none' }}
                    >
                        View Appointments
                    </Link>
                </div>

                {/* Clinic name footer */}
                <p
                    className="text-xs mt-8"
                    style={{ color: 'rgba(44,44,44,0.3)', fontFamily: 'var(--font-mono)' }}
                >
                    Dr. Shetty&apos;s Ayur Clinic
                </p>
            </div>
        </div>
    )
}
