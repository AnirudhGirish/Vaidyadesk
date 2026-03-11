import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
    return (
        <div className="animate-fade-in">
            <div className="mb-6 space-y-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-4 w-48" />
            </div>
            {/* Chart placeholders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card p-5 space-y-3">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                ))}
            </div>
            {/* Revenue chart */}
            <div className="card p-6 mb-6">
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
            {/* Two column charts */}
            <div className="grid md:grid-cols-2 gap-5">
                {[1, 2].map(i => (
                    <div key={i} className="card p-6 space-y-3">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-36 w-full rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    )
}
