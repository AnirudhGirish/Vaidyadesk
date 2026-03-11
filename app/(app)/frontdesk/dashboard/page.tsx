import Link from 'next/link'
import { Users, CheckCircle, IndianRupee, Plus, CalendarPlus } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'

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

function formatCurrency(amount: number) {
    return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(amount))
}

function formatDate(date: Date) {
    return date.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
}

function getStatusBadge(status: string): { variant: 'gold' | 'green' | 'gray' | 'red'; label: string } {
    const map: Record<string, { variant: 'gold' | 'green' | 'gray' | 'red'; label: string }> = {
        waiting: { variant: 'gray', label: 'Waiting' },
        with_doctor: { variant: 'gold', label: 'With Doctor' },
        completed: { variant: 'green', label: 'Completed' },
        cancelled: { variant: 'red', label: 'Cancelled' },
    }
    return map[status] ?? { variant: 'gray', label: status }
}

export default async function FrontdeskDashboard() {
    const today = new Date().toISOString().split('T')[0]

    const [queue, bills] = await Promise.all([
        fetchAPI('/api/queue'),
        fetchAPI(`/api/bills?from_date=${today}&to_date=${today}&per_page=5`),
    ])

    const queueItems: Array<{
        id: string; token: number; status: string;
        chief_complaint?: string; created_at: string;
        patients?: { full_name: string; uhid: string }
    }> = Array.isArray(queue) ? queue.filter((v: { status: string }) =>
        v.status === 'waiting' || v.status === 'with_doctor'
    ) : []

    const recentBills: Array<{
        id: string; bill_number: string; total_amount: number;
        payment_status: string;
        patients?: { full_name: string }
    }> = Array.isArray(bills) ? bills : []

    const totalQueue = queueItems.length
    const checkedIn = queueItems.filter(v => v.status === 'completed').length
    const collection = recentBills.reduce((sum, b) => {
        if (b.payment_status === 'paid' || b.payment_status === 'partial') return sum + b.total_amount
        return sum
    }, 0)

    const paymentBadge = (status: string): 'green' | 'gold' | 'red' | 'gray' => {
        const m: Record<string, 'green' | 'gold' | 'red' | 'gray'> = {
            paid: 'green', partial: 'gold', due: 'red', advance: 'blue' as 'green'
        }
        return m[status] ?? 'gray'
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                    {formatDate(new Date())}
                </p>
                <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                    Front Desk Dashboard
                </h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard label="Queue Today" value={totalQueue} icon={Users} accent="green" />
                <StatCard label="Checked In" value={checkedIn} icon={CheckCircle} accent="green" />
                <StatCard label="Today's Collection" value={formatCurrency(collection)} icon={IndianRupee} accent="gold" />
            </div>

            {/* Quick actions */}
            <div className="flex gap-3 mb-8 flex-wrap">
                <Link
                    href="/patients/new"
                    className="btn-primary flex items-center gap-2"
                    style={{ textDecoration: 'none' }}
                >
                    <Plus className="w-4 h-4" /> Register Patient
                </Link>
                <Link
                    href="/billing/new"
                    className="btn-gold flex items-center gap-2"
                    style={{ textDecoration: 'none' }}
                >
                    <Plus className="w-4 h-4" /> Create Bill
                </Link>
                <Link
                    href="/appointments"
                    className="btn-secondary flex items-center gap-2"
                    style={{ textDecoration: 'none' }}
                >
                    <CalendarPlus className="w-4 h-4" /> Appointment
                </Link>
            </div>

            {/* Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Queue — 2/3 */}
                <div className="lg:col-span-2 card overflow-hidden">
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: '1px solid var(--color-warm-200)' }}
                    >
                        <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--color-forest-700)' }}>
                            Live Queue
                        </h2>
                        <Link
                            href="/frontdesk/queue"
                            className="text-xs font-medium"
                            style={{ color: 'var(--color-gold-500)', textDecoration: 'none' }}
                        >
                            Manage →
                        </Link>
                    </div>

                    {queueItems.length === 0 ? (
                        <div className="py-12 text-center">
                            <Users className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-warm-300)' }} />
                            <p className="text-sm" style={{ color: 'rgba(44,44,44,0.45)' }}>
                                Queue is empty today
                            </p>
                        </div>
                    ) : (
                        <div>
                            {queueItems.slice(0, 8).map((item, idx) => {
                                const { variant, label } = getStatusBadge(item.status)
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 px-6 py-3 transition-colors"
                                        style={{ borderBottom: idx < Math.min(queueItems.length, 8) - 1 ? '1px solid var(--color-warm-100)' : 'none' }}
                                    >
                                        <span
                                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-semibold text-sm"
                                            style={{ background: 'var(--color-forest-50)', color: 'var(--color-forest-700)', fontFamily: 'var(--font-mono)' }}
                                        >
                                            {String(item.token ?? 0).padStart(2, '0')}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate" style={{ color: 'var(--color-charcoal)' }}>
                                                {item.patients?.full_name ?? 'Unknown'}
                                            </p>
                                            <p className="text-xs" style={{ color: 'rgba(44,44,44,0.45)' }}>
                                                {item.patients?.uhid && <span className="uhid mr-2">{item.patients.uhid}</span>}
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

                {/* Recent Bills — 1/3 */}
                <div className="card overflow-hidden">
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: '1px solid var(--color-warm-200)' }}
                    >
                        <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--color-forest-700)' }}>
                            Recent Bills
                        </h2>
                        <Link
                            href="/billing"
                            className="text-xs font-medium"
                            style={{ color: 'var(--color-gold-500)', textDecoration: 'none' }}
                        >
                            View all →
                        </Link>
                    </div>
                    {recentBills.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm" style={{ color: 'rgba(44,44,44,0.4)' }}>No bills today</p>
                        </div>
                    ) : (
                        <div>
                            {recentBills.map((bill, idx) => (
                                <Link
                                    key={bill.id}
                                    href={`/billing/${bill.id}`}
                                    className="flex flex-col gap-1 px-5 py-3 transition-colors hover-bg-warm"
                                    style={{
                                        borderBottom: idx < recentBills.length - 1 ? '1px solid var(--color-warm-100)' : 'none',
                                        textDecoration: 'none',
                                    }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(44,44,44,0.6)' }}>
                                            {bill.bill_number}
                                        </span>
                                        <Badge variant={paymentBadge(bill.payment_status)}>
                                            {bill.payment_status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium truncate" style={{ color: 'var(--color-charcoal)' }}>
                                            {bill.patients?.full_name ?? '—'}
                                        </span>
                                        <span className="text-sm font-semibold shrink-0" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-700)' }}>
                                            ₹{bill.total_amount}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
