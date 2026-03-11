'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { PrescriptionPrintButton } from '@/components/print/PrescriptionPrintButton'

interface Visit {
    id: string; visit_date: string; visit_type: string;
    chief_complaint?: string; status: string
}

interface Treatment {
    id: string; service_name: string; sessions_total: number;
    sessions_consumed: number; status: string; start_date: string
}

interface Bill {
    id: string; bill_number: string; bill_date: string;
    total_amount: number; payment_status: string
    bill_items?: Array<{ name: string }>
}

interface Props {
    patientId: string
    patient: { full_name: string }
    visits: Visit[]
    treatments: Treatment[]
    bills: Bill[]
    isDoctor: boolean
}

const tabs = ['Overview', 'Clinical', 'Billing', 'Treatments'] as const

function formatDate(d: string) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function visitStatusBadge(status: string): 'green' | 'gold' | 'gray' | 'red' {
    const m: Record<string, 'green' | 'gold' | 'gray' | 'red'> = {
        waiting: 'gray', with_doctor: 'gold', completed: 'green', cancelled: 'red'
    }
    return m[status] ?? 'gray'
}

function paymentBadge(status: string): 'green' | 'gold' | 'red' | 'gray' {
    const m: Record<string, 'green' | 'gold' | 'red' | 'gray'> = {
        paid: 'green', partial: 'gold', due: 'red', advance: 'blue' as 'green'
    }
    return m[status] ?? 'gray'
}

function treatmentStatusBadge(status: string): 'green' | 'gold' | 'gray' | 'red' {
    const m: Record<string, 'green' | 'gold' | 'gray' | 'red'> = {
        active: 'gold', completed: 'green', cancelled: 'red', paused: 'gray'
    }
    return m[status] ?? 'gray'
}

