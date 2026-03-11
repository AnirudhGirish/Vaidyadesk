import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function Loading() {
    return (
        <div className="animate-fade-in">
            {/* Back link + actions */}
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
            </div>
            {/* Patient header card */}
            <div className="card p-6 mb-6 flex items-start gap-5">
                <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-3 mt-3">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-28 rounded-full" />
                    </div>
                </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-4 mb-6" style={{ borderBottom: '2px solid var(--color-warm-200)' }}>
                {['Overview', 'Billing', 'Treatments'].map(t => (
                    <Skeleton key={t} className="h-8 w-20 mb-[-2px]" />
                ))}
            </div>
            {/* Tab content skeleton */}
            <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    )
}
