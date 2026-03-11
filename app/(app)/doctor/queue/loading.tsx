import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
    return (
        <div className="animate-fade-in">
            <div className="mb-6 space-y-1">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-4 w-40" />
            </div>
            {/* Token input */}
            <div className="card p-5 mb-5 flex gap-3">
                <Skeleton className="h-10 flex-1 rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
            {/* Queue list */}
            <div className="card overflow-hidden">
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-warm-200)' }}>
                    <Skeleton className="h-5 w-24" />
                </div>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="px-5 py-4 flex items-center gap-4" style={{ borderBottom: '1px solid var(--color-warm-100)' }}>
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    )
}
