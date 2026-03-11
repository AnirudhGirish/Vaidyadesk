'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CalendarDays, Clock, ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface Patient {
    id: string
    full_name: string
    uhid: string
    phone?: string
}

const durationOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
]

export default function NewAppointmentPage() {
    const router = useRouter()

    // Patient search
    const [search, setSearch] = useState('')
    const [patients, setPatients] = useState<Patient[]>([])
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [showDropdown, setShowDropdown] = useState(false)
    const [searching, setSearching] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Form fields
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
    const [time, setTime] = useState('09:00')
    const [duration, setDuration] = useState('30')
    const [notes, setNotes] = useState('')

    // Submission
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Close dropdown on outside click
    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    // Patient search with debounce
    useEffect(() => {
        if (search.length < 2) { setPatients([]); return }
        const t = setTimeout(async () => {
            setSearching(true)
            try {
                const res = await fetch(`/api/patients?search=${encodeURIComponent(search)}&per_page=8`)
                const json = await res.json()
                setPatients(json.success ? (json.data ?? []) : [])
                setShowDropdown(true)
            } catch { setPatients([]) }
            finally { setSearching(false) }
        }, 300)
        return () => clearTimeout(t)
    }, [search])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (!selectedPatient) { setError('Please select a patient.'); return }
        if (!date) { setError('Please select a date.'); return }
        if (!time) { setError('Please select a time.'); return }

        // Ensure time is HH:MM format
        const timePart = time.slice(0, 5)

        setLoading(true)
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: selectedPatient.id,
                    appointment_date: date,
                    appointment_time: timePart,
                    duration_minutes: parseInt(duration),
                    notes: notes || undefined,
                }),
            })
            const json = await res.json()
            if (!res.ok || !json.success) {
                setError(json.error?.message ?? 'Failed to create appointment. The slot may already be booked.')
                return
            }
            router.push('/appointments')
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="animate-fade-in max-w-xl">
            {/* Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
                style={{ color: 'rgba(44,44,44,0.55)', fontFamily: 'var(--font-sans)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
                <ArrowLeft className="w-4 h-4" /> Back to Appointments
            </button>

            <div className="mb-6">
                <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                    New Appointment
                </h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                    Schedule a visit for a patient
                </p>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-5">
                {/* Patient Search */}
                <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
                    <label className="text-sm font-medium" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>
                        Patient <span style={{ color: 'var(--color-gold-500)' }}>*</span>
                    </label>

                    {selectedPatient ? (
                        <div
                            className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                            style={{ border: '1.5px solid var(--color-forest-300)', background: 'var(--color-forest-50)' }}
                        >
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-forest-700)' }}>{selectedPatient.full_name}</p>
                                <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-mono)' }}>{selectedPatient.uhid}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setSelectedPatient(null); setSearch('') }}
                                className="p-1 rounded-lg"
                                style={{ background: 'transparent' }}
                            >
                                <X className="w-4 h-4" style={{ color: 'rgba(44,44,44,0.4)' }} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(44,44,44,0.4)' }} />
                                <input
                                    type="text"
                                    className="input-base pl-10"
                                    placeholder="Search by name, UHID or phone..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onFocus={() => patients.length > 0 && setShowDropdown(true)}
                                />
                                {searching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                                        style={{ borderColor: 'var(--color-forest-400)', borderTopColor: 'transparent' }} />
                                )}
                            </div>
                            {showDropdown && patients.length > 0 && (
                                <div
                                    className="absolute top-full left-0 right-0 z-40 rounded-xl overflow-hidden mt-1"
                                    style={{ background: 'white', border: '1px solid var(--color-warm-200)', boxShadow: 'var(--shadow-warm-lg)' }}
                                >
                                    {patients.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            className="w-full flex items-center gap-3 text-left px-4 py-3 transition-colors"
                                            style={{ borderBottom: '1px solid var(--color-warm-100)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-warm-50)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            onClick={() => { setSelectedPatient(p); setShowDropdown(false); setSearch('') }}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
                                                style={{ background: 'var(--color-forest-50)', color: 'var(--color-forest-700)' }}
                                            >
                                                {p.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>{p.full_name}</p>
                                                <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-mono)' }}>
                                                    {p.uhid}{p.phone && ` · ${p.phone}`}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showDropdown && !searching && patients.length === 0 && search.length >= 2 && (
                                <div
                                    className="absolute top-full left-0 right-0 z-40 rounded-xl px-4 py-3 mt-1 text-sm"
                                    style={{ background: 'white', border: '1px solid var(--color-warm-200)', color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}
                                >
                                    No patients found. <a href="/patients/new" style={{ color: 'var(--color-forest-700)', textDecoration: 'none' }}>Register new patient →</a>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Date" required type="date"
                        icon={<CalendarDays className="w-4 h-4" />}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                        label="Time" required type="time"
                        icon={<Clock className="w-4 h-4" />}
                        value={time}
                        onChange={e => setTime(e.target.value)}
                    />
                </div>

                {/* Duration */}
                <Select
                    label="Duration"
                    options={durationOptions}
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                />

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>Notes</label>
                    <textarea
                        className="input-base resize-none"
                        rows={3}
                        placeholder="Reason for visit, special instructions..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        style={{ fontFamily: 'var(--font-sans)' }}
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                        {error}
                    </p>
                )}

                <div className="flex gap-3 pt-1">
                    <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" variant="gold" loading={loading} className="flex-1">
                        {loading ? 'Scheduling...' : 'Schedule Appointment'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
