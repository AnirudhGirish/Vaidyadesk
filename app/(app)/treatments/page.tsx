'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Heart, ChevronDown, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

function statusBadge(s: string): 'green' | 'gold' | 'gray' | 'red' {
    const m: Record<string, 'green' | 'gold' | 'gray' | 'red'> = {
        active: 'gold', completed: 'green', cancelled: 'red', paused: 'gray'
    }
    return m[s] ?? 'gray'
}

function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Treatment {
    id: string; service_name: string; sessions_total: number;
    sessions_consumed: number; status: string; start_date: string; notes?: string;
    patients?: { full_name: string; uhid: string }
}

interface CatalogueService { id: string; name: string; duration_type: string; package_days?: number }
interface Patient { id: string; full_name: string; uhid: string }

function TreatmentCard({ t, onMarkSession, marking }: {
    t: Treatment; onMarkSession: (id: string) => void; marking: boolean
}) {
    const pct = t.sessions_total > 0 ? Math.round((t.sessions_consumed / t.sessions_total) * 100) : 0
    const canMark = t.status === 'active' && t.sessions_consumed < t.sessions_total

    return (
        <div className="card p-5 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-charcoal)' }}>
                        {t.service_name}
                    </h4>
                    {t.patients && (
                        <p className="text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>{t.patients.full_name}</p>
                    )}
                    {t.patients?.uhid && <span className="uhid">{t.patients.uhid}</span>}
                </div>
                <Badge variant={statusBadge(t.status)}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                </Badge>
            </div>

            <div>
                <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'rgba(44,44,44,0.5)' }}>
                    <span>{t.sessions_consumed}/{t.sessions_total} sessions</span>
                    <span>{pct}%</span>
                </div>
                <div className="rounded-full overflow-hidden h-2" style={{ background: 'var(--color-warm-200)' }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${pct}%`,
                            background: t.status === 'completed' ? 'var(--color-forest-500)' : 'var(--color-gold-500)',
                        }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'rgba(44,44,44,0.4)' }}>Started {formatDate(t.start_date)}</p>
                {canMark && (
                    <Button
                        variant="secondary"
                        size="sm"
                        loading={marking}
                        icon={<CheckCircle className="w-3.5 h-3.5" />}
                        onClick={() => onMarkSession(t.id)}
                    >
                        Mark Session
                    </Button>
                )}
            </div>
            {t.notes && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--color-warm-50)', color: 'rgba(44,44,44,0.6)', borderTop: '1px solid var(--color-warm-100)' }}>
                    {t.notes}
                </p>
            )}
        </div>
    )
}

function AddTreatmentModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
    const [services, setServices] = useState<CatalogueService[]>([])
    const [patients, setPatients] = useState<Patient[]>([])
    const [patientSearch, setPatientSearch] = useState('')
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [selectedService, setSelectedService] = useState<CatalogueService | null>(null)
    const [sessions, setSessions] = useState('1')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showServiceDropdown, setShowServiceDropdown] = useState(false)
    const [showPatientDropdown, setShowPatientDropdown] = useState(false)
    const [serviceSearch, setServiceSearch] = useState('')

    useEffect(() => {
        fetch('/api/catalogue?search=&per_page=100&item_type=service')
            .then(r => r.json())
            .then(j => setServices((j.data ?? []).filter((s: { item_type: string }) => s.item_type === 'service')))
    }, [])

    useEffect(() => {
        if (patientSearch.length < 2) { setPatients([]); return }
        fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}&per_page=8`)
            .then(r => r.json())
            .then(j => setPatients(j.data ?? []))
    }, [patientSearch])

    const filteredServices = services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedPatient || !selectedService) { setError('Please select a patient and service.'); return }
        setSaving(true); setError(null)

        const res = await fetch('/api/treatments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient_id: selectedPatient.id,
                service_id: selectedService.id,
                service_name: selectedService.name,
                sessions_total: parseInt(sessions),
                start_date: startDate,
                notes: notes || undefined,
                ...(selectedService.duration_type === 'package' && selectedService.package_days
                    ? { package_days: selectedService.package_days } : {}),
            }),
        })
        const json = await res.json()
        setSaving(false)
        if (res.ok) { onAdded() }
        else { setError(json.error?.message ?? 'Failed to create treatment.') }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ fontFamily: 'var(--font-sans)' }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-warm-200)' }}>
                    <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>New Treatment Plan</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X className="w-5 h-5" style={{ color: 'rgba(44,44,44,0.5)' }} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Patient */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(44,44,44,0.8)' }}>Patient <span style={{ color: 'var(--color-gold-500)' }}>*</span></label>
                        {selectedPatient ? (
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--color-forest-50)', border: '1px solid var(--color-forest-200)' }}>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-forest-700)' }}>{selectedPatient.full_name}</p>
                                    <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>{selectedPatient.uhid}</p>
                                </div>
                                <button type="button" onClick={() => setSelectedPatient(null)}><X className="w-4 h-4" style={{ color: 'rgba(44,44,44,0.4)' }} /></button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input type="text" value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setShowPatientDropdown(true) }}
                                    placeholder="Search by name or phone..." className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ border: '1px solid var(--color-warm-300)', outline: 'none' }} />
                                {showPatientDropdown && patients.length > 0 && (
                                    <div className="absolute z-30 top-full left-0 w-full mt-1 rounded-xl shadow-lg overflow-hidden" style={{ background: 'white', border: '1px solid var(--color-warm-200)' }}>
                                        {patients.map(p => (
                                            <button key={p.id} type="button" onClick={() => { setSelectedPatient(p); setPatientSearch(''); setShowPatientDropdown(false) }}
                                                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-warm-50)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <p className="font-medium">{p.full_name}</p>
                                                <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>{p.uhid}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Service */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(44,44,44,0.8)' }}>Service / Treatment <span style={{ color: 'var(--color-gold-500)' }}>*</span></label>
                        {selectedService ? (
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--color-forest-50)', border: '1px solid var(--color-forest-200)' }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-forest-700)' }}>{selectedService.name}</p>
                                <button type="button" onClick={() => setSelectedService(null)}><X className="w-4 h-4" style={{ color: 'rgba(44,44,44,0.4)' }} /></button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input type="text" value={serviceSearch} onChange={e => { setServiceSearch(e.target.value); setShowServiceDropdown(true) }}
                                    placeholder="Search services..." className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ border: '1px solid var(--color-warm-300)', outline: 'none' }}
                                    onFocus={() => setShowServiceDropdown(true)} />
                                {showServiceDropdown && (
                                    <div className="absolute z-30 top-full left-0 w-full mt-1 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto"
                                        style={{ background: 'white', border: '1px solid var(--color-warm-200)' }}>
                                        {filteredServices.slice(0, 10).map(s => (
                                            <button key={s.id} type="button" onClick={() => { setSelectedService(s); setShowServiceDropdown(false); setServiceSearch('') }}
                                                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-warm-50)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                {s.name}
                                            </button>
                                        ))}
                                        {filteredServices.length === 0 && <p className="px-4 py-3 text-sm" style={{ color: 'rgba(44,44,44,0.4)' }}>No services found</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sessions + Start date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(44,44,44,0.8)' }}>Total Sessions</label>
                            <input type="number" min="1" value={sessions} onChange={e => setSessions(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--color-warm-300)', outline: 'none' }} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(44,44,44,0.8)' }}>Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--color-warm-300)', outline: 'none' }} />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(44,44,44,0.8)' }}>Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes..."
                            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                            style={{ border: '1px solid var(--color-warm-300)', outline: 'none' }} />
                    </div>

                    {error && <p className="text-sm rounded-lg px-3 py-2" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</p>}

                    <div className="flex gap-3 pt-1">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" variant="primary" loading={saving} className="flex-1">Create Plan</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function TreatmentsPage() {
    const router = useRouter()
    const [treatments, setTreatments] = useState<Treatment[]>([])
    const [loading, setLoading] = useState(true)
    const [markingSession, setMarkingSession] = useState<string | null>(null)
    const [showAdd, setShowAdd] = useState(false)
    const [toast, setToast] = useState<string | null>(null)

    const load = () => {
        setLoading(true)
        fetch('/api/treatments?per_page=100')
            .then(r => r.json())
            .then(j => { setTreatments(j.data ?? []); setLoading(false) })
    }

    useEffect(load, [])

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

    const handleMarkSession = async (id: string) => {
        setMarkingSession(id)
        const res = await fetch(`/api/treatments/${id}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        })
        const json = await res.json()
        setMarkingSession(null)
        if (res.ok) { showToast('Session marked!'); load() }
        else { showToast(json.error?.message ?? 'Failed to mark session') }
    }

    const active = treatments.filter(t => t.status === 'active')
    const others = treatments.filter(t => t.status !== 'active')

    return (
        <div className="animate-fade-in">
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white"
                    style={{ background: 'var(--color-forest-700)', fontSize: '0.9rem' }}>{toast}</div>
            )}
            {showAdd && (
                <AddTreatmentModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); showToast('Treatment plan created!'); load() }} />
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>Treatment Plans</h1>
                    <p className="text-sm mt-1" style={{ color: 'rgba(44,44,44,0.5)' }}>{treatments.length} total · {active.length} active</p>
                </div>
                <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>
                    New Treatment Plan
                </Button>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="card p-5 animate-pulse" style={{ height: 140 }} />)}
                </div>
            ) : treatments.length === 0 ? (
                <div className="card">
                    <EmptyState icon={Heart} title="No treatment plans" description="Create a new treatment plan for a patient using the button above." action={
                        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>New Treatment Plan</Button>
                    } />
                </div>
            ) : (
                <div className="space-y-6">
                    {active.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-gold-500)' }}>
                                Active ({active.length})
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {active.map(t => (
                                    <TreatmentCard key={t.id} t={t}
                                        onMarkSession={handleMarkSession}
                                        marking={markingSession === t.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {others.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                Past ({others.length})
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {others.map(t => (
                                    <TreatmentCard key={t.id} t={t}
                                        onMarkSession={handleMarkSession}
                                        marking={markingSession === t.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
