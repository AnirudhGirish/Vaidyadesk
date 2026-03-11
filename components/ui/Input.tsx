'use client'
import { cn } from '@/lib/utils/cn'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
    icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, icon, className, ...props }, ref) => (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-sm font-medium" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>
                    {label}
                    {props.required && <span style={{ color: 'var(--color-gold-500)' }} className="ml-0.5">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(44,44,44,0.4)' }}>
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        'input-base',
                        icon && 'pl-10',
                        error && '!border-red-400 focus:!shadow-[0_0_0_3px_rgba(220,38,38,0.15)]',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-red-600" style={{ fontFamily: 'var(--font-sans)' }}>{error}</p>}
            {hint && !error && <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>{hint}</p>}
        </div>
    )
)
Input.displayName = 'Input'
