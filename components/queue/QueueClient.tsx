'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Users, Plus, Clock, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface QueueItem {
    id: string
    token: number
    status: 'waiting' | 'with_doctor' | 'completed' | 'cancelled'
    chief_complaint?: string
    visit_type: string
    created_at: string
    patients?: { full_name: string; uhid: string; phone: string }
}

interface PatientResult {
    id: string; full_name: string; uhid: string; phone: string
}

function statusBadge(status: string): { variant: 'gold' | 'green' | 'gray' | 'red'; label: string } {
    const m: Record<string, { variant: 'gold' | 'green' | 'gray' | 'red'; label: string }> = {
        waiting: { variant: 'gray', label: 'Waiting' },
        with_doctor: { variant: 'gold', label: 'With Doctor' },
        completed: { variant: 'green', label: 'Completed' },
        cancelled: { variant: 'red', label: 'Cancelled' },
    }
    return m[status] ?? { variant: 'gray', label: status }
}

function waitTime(createdAt: string) {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff} min`
    return `${Math.floor(diff / 60)}h ${diff % 60}m`
}

export default function QueueClient({ role }: { role: string }) {
    const { toast } = useToast()
    const router = useRouter()
    const [queue, setQueue] = useState<QueueItem[]>([])
    const [loading, setLoading] = useState(true)
    const [addModal, setAddModal] = useState(false)
    const [search, setSearch] = useState('')
    const [patientResults, setPatientResults] = useState<PatientResult[]>([])
    const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null)
    const [complaint, setComplaint] = useState('')
    const [adding, setAdding] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const fetchQueue = useCallback(async () => {
        const res = await fetch('/api/queue')
        if (res.ok) {
            const json = await res.json()
            setQueue(json.data ?? [])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchQueue()

        // Real-time subscription
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const today = new Date().toISOString().split('T')[0]
        const channel = supabase
            .channel('queue-updates')
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'visits',
                filter: `visit_date=eq.${today}`,
            }, () => fetchQueue())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [fetchQueue])

    const searchPatients = async (q: string) => {
        if (!q || q.length < 2) { setPatientResults([]); return }
        const res = await fetch(`/api/patients?search=${encodeURIComponent(q)}&per_page=5`)
        if (res.ok) {
            const json = await res.json()
            setPatientResults(json.data ?? [])
        }
    }

    useEffect(() => {
        const id = setTimeout(() => searchPatients(search), 300)
        return () => clearTimeout(id)
    }, [search])

    const handleCallIn = async (id: string) => {
        setUpdatingId(id)
        const res = await fetch(`/api/queue/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'with_doctor' }),
        })
        setUpdatingId(null)
        if (res.ok) {
            fetchQueue()
            // Doctor goes straight into the consultation
            if (role === 'doctor') router.push(`/visits/${id}`)
        } else toast('error', 'Failed to update status')
    }

    const handleUpdateStatus = async (id: string, status: string) => {
        setUpdatingId(id)
        const res = await fetch(`/api/queue/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        })
        setUpdatingId(null)
        if (res.ok) { fetchQueue() }
        else toast('error', 'Failed to update status')
    }

    const handleAddToQueue = async () => {
        if (!selectedPatient) return
        setAdding(true)
        const res = await fetch('/api/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: selectedPatient.id, chief_complaint: complaint, visit_type: 'walkin' }),
        })
        setAdding(false)
        if (res.ok) {
            toast('success', `${selectedPatient.full_name} added to queue`)
            setAddModal(false); setSelectedPatient(null); setSearch(''); setComplaint(''); fetchQueue()
        } else {
            const json = await res.json()
            toast('error', json.message ?? 'Failed to add to queue')
        }
    }

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    const waiting = queue.filter(q => q.status === 'waiting').length
    const withDoc = queue.filter(q => q.status === 'with_doctor').length
    const done = queue.filter(q => q.status === 'completed').length
    const activeQueue = queue.filter(q => q.status === 'waiting' || q.status === 'with_doctor')
    const completedQueue = queue.filter(q => q.status === 'completed')

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                        {today}
                    </p>
                    <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                        Today&apos;s Queue
                    </h1>
                </div>
                <Button variant="gold" icon={<Plus className="w-4 h-4" />} onClick={() => setAddModal(true)}>
                    Add to Queue
                </Button>
            </div>

            {/* Summary pills */}
            <div className="flex flex-wrap gap-3 mb-6">
                {[
                    { label: 'Waiting', value: waiting, color: 'rgba(44,44,44,0.5)' },
                    { label: 'With Doctor', value: withDoc, color: 'var(--color-gold-500)' },
                    { label: 'Completed', value: done, color: 'var(--color-forest-500)' },
                    { label: 'Total', value: queue.length, color: 'var(--color-forest-700)' },
                ].map(({ label, value, color }) => (
                    <div
                        key={label}
                        className="px-4 py-2 rounded-full text-sm font-medium"
                        style={{ background: 'white', border: '1px solid var(--color-warm-200)', boxShadow: 'var(--shadow-warm-sm)', fontFamily: 'var(--font-sans)' }}
                    >
                        <span style={{ color }}>{value}</span>
                        <span style={{ color: 'rgba(44,44,44,0.5)', marginLeft: 6 }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Queue Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <p className="text-sm" style={{ color: 'rgba(44,44,44,0.4)' }}>Loading queue...</p>
                    </div>
                ) : queue.length === 0 ? (
                    <div className="py-16 text-center">
                        <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-warm-300)' }} />
                        <p className="font-medium mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'rgba(44,44,44,0.6)' }}>
                            Queue is empty
                        </p>
                        <p className="text-sm" style={{ color: 'rgba(44,44,44,0.4)' }}>Add a patient to get started</p>
                    </div>
                ) : (
                    <>
                        {/* Active patients — desktop */}
                        {activeQueue.length > 0 && (
                            <table className="w-full hidden md:table">
                                <thead>
                                    <tr style={{ background: 'var(--color-warm-50)', borderBottom: '1px solid var(--color-warm-200)' }}>
                                        {['Token', 'Patient', 'Wait Time', 'Complaint', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(44,44,44,0.5)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeQueue.map((item, idx) => {
                                        const { variant, label } = statusBadge(item.status)
                                        return (
                                            <tr key={item.id} style={{ borderBottom: idx < activeQueue.length - 1 ? '1px solid var(--color-warm-100)' : 'none' }}>
                                                <td className="px-5 py-3.5">
                                                    <span className="font-semibold text-lg" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-700)' }}>
                                                        {String(item.token ?? 0).padStart(3, '0')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="font-medium text-sm">{item.patients?.full_name ?? '—'}</p>
                                                    {item.patients?.uhid && <span className="uhid mt-1">{item.patients.uhid}</span>}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                                        <Clock className="w-3 h-3" /> {waitTime(item.created_at)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm" style={{ color: 'rgba(44,44,44,0.6)', maxWidth: 160 }}>
                                                    <span className="truncate block">{item.chief_complaint ?? '—'}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <Badge variant={variant}>
                                                        {item.status === 'with_doctor' ? (
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#B8922A] animate-pulse-soft inline-block" />
                                                                {label}
                                                            </span>
                                                        ) : label}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {item.status === 'waiting' && (
                                                            <button
                                                                onClick={() => role === 'doctor' ? handleCallIn(item.id) : handleUpdateStatus(item.id, 'with_doctor')}
                                                                disabled={updatingId === item.id}
                                                                className="btn-primary text-xs px-3 py-1.5"
                                                            >
                                                                {updatingId === item.id ? '…' : role === 'doctor' ? 'Call In →' : 'Check In'}
                                                            </button>
                                                        )}
                                                        {item.status === 'with_doctor' && role === 'doctor' && (
                                                            <button
                                                                onClick={() => router.push(`/visits/${item.id}`)}
                                                                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                                                                style={{ background: 'var(--color-gold-500)' }}
                                                            >
                                                                <FileText className="w-3.5 h-3.5" /> Open Consultation
                                                            </button>
                                                        )}
                                                        {item.status === 'with_doctor' && role !== 'doctor' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(item.id, 'completed')}
                                                                disabled={updatingId === item.id}
                                                                className="btn-primary text-xs px-3 py-1.5"
                                                            >
                                                                {updatingId === item.id ? '…' : 'Complete'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}

                        {/* Active patients — mobile */}
                        {activeQueue.length > 0 && (
                            <div className="md:hidden divide-y" style={{ '--tw-divide-color': 'var(--color-warm-100)' } as React.CSSProperties}>
                                {activeQueue.map(item => {
                                    const { variant, label } = statusBadge(item.status)
                                    return (
                                        <div key={item.id} className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-lg" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-700)' }}>#{String(item.token ?? 0).padStart(3, '0')}</span>
                                                <Badge variant={variant}>{label}</Badge>
                                            </div>
                                            <p className="font-medium text-sm">{item.patients?.full_name}</p>
                                            <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>{item.chief_complaint ?? '—'}</p>
                                            <div className="flex gap-2 pt-1">
                                                {item.status === 'waiting' && (
                                                    <button onClick={() => handleUpdateStatus(item.id, 'with_doctor')} className="btn-primary text-xs px-3 py-1.5">{role === 'doctor' ? 'Call In' : 'Check In'}</button>
                                                )}
                                                {item.status === 'with_doctor' && (
                                                    <button onClick={() => handleUpdateStatus(item.id, 'completed')} className="btn-primary text-xs px-3 py-1.5">{role === 'doctor' ? 'Done' : 'Complete'}</button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Completed section */}
                        {completedQueue.length > 0 && (
                            <div style={{ borderTop: activeQueue.length > 0 ? '2px solid var(--color-warm-200)' : 'none' }}>
                                <div className="px-5 py-2" style={{ background: 'var(--color-warm-50)' }}>
                                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-forest-500)' }}>Completed ({completedQueue.length})</p>
                                </div>
                                <table className="w-full hidden md:table">
                                    <tbody>
                                        {completedQueue.map((item, idx) => (
                                            <tr key={item.id} style={{ borderBottom: idx < completedQueue.length - 1 ? '1px solid var(--color-warm-100)' : 'none', opacity: 0.6 }}>
                                                <td className="px-5 py-3">
                                                    <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-700)', fontSize: '0.95rem' }}>
                                                        {String(item.token ?? 0).padStart(3, '0')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <p className="font-medium text-sm">{item.patients?.full_name ?? '—'}</p>
                                                    {item.patients?.uhid && <span className="uhid">{item.patients.uhid}</span>}
                                                </td>
                                                <td className="px-5 py-3 text-sm" style={{ color: 'rgba(44,44,44,0.5)' }}>{item.chief_complaint ?? '—'}</td>
                                                <td className="px-5 py-3" colSpan={role === 'doctor' ? 2 : 3}>
                                                    <Badge variant="green">Completed</Badge>
                                                </td>
                                                {role === 'doctor' && (
                                                    <td className="px-5 py-3">
                                                        <button
                                                            onClick={() => router.push(`/visits/${item.id}`)}
                                                            className="text-xs flex items-center gap-1"
                                                            style={{ color: 'var(--color-gold-500)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                                                        >
                                                            <FileText className="w-3.5 h-3.5" /> View Rx
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="md:hidden divide-y" style={{ '--tw-divide-color': 'var(--color-warm-100)' } as React.CSSProperties}>
                                    {completedQueue.map(item => (
                                        <div key={item.id} className="p-4 flex items-center gap-3" style={{ opacity: 0.6 }}>
                                            <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-700)' }}>#{String(item.token ?? 0).padStart(3, '0')}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{item.patients?.full_name}</p>
                                                <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>{item.chief_complaint ?? '—'}</p>
                                            </div>
                                            <Badge variant="green">Done</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add to Queue Modal */}
            <Modal open={addModal} onClose={() => { setAddModal(false); setSelectedPatient(null); setSearch('') }} title="Add to Queue" size="md">
                <div className="space-y-4">
                    {!selectedPatient ? (
                        <>
                            <div className="relative">
                                <input
                                    className="input-base"
                                    placeholder="Search patient by name or phone..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            {patientResults.length > 0 && (
                                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-warm-200)' }}>
                                    {patientResults.map((p, idx) => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setSelectedPatient(p); setSearch('') }}
                                            className="w-full text-left px-4 py-3 transition-colors"
                                            style={{
                                                borderBottom: idx < patientResults.length - 1 ? '1px solid var(--color-warm-100)' : 'none',
                                                background: 'transparent',
                                                border: idx < patientResults.length - 1 ? '0 0 1px 0 solid var(--color-warm-100)' : 'none',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-warm-50)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <p className="font-medium text-sm">{p.full_name}</p>
                                            <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                                {p.uhid} · {p.phone}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {search.length >= 2 && patientResults.length === 0 && (
                                <p className="text-sm text-center py-3" style={{ color: 'rgba(44,44,44,0.4)' }}>No patients found</p>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-forest-50)', border: '1px solid var(--color-forest-100)' }}>
                                <div>
                                    <p className="font-medium text-sm">{selectedPatient.full_name}</p>
                                    <span className="uhid">{selectedPatient.uhid}</span>
                                </div>
                                <button onClick={() => setSelectedPatient(null)} className="text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                    Change
                                </button>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>
                                    Chief Complaint
                                </label>
                                <input
                                    className="input-base"
                                    placeholder="What is the patient's main complaint?"
                                    value={complaint}
                                    onChange={e => setComplaint(e.target.value)}
                                />
                            </div>
                            <Button variant="gold" loading={adding} onClick={handleAddToQueue} className="w-full">
                                Add to Queue
                            </Button>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    )
}
