import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function Loading() {
    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-4 w-52" />
                </div>
                <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
            {/* Filter tabs */}
            <div className="flex gap-2 mb-5">
                {['All', 'Active', 'Completed', 'Cancelled'].map(t => (
                    <Skeleton key={t} className="h-9 w-24 rounded-lg" />
                ))}
            </div>
            <div className="grid gap-4">
                {[1, 2, 3, 4].map(i => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    )
}
