'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { IndianRupee, Users, TrendingUp, Calendar } from 'lucide-react'

// ─── Dynamic import: recharts is excluded from the initial bundle ──────────────
const ReportsCharts = dynamic(
    () => import('@/components/reports/ReportsCharts'),
    {
        ssr: false,
        loading: () => <SkeletonCard />,
    }
)

function formatCurrency(n: number) {
    return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n))
}

interface ReportData {
    revenue_by_day: Array<{ date: string; total: number }>
    patient_count_by_month?: Array<{ month: string; count: number }>
    total_revenue: number
    total_patients: number
    total_bills: number
    avg_bill: number
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [range, setRange] = useState<'7d' | '30d' | 'mtd'>('30d')

    useEffect(() => {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]
        const from = range === '7d'
            ? new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
            : range === '30d'
                ? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
                : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

        fetch(`/api/reports?from_date=${from}&to_date=${today}`)
            .then(r => r.json())
            .then(j => { setData(j.data ?? null); setLoading(false) })
            .catch(() => setLoading(false))
    }, [range])

    const chartData = data?.revenue_by_day?.map(d => ({
        day: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue: d.total,
    })) ?? []

    return (
        <div className="animate-fade-in">
            <PageHeader title="Reports & Analytics" subtitle="Clinic performance overview" />

            {/* Range selector */}
            <div className="flex gap-2 mb-6">
                {(['7d', '30d', 'mtd'] as const).map(r => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                        style={{
                            background: range === r ? 'var(--color-forest-700)' : 'white',
                            color: range === r ? 'white' : 'rgba(44,44,44,0.6)',
                            border: '1px solid var(--color-warm-200)',
                            fontFamily: 'var(--font-sans)',
                        }}
                    >
                        {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'This Month'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card p-6 animate-pulse" style={{ height: 100 }} />
                    ))}
                </div>
            ) : data ? (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard label="Total Revenue" value={formatCurrency(data.total_revenue ?? 0)} icon={IndianRupee} accent="gold" />
                        <StatCard label="Patients" value={data.total_patients ?? 0} icon={Users} accent="green" />
                        <StatCard label="Bills Created" value={data.total_bills ?? 0} icon={Calendar} accent="green" />
                        <StatCard label="Avg. Bill" value={formatCurrency(data.avg_bill ?? 0)} icon={TrendingUp} accent="gold" />
                    </div>

                    {/* Dynamically loaded chart — recharts excluded from initial bundle */}
                    <ReportsCharts chartData={chartData} />
                </>
            ) : (
                <div className="card p-8 text-center">
                    <p className="text-sm" style={{ color: 'rgba(44,44,44,0.4)' }}>No report data available for this period.</p>
                </div>
            )}
        </div>
    )
}
