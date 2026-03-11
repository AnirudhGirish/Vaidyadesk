'use client'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'secondary' | 'gold' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    size?: Size
    loading?: boolean
    icon?: React.ReactNode
}

const variantClass: Record<Variant, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    gold: 'btn-gold',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
}

const sizeClass: Record<Size, string> = {
    sm: '!px-3 !py-1.5 !text-xs',
    md: '',
    lg: '!px-6 !py-3 !text-base',
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading,
    icon,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(variantClass[variant], sizeClass[size], className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
            {children}
        </button>
    )
}
