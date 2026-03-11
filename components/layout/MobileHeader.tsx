import { Leaf } from 'lucide-react'

export function MobileHeader({ title }: { title?: string }) {
    return (
        <header
            className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 no-print"
            style={{ background: 'var(--color-forest-700)', boxShadow: 'var(--shadow-warm)' }}
        >
            <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(184,146,42,0.25)' }}
            >
                <Leaf className="w-4 h-4" style={{ color: 'var(--color-gold-400)' }} />
            </div>
            <div>
                <p
                    className="font-semibold leading-tight text-white"
                    style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}
                >
                    {title ?? "Dr. Shetty's Ayur Clinic"}
                </p>
            </div>
        </header>
    )
}
