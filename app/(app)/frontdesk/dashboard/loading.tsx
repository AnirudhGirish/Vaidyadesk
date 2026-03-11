import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
    return (
        <div className="animate-fade-in">
            {/* Welcome */}
            <div className="mb-6 space-y-1">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-4 w-40" />
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card p-5 space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>
            {/* Queue section */}
            <div className="grid lg:grid-cols-2 gap-5">
                <div className="card overflow-hidden">
                    <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-warm-200)' }}>
                        <Skeleton className="h-5 w-28" />
                    </div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-warm-100)' }}>
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="card p-5 space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                    <div className="card p-5 space-y-3">
                        <Skeleton className="h-5 w-28" />
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
