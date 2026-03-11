import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton'

export default function Loading() {
    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
            {/* Filter bar */}
            <div className="flex gap-3 mb-5">
                <Skeleton className="h-10 w-40 rounded-lg" />
                <Skeleton className="h-10 w-40 rounded-lg" />
                <Skeleton className="h-10 flex-1 rounded-lg" />
            </div>
            <SkeletonTable rows={7} />
        </div>
    )
}
