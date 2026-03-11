import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton'

export default function Loading() {
    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-36 rounded-lg" />
            </div>
            {/* Date filter tabs */}
            <div className="flex gap-2 mb-5">
                {['Today', 'Tomorrow', 'This Week'].map(t => (
                    <Skeleton key={t} className="h-9 w-24 rounded-lg" />
                ))}
            </div>
            <SkeletonTable rows={6} />
        </div>
    )
}
