import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

async function fetchAppointments(params: URLSearchParams) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/appointments?${params}`, {
        headers: { Cookie: cookieHeader }, cache: 'no-store',
    })
    if (!res.ok) return { appointments: [], total: 0 }
    const json = await res.json()
    return { appointments: json.data ?? [], total: json.meta?.total ?? 0 }
}

function statusBadge(s: string): 'green' | 'gold' | 'gray' | 'red' {
    const m: Record<string, 'green' | 'gold' | 'gray' | 'red'> = {
        scheduled: 'gold', confirmed: 'green', cancelled: 'red', completed: 'gray', no_show: 'red',
    }
    return m[s] ?? 'gray'
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

interface Appt {
    id: string; appointment_date: string; appointment_time: string;
    status: string; reason?: string; notes?: string
    patients?: { full_name: string; uhid: string }
}

interface PageProps {
    searchParams: Promise<{ date?: string; status?: string; page?: string }>
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
    const sp = await searchParams
    const page = parseInt(sp.page ?? '1')
    const today = new Date().toISOString().split('T')[0]

    const params = new URLSearchParams({ per_page: '25', page: String(page) })
    if (sp.date) params.set('date', sp.date)
    else params.set('from_date', today)
    if (sp.status) params.set('status', sp.status)

    const { appointments, total } = await fetchAppointments(params)

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Appointments"
                subtitle={`${total} appointments`}
                action={
                    <Link href="/appointments/new" style={{ textDecoration: 'none' }}>
                        <Button variant="gold" icon={<Plus className="w-4 h-4" />}>New Appointment</Button>
                    </Link>
                }
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {['today', 'tomorrow', 'all'].map(period => {
                    const d = period === 'today' ? today : period === 'tomorrow' ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : undefined
                    const label = period.charAt(0).toUpperCase() + period.slice(1)
                    const isActive = period === 'today' ? !sp.date && !sp.status : period === 'all' ? !!sp.status || !!sp.date : sp.date === d
                    return (
                        <Link
                            key={period}
                            href={`/appointments${d ? `?date=${d}` : ''}`}
                            className="px-4 py-1.5 rounded-full text-sm font-medium"
                            style={{
                                background: isActive && period === 'today' ? 'var(--color-forest-700)' : 'white',
                                color: isActive && period === 'today' ? 'white' : 'rgba(44,44,44,0.6)',
                                border: '1px solid var(--color-warm-200)', textDecoration: 'none',
                            }}
                        >
                            {label}
                        </Link>
                    )
                })}
                {['scheduled', 'confirmed', 'cancelled'].map(status => (
                    <Link
                        key={status}
                        href={`/appointments?status=${status}`}
                        className="px-4 py-1.5 rounded-full text-sm font-medium capitalize"
                        style={{
                            background: sp.status === status ? 'var(--color-forest-700)' : 'white',
                            color: sp.status === status ? 'white' : 'rgba(44,44,44,0.6)',
                            border: '1px solid var(--color-warm-200)', textDecoration: 'none',
                        }}
                    >
                        {status}
                    </Link>
                ))}
            </div>

            {appointments.length === 0 ? (
                <div className="card">
                    <EmptyState
                        icon={CalendarDays}
                        title="No appointments found"
                        description="Schedule an appointment for a patient."
                        action={
                            <Link href="/appointments/new" style={{ textDecoration: 'none' }}>
                                <Button variant="gold" icon={<Plus className="w-4 h-4" />}>New Appointment</Button>
                            </Link>
                        }
                    />
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: 'var(--color-warm-50)', borderBottom: '1px solid var(--color-warm-200)' }}>
                                {['Date & Time', 'Patient', 'Reason', 'Status', ''].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(44,44,44,0.5)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(appointments as Appt[]).map((appt, idx) => (
                                <tr key={appt.id} style={{ borderBottom: idx < appointments.length - 1 ? '1px solid var(--color-warm-100)' : 'none' }}>
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-sm">{formatDate(appt.appointment_date)}</p>
                                        <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-mono)' }}>
                                            {appt.appointment_time?.slice(0, 5)}
                                        </p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-sm">{appt.patients?.full_name ?? '—'}</p>
                                        {appt.patients?.uhid && <span className="uhid">{appt.patients.uhid}</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-sm max-w-[180px]" style={{ color: 'rgba(44,44,44,0.65)' }}>
                                        <span className="block truncate">{appt.reason ?? '—'}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <Badge variant={statusBadge(appt.status)} className="capitalize">
                                            {appt.status.replace('_', ' ')}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <Link href={`/appointments/${appt.id}`} className="text-xs font-medium" style={{ color: 'var(--color-gold-500)', textDecoration: 'none' }}>
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
