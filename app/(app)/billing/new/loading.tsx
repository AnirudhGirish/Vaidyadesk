import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
    return (
        <div className="animate-fade-in max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-4 w-20" />
            </div>
            <div className="card p-6 space-y-5">
                <Skeleton className="h-7 w-40" />
                {/* Patient search */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                {/* Line items */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    {[1, 2].map(i => (
                        <div key={i} className="flex gap-2">
                            <Skeleton className="h-10 flex-1 rounded-lg" />
                            <Skeleton className="h-10 w-20 rounded-lg" />
                            <Skeleton className="h-10 w-28 rounded-lg" />
                        </div>
                    ))}
                </div>
                {/* Totals */}
                <div className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--color-warm-200)' }}>
                    <Skeleton className="h-4 w-48 ml-auto" />
                    <Skeleton className="h-6 w-40 ml-auto" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
            </div>
        </div>
    )
}
