export default function Loading() {
    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <div className="skeleton h-4 w-48 rounded" />
                    <div className="skeleton h-8 w-56 rounded" />
                </div>
                <div className="skeleton h-10 w-40 rounded-xl" />
            </div>
            {/* Search */}
            <div className="skeleton h-11 w-96 rounded-xl mb-6" />
            {/* Table */}
            <div className="card overflow-hidden">
                <div className="px-5 py-3" style={{ background: 'var(--color-warm-50)', borderBottom: '1px solid var(--color-warm-200)' }}>
                    <div className="flex gap-16">
                        {['UHID', 'Name', 'Age/Gender', 'Phone', 'Type'].map(h => (
                            <div key={h} className="skeleton h-3 w-16 rounded" />
                        ))}
                    </div>
                </div>
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex gap-4 px-5 py-4 items-center" style={{ borderBottom: '1px solid var(--color-warm-100)' }}>
                        <div className="skeleton h-3 w-28 rounded" />
                        <div className="skeleton h-3 w-32 rounded" />
                        <div className="skeleton h-3 w-12 rounded" />
                        <div className="skeleton h-3 w-24 rounded" />
                        <div className="skeleton h-5 w-16 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}
