export default function Loading() {
    return (
        <div className="animate-fade-in">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-8 w-64 rounded" />
                </div>
                <div className="skeleton h-10 w-32 rounded-xl" />
            </div>

            {/* 4-column stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="skeleton h-3 w-20 rounded" />
                            <div className="skeleton w-9 h-9 rounded-xl" />
                        </div>
                        <div className="skeleton h-7 w-16 rounded" />
                    </div>
                ))}
            </div>

            {/* Content area */}
            <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 card overflow-hidden">
                    <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-warm-200)' }}>
                        <div className="skeleton h-5 w-32 rounded" />
                    </div>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4 px-6 py-3.5" style={{ borderBottom: '1px solid var(--color-warm-100)' }}>
                            <div className="skeleton w-9 h-9 rounded-xl" />
                            <div className="flex-1 space-y-1.5">
                                <div className="skeleton h-3 w-36 rounded" />
                                <div className="skeleton h-2.5 w-24 rounded" />
                            </div>
                            <div className="skeleton h-5 w-16 rounded-full" />
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <div className="card p-5 space-y-3">
                        <div className="skeleton h-5 w-28 rounded" />
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton h-10 w-full rounded-lg" />
                        ))}
                    </div>
                    <div className="card p-5 space-y-3">
                        <div className="skeleton h-5 w-28 rounded" />
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="skeleton h-16 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
