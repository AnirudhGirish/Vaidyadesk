'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, Clock, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface Patient { id: string; full_name: string; uhid: string; phone: string }
interface Appointment {
    id: string; appointment_date: string; appointment_time: string;
    duration_minutes: number; status: string; notes?: string;
    patients?: Patient
}

function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function statusBadge(s: string): 'green' | 'gold' | 'gray' | 'red' {
    const m: Record<string, 'green' | 'gold' | 'gray' | 'red'> = {
        scheduled: 'gold', confirmed: 'green', arrived: 'green',
        completed: 'gray', cancelled: 'red', no_show: 'red',
    }
    return m[s] ?? 'gray'
}

const STATUS_OPTIONS = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'arrived', label: 'Arrived' },
    { value: 'completed', label: 'Completed' },
    { value: 'no_show', label: 'No Show' },
    { value: 'cancelled', label: 'Cancelled' },
]

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { toast } = useToast()
    const [appt, setAppt] = useState<Appointment | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [showStatusMenu, setShowStatusMenu] = useState(false)
    const [id, setId] = useState('')

    useEffect(() => {
        params.then(p => {
            setId(p.id)
            fetch(`/api/appointments/${p.id}`)
                .then(r => r.json())
                .then(j => {
                    if (j.success) setAppt(j.data)
                    else router.push('/appointments')
                })
                .finally(() => setLoading(false))
        })
    }, [params, router])

    const updateStatus = async (status: string) => {
        if (!id) return
        setUpdating(true)
        setShowStatusMenu(false)
        const res = await fetch(`/api/appointments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        })
        const json = await res.json()
        setUpdating(false)
        if (res.ok) {
            setAppt(prev => prev ? { ...prev, status } : prev)
            toast('success', `Status updated to ${status}`)
        } else {
            toast('error', json.error?.message ?? 'Failed to update')
        }
    }

    const cancelAppt = async () => {
        if (!id || !confirm('Cancel this appointment?')) return
        setUpdating(true)
        await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
        setUpdating(false)
        toast('success', 'Appointment cancelled')
        router.push('/appointments')
    }

    if (loading) return (
        <div className="animate-fade-in">
            <div className="h-8 w-48 rounded-lg animate-pulse mb-6" style={{ background: 'var(--color-warm-200)' }} />
            <div className="card p-8 animate-pulse" style={{ height: 300 }} />
        </div>
    )

    if (!appt) return null

    const isClosed = appt.status === 'cancelled' || appt.status === 'completed' || appt.status === 'no_show'

    return (
        <div className="animate-fade-in max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/appointments" style={{ textDecoration: 'none' }}>
                    <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
                </Link>
                <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                    Appointment
                </h1>
            </div>

            {/* Patient Card */}
            <div className="card p-6 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-forest-50)' }}>
                            <User className="w-6 h-6" style={{ color: 'var(--color-forest-700)' }} />
                        </div>
                        <div>
                            <p className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-charcoal)' }}>
                                {appt.patients?.full_name ?? 'Unknown Patient'}
                            </p>
                            <span className="uhid">{appt.patients?.uhid}</span>
                            {appt.patients?.phone && (
                                <p className="text-sm mt-0.5" style={{ color: 'rgba(44,44,44,0.5)' }}>{appt.patients.phone}</p>
                            )}
                        </div>
                    </div>
                    {appt.patients?.id && (
                        <Link href={`/patients/${appt.patients.id}`} style={{ textDecoration: 'none' }}>
                            <Button variant="secondary" size="sm">View Patient</Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Appointment Details */}
            <div className="card p-6 mb-4">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 shrink-0" style={{ color: 'var(--color-forest-500)' }} />
                        <div>
                            <p className="text-xs uppercase tracking-wider font-medium mb-0.5" style={{ color: 'rgba(44,44,44,0.5)' }}>Date</p>
                            <p className="font-medium">{formatDate(appt.appointment_date)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 shrink-0" style={{ color: 'var(--color-forest-500)' }} />
                        <div>
                            <p className="text-xs uppercase tracking-wider font-medium mb-0.5" style={{ color: 'rgba(44,44,44,0.5)' }}>Time</p>
                            <p className="font-medium">
                                {appt.appointment_time?.substring(0, 5) ?? '—'}
                                <span className="text-sm ml-2" style={{ color: 'rgba(44,44,44,0.5)' }}>({appt.duration_minutes} min)</span>
                            </p>
                        </div>
                    </div>
                </div>
                {appt.notes && (
                    <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--color-warm-200)' }}>
                        <p className="text-xs uppercase tracking-wider font-medium mb-1.5" style={{ color: 'rgba(44,44,44,0.5)' }}>Notes</p>
                        <p className="text-sm" style={{ color: 'rgba(44,44,44,0.7)' }}>{appt.notes}</p>
                    </div>
                )}
            </div>

            {/* Status + Actions */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-xs uppercase tracking-wider font-medium mb-2" style={{ color: 'rgba(44,44,44,0.5)' }}>Current Status</p>
                        <Badge variant={statusBadge(appt.status)}>
                            {appt.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </Badge>
                    </div>
                </div>

                {!isClosed && (
                    <div className="flex gap-3 flex-wrap">
                        {/* Status dropdown */}
                        <div className="relative">
                            <Button
                                variant="primary"
                                size="sm"
                                loading={updating}
                                icon={<ChevronDown className="w-3.5 h-3.5" />}
                                onClick={() => setShowStatusMenu(v => !v)}
                            >
                                Change Status
                            </Button>
                            {showStatusMenu && (
                                <div className="absolute top-full left-0 mt-1 z-40 rounded-xl overflow-hidden shadow-lg"
                                    style={{ background: 'white', border: '1px solid var(--color-warm-200)', minWidth: 160 }}>
                                    {STATUS_OPTIONS.filter(s => s.value !== appt.status).map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateStatus(opt.value)}
                                            className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--color-charcoal)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-warm-50)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {appt.patients?.id && (
                            <Link href={`/billing/new?patient_id=${appt.patients.id}`} style={{ textDecoration: 'none' }}>
                                <Button variant="gold" size="sm" icon={<CheckCircle className="w-3.5 h-3.5" />}>
                                    Create Bill
                                </Button>
                            </Link>
                        )}

                        <Button variant="secondary" size="sm" loading={updating} onClick={cancelAppt} icon={<XCircle className="w-3.5 h-3.5" />}>
                            Cancel Appointment
                        </Button>
                    </div>
                )}

                {isClosed && (
                    <p className="text-sm" style={{ color: 'rgba(44,44,44,0.5)' }}>
                        This appointment is closed ({appt.status}).
                    </p>
                )}
            </div>
        </div>
    )
}
