'use client'
import { useState, useCallback, createContext, useContext } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type ToastType = 'success' | 'error' | 'warning'

interface ToastItem {
    id: string
    type: ToastType
    message: string
}

interface ToastContextValue {
    toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => { } })

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const toast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).slice(2)
        setToasts(prev => [...prev, { id, type, message }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
    }, [])

    const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

    const iconMap = { success: CheckCircle, error: XCircle, warning: AlertTriangle }
    const styleMap: Record<ToastType, { bg: string; border: string }> = {
        success: { bg: 'var(--color-forest-700)', border: 'var(--color-forest-500)' },
        error: { bg: '#C0392B', border: '#a93226' },
        warning: { bg: 'var(--color-gold-500)', border: 'var(--color-gold-600)' },
    }

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 no-print pointer-events-none">
                {toasts.map(t => {
                    const Icon = iconMap[t.type]
                    const style = styleMap[t.type]
                    return (
                        <div
                            key={t.id}
                            className="animate-slide-up pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl min-w-[280px]"
                            style={{ background: style.bg, boxShadow: 'var(--shadow-warm-lg)', border: `1px solid ${style.border}` }}
                        >
                            <Icon className="w-5 h-5 shrink-0 text-white" />
                            <p className="text-sm font-medium flex-1 text-white" style={{ fontFamily: 'var(--font-sans)' }}>{t.message}</p>
                            <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100 transition-opacity">
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    return useContext(ToastContext)
}