export default function PatientTabs({ patientId, patient, visits, treatments, bills, isDoctor }: Props) {
    const [active, setActive] = useState<typeof tabs[number]>('Overview')
    const { toast } = useToast()
    const [markingSession, setMarkingSession] = useState<string | null>(null)

    const visibleTabs = tabs.filter(t => t !== 'Clinical' || isDoctor)

    const handleMarkSession = async (treatmentId: string) => {
        setMarkingSession(treatmentId)
        const res = await fetch(`/api/treatments/${treatmentId}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        })
        const json = await res.json()
        setMarkingSession(null)
        if (res.ok) {
            toast('success', 'Session marked successfully')
            window.location.reload()
        } else {
            toast('error', json.message ?? 'Failed to mark session')
        }
    }

    return (
        <div>
            {/* Tab bar */}
            <div className="flex gap-0 mb-6" style={{ borderBottom: '2px solid var(--color-warm-200)' }}>
                {visibleTabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActive(tab)}
                        className="px-5 py-2.5 text-sm font-medium transition-all duration-200 relative"
                        style={{
                            color: active === tab ? 'var(--color-forest-700)' : 'rgba(44,44,44,0.5)',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            borderBottom: active === tab ? '2px solid var(--color-forest-700)' : '2px solid transparent',
                            marginBottom: -2,
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Overview */}
            {active === 'Overview' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-warm-200)' }}>
                            <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                                Visit History
                            </h3>
                        </div>
                        {visits.length === 0 ? (
                            <p className="p-6 text-sm" style={{ color: 'rgba(44,44,44,0.45)' }}>No visits recorded yet.</p>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr style={{ background: 'var(--color-warm-50)', borderBottom: '1px solid var(--color-warm-200)' }}>
                                        {['Date', 'Type', 'Chief Complaint', 'Status', ''].map(h => (
                                            <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visits.map((v, idx) => (
                                        <tr key={v.id} style={{ borderBottom: idx < visits.length - 1 ? '1px solid var(--color-warm-100)' : 'none' }}>
                                            <td className="px-5 py-3 text-sm" style={{ color: 'rgba(44,44,44,0.7)' }}>{formatDate(v.visit_date)}</td>
                                            <td className="px-5 py-3">
                                                <Badge variant="gray">{v.visit_type}</Badge>
                                            </td>
                                            <td className="px-5 py-3 text-sm" style={{ color: 'rgba(44,44,44,0.7)' }}>
                                                {v.chief_complaint ?? '—'}
                                            </td>
                                            <td className="px-5 py-3">
                                                <Badge variant={visitStatusBadge(v.status)}>{v.status.replace('_', ' ')}</Badge>
                                            </td>
                                            <td className="px-5 py-3">
                                                {isDoctor && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <Link href={`/visits/${v.id}`} className="text-xs" style={{ color: 'var(--color-gold-500)', textDecoration: 'none' }}>
                                                            <ExternalLink className="w-3.5 h-3.5 inline" /> View
                                                        </Link>
                                                        {v.status === 'completed' && (
                                                            <PrescriptionPrintButton
                                                                visitId={v.id}
                                                                visitDate={v.visit_date}
                                                                patientId={patientId}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Active treatments preview */}
                    {treatments.filter(t => t.status === 'active').length > 0 && (
                        <div className="card p-6">
                            <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                                Active Treatments
                            </h3>
                            <div className="space-y-3">
                                {treatments.filter(t => t.status === 'active').map(t => (
                                    <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'var(--color-warm-50)', border: '1px solid var(--color-warm-200)' }}>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{t.service_name}</p>
                                            <div className="flex items-center gap-1 mt-1.5">
                                                {Array.from({ length: t.sessions_total }).map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-sm"
                                                        style={{ color: i < t.sessions_consumed ? 'var(--color-forest-500)' : 'var(--color-warm-300)' }}
                                                    >
                                                        {i < t.sessions_consumed ? '●' : '○'}
                                                    </span>
                                                ))}
                                                <span className="text-xs ml-2" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                                    {t.sessions_consumed}/{t.sessions_total} sessions
                                                </span>
                                            </div>
                                        </div>
                                        <Badge variant="gold">Active</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Clinical — Doctor only */}
            {active === 'Clinical' && isDoctor && (
                <ClinicalTab patientId={patientId} />
            )}

            {/* Billing */}
            {active === 'Billing' && (
                <div className="card overflow-hidden animate-fade-in">
                    <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-warm-200)' }}>
                        <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                            Bills
                        </h3>
                        <Link href={`/billing/new?patient_id=${patientId}`} className="text-xs font-medium" style={{ color: 'var(--color-gold-500)', textDecoration: 'none' }}>
                            + New Bill
                        </Link>
                    </div>
                    {bills.length === 0 ? (
                        <p className="p-6 text-sm" style={{ color: 'rgba(44,44,44,0.45)' }}>No bills found.</p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: 'var(--color-warm-50)', borderBottom: '1px solid var(--color-warm-200)' }}>
                                    {['Bill No.', 'Date', 'Items', 'Total', 'Status'].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map((b, idx) => (
                                    <tr
                                        key={b.id}
                                        style={{ borderBottom: idx < bills.length - 1 ? '1px solid var(--color-warm-100)' : 'none', cursor: 'pointer' }}
                                        onClick={() => window.location.href = `/billing/${b.id}`}
                                    >
                                        <td className="px-5 py-3">
                                            <span className="uhid">{b.bill_number}</span>
                                        </td>
                                        <td className="px-5 py-3 text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>{formatDate(b.bill_date)}</td>
                                        <td className="px-5 py-3 text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                                            {b.bill_items?.slice(0, 2).map(i => i.name).join(', ') ?? '—'}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                                            ₹{b.total_amount}
                                        </td>
                                        <td className="px-5 py-3">
                                            <Badge variant={paymentBadge(b.payment_status)}>{b.payment_status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Treatments */}
            {active === 'Treatments' && (
                <div className="space-y-4 animate-fade-in">
                    {treatments.length === 0 ? (
                        <div className="card p-8 text-center">
                            <p className="text-sm" style={{ color: 'rgba(44,44,44,0.45)' }}>No treatment plans yet.</p>
                        </div>
                    ) : (
                        treatments.map(t => (
                            <div key={t.id} className="card p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-charcoal)' }}>
                                            {t.service_name}
                                        </h4>
                                        <p className="text-xs mt-0.5" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                            Started {formatDate(t.start_date)}
                                        </p>
                                    </div>
                                    <Badge variant={treatmentStatusBadge(t.status)}>
                                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                                    </Badge>
                                </div>

                                {/* Session dots */}
                                <div className="flex flex-wrap items-center gap-1 mb-3">
                                    {Array.from({ length: t.sessions_total }).map((_, i) => (
                                        <span
                                            key={i}
                                            className="text-base transition-colors"
                                            style={{ color: i < t.sessions_consumed ? 'var(--color-forest-500)' : 'var(--color-warm-300)' }}
                                        >
                                            {i < t.sessions_consumed ? '●' : '○'}
                                        </span>
                                    ))}
                                    <span className="ml-2 text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                        {t.sessions_consumed} of {t.sessions_total} sessions completed
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="rounded-full overflow-hidden h-1.5 mb-3" style={{ background: 'var(--color-warm-200)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(t.sessions_consumed / t.sessions_total) * 100}%`,
                                            background: t.status === 'completed' ? 'var(--color-forest-500)' : 'var(--color-gold-500)',
                                        }}
                                    />
                                </div>

                                {t.status === 'active' && t.sessions_consumed < t.sessions_total && (
                                    <button
                                        onClick={() => handleMarkSession(t.id)}
                                        disabled={markingSession === t.id}
                                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        {markingSession === t.id ? 'Marking...' : 'Mark Session'}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

// Clinical tab component — fetches its own data on demand
function ClinicalTab({ patientId }: { patientId: string }) {
    const [data, setData] = useState<Record<string, unknown> | null>(null)
    const [loading, setLoading] = useState(false)
    const [loaded, setLoaded] = useState(false)

    const load = async () => {
        if (loaded) return
        setLoading(true)
        const res = await fetch(`/api/patients/${patientId}/clinical`)
        if (res.ok) {
            const json = await res.json()
            setData(json.data)
        }
        setLoading(false)
        setLoaded(true)
    }

    // Auto-load when Clinical tab mounts
    if (!loaded && !loading) load()

    if (loading) {
        return (
            <div className="card p-8 text-center">
                <p className="text-sm" style={{ color: 'rgba(44,44,44,0.5)' }}>Loading clinical profile...</p>
            </div>
        )
    }

    if (!data && loaded) {
        return (
            <div className="card p-8 text-center">
                <p className="text-sm" style={{ color: 'rgba(44,44,44,0.5)' }}>No clinical profile recorded yet.</p>
                <Link href={`/patients/${patientId}/clinical`} className="text-sm font-medium mt-3 inline-block" style={{ color: 'var(--color-forest-700)', textDecoration: 'none' }}>
                    + Add Clinical Profile
                </Link>
            </div>
        )
    }

    if (!data) return null

    const doshaColors: Record<string, string> = {
        Vata: '#3b82f6', Pitta: '#f97316', Kapha: '#22c55e'
    }

    const renderList = (arr?: string[], label?: string) => arr && arr.length > 0 ? (
        <div>
            {label && <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'rgba(44,44,44,0.5)' }}>{label}</p>}
            <div className="flex flex-wrap gap-2">
                {arr.map(item => (
                    <span
                        key={item}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: doshaColors[item] ? `${doshaColors[item]}20` : 'var(--color-warm-100)', color: doshaColors[item] ?? 'var(--color-charcoal)' }}
                    >
                        {item}
                    </span>
                ))}
            </div>
        </div>
    ) : null

    const profile = data as {
        prakriti?: string[]; vikriti?: string[]; nadi_pariksha?: string;
        chronic_diseases?: string[]; known_allergies?: string[];
        lifestyle_notes?: string; diet_recommendations?: string;
    }

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="card p-6 grid md:grid-cols-2 gap-6">
                {renderList(profile.prakriti, 'Prakriti')}
                {renderList(profile.vikriti, 'Vikriti')}
                {profile.nadi_pariksha && (
                    <div className="md:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'rgba(44,44,44,0.5)' }}>Nadi Pariksha</p>
                        <p className="text-sm">{profile.nadi_pariksha}</p>
                    </div>
                )}
                {renderList(profile.chronic_diseases, 'Chronic Diseases')}
                {renderList(profile.known_allergies, 'Known Allergies')}
                {profile.lifestyle_notes && (
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'rgba(44,44,44,0.5)' }}>Lifestyle Notes</p>
                        <p className="text-sm leading-relaxed">{profile.lifestyle_notes}</p>
                    </div>
                )}
                {profile.diet_recommendations && (
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'rgba(44,44,44,0.5)' }}>Diet Recommendations</p>
                        <p className="text-sm leading-relaxed">{profile.diet_recommendations}</p>
                    </div>
                )}
            </div>
            <Link href={`/patients/${patientId}/clinical`} className="text-sm font-medium" style={{ color: 'var(--color-forest-700)', textDecoration: 'none' }}>
                ✏️ Edit Clinical Profile
            </Link>
        </div>
    )
}
