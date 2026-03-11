import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function Loading() {
    return (
        <div className="animate-fade-in">
            <div className="mb-6 space-y-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-4 w-56" />
            </div>
            <div className="space-y-5">
                {/* Clinic info section */}
                <div className="card p-6 space-y-4">
                    <Skeleton className="h-5 w-40" />
                    <div className="grid md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="space-y-1">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    )
}
