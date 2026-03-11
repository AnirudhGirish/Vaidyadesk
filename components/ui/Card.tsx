import { cn } from '@/lib/utils/cn'

interface CardProps {
    children: React.ReactNode
    className?: string
    hover?: boolean
    onClick?: () => void
}

export function Card({ children, className, hover, onClick }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'card p-6',
                (hover || onClick) && 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-warm-lg)]',
                className
            )}
        >
            {children}
        </div>
    )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('mb-4 pb-4', className)} style={{ borderBottom: '1px solid var(--color-warm-300)' }}>
            {children}
        </div>
    )
}
