import { cn } from '@/lib/utils/cn'

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn('skeleton', className)} />
}

export function SkeletonCard() {
    return (
        <div className="card p-6 space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="card overflow-hidden">
            <div className="p-4" style={{ borderBottom: '1px solid var(--color-warm-300)' }}>
                <Skeleton className="h-5 w-1/4" />
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4" style={{ borderBottom: '1px solid var(--color-warm-100)' }}>
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            ))}
        </div>
    )
}
