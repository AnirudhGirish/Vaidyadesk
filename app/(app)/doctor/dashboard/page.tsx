import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    UserRound, Users, IndianRupee, AlertCircle,
    Plus, CalendarPlus, FileText
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'

// Fetch helpers
async function fetchAPI(path: string) {
    try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
        const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const res = await fetch(`${base}${path}`, {
            headers: { Cookie: cookieHeader },
            cache: 'no-store',
        })
        if (!res.ok) return null
        const json = await res.json()
        return json.success ? json.data : null
    } catch {
        return null
    }
}

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
}

function formatDate(date: Date) {
    return date.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount)
}

function getStatusBadge(status: string) {
    const map: Record<string, 'gold' | 'green' | 'gray' | 'red'> = {
        waiting: 'gray',
        with_doctor: 'gold',
        completed: 'green',
        cancelled: 'red',
    }
    const labels: Record<string, string> = {
        waiting: 'Waiting',
        with_doctor: 'With Doctor',
        completed: 'Completed',
        cancelled: 'Cancelled',
    }
    return { variant: map[status] ?? 'gray', label: labels[status] ?? status }
}

function calcAge(dob: string) {
    const birth = new Date(dob)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
    return age
}

export default async function DoctorDashboard() {
    const [queue, patientsMeta, bills] = await Promise.all([
        fetchAPI('/api/queue'),
        fetchAPI('/api/patients?per_page=1'),
        fetchAPI('/api/bills?from_date=' + new Date().toISOString().split('T')[0] + '&to_date=' + new Date().toISOString().split('T')[0] + '&per_page=100'),
    ])

    const today = new Date().toISOString().split('T')[0]

    // Compute stats
    const queueItems: Array<{
        id: string; token: number; status: string;
        chief_complaint?: string; visit_type: string;
        patients?: { full_name: string; uhid: string; date_of_birth?: string }
    }> = Array.isArray(queue) ? queue : []

    const totalToday = queueItems.length
    const inQueue = queueItems.filter(v => v.status === 'waiting' || v.status === 'with_doctor').length
    const totalPatients = patientsMeta ?? 0

    const billList: Array<{ total_amount: number; payment_status: string }> = Array.isArray(bills) ? bills : []
    const todayCollection = billList.reduce((sum, b) => {
        if (b.payment_status === 'paid' || b.payment_status === 'partial') return sum + (b.total_amount || 0)
        return sum
    }, 0)
    const pendingDues = billList.filter(b => b.payment_status === 'due' || b.payment_status === 'partial').length

    // Only show active patients in queue preview (hide completed/cancelled)
    const recentQueue = queueItems
        .filter(q => q.status === 'waiting' || q.status === 'with_doctor')
        .slice(0, 5)

    return (
        <div className="animate-fade-in">
            {/* Greeting */}
            <div className="mb-8">
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                    {formatDate(new Date())}
                </p>
                <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                    {getGreeting()}, Doctor
                </h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(44,44,44,0.55)', fontFamily: 'var(--font-sans)' }}>
                    Here&apos;s your clinic overview for today.
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Today's Patients"
                    value={totalToday}
                    icon={UserRound}
                    accent="green"
                />
                <StatCard
                    label="In Queue"
                    value={inQueue}
                    icon={Users}
                    accent="green"
                />
                <StatCard
                    label="Today's Collection"
                    value={formatCurrency(todayCollection)}
                    icon={IndianRupee}
                    accent="gold"
                />
                <StatCard
                    label="Pending Dues"
                    value={pendingDues}
                    icon={AlertCircle}
                    accent="gold"
                />
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-5 gap-6">
                {/* Queue Preview — 3/5 */}
                <div className="lg:col-span-3 card overflow-hidden">
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: '1px solid var(--color-warm-200)' }}
                    >
                        <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--color-forest-700)' }}>
                            Today&apos;s Queue
                        </h2>
                        <Link
                            href="/doctor/queue"
                            className="text-xs font-medium flex items-center gap-1 transition-colors"
                            style={{ color: 'var(--color-gold-500)', textDecoration: 'none', fontFamily: 'var(--font-sans)' }}
                        >
                            View all →
                        </Link>
                    </div>

                    {recentQueue.length === 0 ? (
                        <div className="py-12 text-center">
                            <Users className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-warm-300)' }} />
                            <p className="text-sm" style={{ color: 'rgba(44,44,44,0.45)', fontFamily: 'var(--font-sans)' }}>
                                No patients in queue yet
                            </p>
                        </div>
                    ) : (
                        <div>
                            {recentQueue.map((item, idx) => {
                                const { variant, label } = getStatusBadge(item.status)
                                const patient = item.patients
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 px-6 py-3.5 transition-colors"
                                        style={{
                                            borderBottom: idx < recentQueue.length - 1 ? '1px solid var(--color-warm-100)' : 'none',
                                        }}
                                    >
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-semibold text-sm"
                                            style={{
                                                background: 'var(--color-forest-50)',
                                                color: 'var(--color-forest-700)',
                                                fontFamily: 'var(--font-mono)',
                                            }}
                                        >
                                            {String(item.token ?? 0).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-sans)' }}>
                                                {patient?.full_name ?? 'Unknown'}
                                            </p>
                                            <p className="text-xs truncate" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                                                {patient?.uhid && <span className="uhid mr-2">{patient.uhid}</span>}
                                                {item.chief_complaint ?? '—'}
                                            </p>
                                        </div>
                                        <Badge variant={variant}>{label}</Badge>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column — 2/5 */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Quick Actions */}
                    <div className="card p-5">
                        <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--color-forest-700)' }}>
                            Quick Actions
                        </h3>
                        <div className="space-y-2">
                            <Link
                                href="/patients/new"
                                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                                style={{
                                    background: 'var(--color-forest-50)',
                                    color: 'var(--color-forest-700)',
                                    textDecoration: 'none',
                                    fontFamily: 'var(--font-sans)',
                                    border: '1px solid var(--color-forest-100)',
                                }}
                            >
                                <Plus className="w-4 h-4" />
                                Register Patient
                            </Link>
                            <Link
                                href="/appointments"
                                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                                style={{
                                    background: 'rgba(212,168,67,0.08)',
                                    color: 'var(--color-gold-600)',
                                    textDecoration: 'none',
                                    fontFamily: 'var(--font-sans)',
                                    border: '1px solid rgba(212,168,67,0.2)',
                                }}
                            >
                                <CalendarPlus className="w-4 h-4" />
                                New Appointment
                            </Link>
                            <Link
                                href="/billing/new"
                                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                                style={{
                                    background: 'var(--color-warm-100)',
                                    color: 'var(--color-charcoal)',
                                    textDecoration: 'none',
                                    fontFamily: 'var(--font-sans)',
                                    border: '1px solid var(--color-warm-200)',
                                }}
                            >
                                <FileText className="w-4 h-4" />
                                Create Bill
                            </Link>
                        </div>
                    </div>

                    {/* Today overview */}
                    <div className="card p-5">
                        <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--color-forest-700)' }}>
                            Queue Status
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Waiting', value: queueItems.filter(q => q.status === 'waiting').length, color: 'var(--color-warm-300)' },
                                { label: 'With Doctor', value: queueItems.filter(q => q.status === 'with_doctor').length, color: 'var(--color-gold-500)' },
                                { label: 'Completed', value: queueItems.filter(q => q.status === 'completed').length, color: 'var(--color-forest-500)' },
                                { label: 'Cancelled', value: queueItems.filter(q => q.status === 'cancelled').length, color: '#C0392B' },
                            ].map(({ label, value, color }) => (
                                <div
                                    key={label}
                                    className="p-3 rounded-xl text-center"
                                    style={{ background: 'var(--color-warm-50)', border: '1px solid var(--color-warm-200)' }}
                                >
                                    <p
                                        className="text-2xl font-semibold"
                                        style={{ fontFamily: 'var(--font-display)', color }}
                                    >
                                        {value}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
