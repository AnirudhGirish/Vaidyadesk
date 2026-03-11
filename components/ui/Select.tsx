'use client'
import { cn } from '@/lib/utils/cn'
import { ChevronDown } from 'lucide-react'
import { forwardRef } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    options: { value: string; label: string }[]
    placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, placeholder, className, ...props }, ref) => (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-sm font-medium" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>
                    {label}
                    {props.required && <span style={{ color: 'var(--color-gold-500)' }} className="ml-0.5">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    className={cn('input-base appearance-none pr-10', error && '!border-red-400', className)}
                    {...props}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(44,44,44,0.4)' }} />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    )
)
Select.displayName = 'Select'
