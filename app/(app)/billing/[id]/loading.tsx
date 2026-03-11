import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
    return (
        <div className="animate-fade-in max-w-3xl">
            {/* Back + actions */}
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            {/* Bill card */}
            <div className="card overflow-hidden">
                {/* Header band */}
                <div className="px-7 py-6" style={{ background: 'var(--color-forest-700)' }}>
                    <div className="flex justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-20 opacity-40" />
                            <Skeleton className="h-7 w-48 opacity-40" />
                            <Skeleton className="h-3 w-64 opacity-30" />
                        </div>
                        <div className="space-y-2 text-right">
                            <Skeleton className="h-5 w-32 opacity-40" />
                            <Skeleton className="h-3 w-24 opacity-30" />
                        </div>
                    </div>
                </div>
                {/* Patient info */}
                <div className="px-7 py-5" style={{ borderBottom: '1px solid var(--color-warm-200)', background: 'var(--color-warm-50)' }}>
                    <div className="flex justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                </div>
                {/* Items */}
                <div className="px-7 py-5 space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-4 w-10" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
                {/* Totals */}
                <div className="px-7 py-5" style={{ background: 'var(--color-warm-50)', borderTop: '1px solid var(--color-warm-200)' }}>
                    <div className="max-w-xs ml-auto space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-7 w-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}
