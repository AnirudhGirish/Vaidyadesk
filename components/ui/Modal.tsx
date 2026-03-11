'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ModalProps {
    open: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        if (open) window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 animate-fade-in"
                style={{ background: 'rgba(13,31,22,0.5)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />
            <div
                className={cn('relative bg-white rounded-2xl w-full animate-slide-up', sizes[size])}
                style={{ boxShadow: 'var(--shadow-warm-xl)' }}
            >
                {title && (
                    <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--color-warm-300)' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-forest-700)' }}>
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg transition-colors"
                            style={{ background: 'transparent' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-warm-100)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <X className="w-5 h-5" style={{ color: 'rgba(44,44,44,0.6)' }} />
                        </button>
                    </div>
                )}
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}
