import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description?: string
    action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--color-warm-100)' }}
            >
                <Icon className="w-8 h-8" style={{ color: 'var(--color-warm-400)' }} />
            </div>
            <h3
                className="text-xl font-semibold mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'rgba(44,44,44,0.7)' }}
            >
                {title}
            </h3>
            {description && (
                <p className="text-sm max-w-xs mb-6" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                    {description}
                </p>
            )}
            {action}
        </div>
    )
}
