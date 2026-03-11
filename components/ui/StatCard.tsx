import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StatCardProps {
    label: string
    value: string | number
    icon: LucideIcon
    trend?: string
    trendUp?: boolean
    accent?: 'green' | 'gold'
}

export function StatCard({ label, value, icon: Icon, trend, trendUp, accent = 'green' }: StatCardProps) {
    return (
        <div
            className="card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-warm-lg)]"
        >
            <div className="flex items-start justify-between mb-4">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: accent === 'green' ? 'var(--color-forest-50)' : 'rgba(212, 168, 67, 0.15)' }}
                >
                    <Icon
                        className="w-5 h-5"
                        style={{ color: accent === 'green' ? 'var(--color-forest-700)' : 'var(--color-gold-500)' }}
                    />
                </div>
                {trend && (
                    <span
                        className="text-xs font-medium"
                        style={{ color: trendUp ? 'var(--color-forest-500)' : '#C0392B', fontFamily: 'var(--font-sans)' }}
                    >
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                )}
            </div>
            <p
                className="text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-charcoal)' }}
            >
                {value}
            </p>
            <p
                className="text-sm mt-1"
                style={{ color: 'rgba(44,44,44,0.6)', fontFamily: 'var(--font-sans)' }}
            >
                {label}
            </p>
        </div>
    )
}
