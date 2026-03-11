import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'green' | 'gold' | 'red' | 'gray' | 'blue' | 'orange'

const variantClass: Record<BadgeVariant, string> = {
    green: 'badge badge-green',
    gold: 'badge badge-gold',
    red: 'badge badge-red',
    gray: 'badge badge-gray',
    blue: 'badge badge-blue',
    orange: 'badge badge-orange',
}

export function Badge({
    variant = 'gray',
    children,
    className,
}: {
    variant?: BadgeVariant
    children: React.ReactNode
    className?: string
}) {
    return (
        <span className={cn(variantClass[variant], className)}>{children}</span>
    )
}
