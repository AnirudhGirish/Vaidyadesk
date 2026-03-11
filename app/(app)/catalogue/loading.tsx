import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-28 rounded-lg" />
                    <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-3 mb-5">
                {['Services', 'Medicines'].map(t => (
                    <Skeleton key={t} className="h-9 w-28 rounded-lg" />
                ))}
            </div>
            {/* Catalogue grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="card p-5 space-y-3">
                        <div className="flex justify-between">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex justify-between pt-1">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
