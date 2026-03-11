'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Plus, Trash2, Save, Printer,
    Clock, Stethoscope, Pill, Salad, Moon, Calendar, CheckCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal'
import { PrescriptionPrintA4 } from '@/components/print/PrescriptionPrintA4'
import type { PrescriptionPrintData, ClinicInfo } from '@/components/print/PrescriptionPrintA4'

/* ─── Types ─────────────────────────────────────────────────────────── */
interface MedicineItem {
    medicine_id?: string | null
    name: string
    type?: 'ayurvedic' | 'general'
    dosage?: string
    frequency?: string
    duration?: string
    instructions?: string
}

interface Visit {
    id: string
    patient_id: string
    visit_date: string
    visit_time?: string
    visit_type: string
    chief_complaint?: string
    current_symptoms?: string
    doctor_notes?: string
    status: string
    patients?: { full_name: string; uhid: string; date_of_birth?: string; gender?: string }
}

interface Prescription {
    medicines: MedicineItem[]
    treatment_notes?: string
    diet_advice?: string
    lifestyle_advice?: string
    follow_up_notes?: string
}

const EMPTY_PRESCRIPTION: Prescription = {
    medicines: [],
    treatment_notes: '',
    diet_advice: '',
    lifestyle_advice: '',
    follow_up_notes: '',
}

const EMPTY_MEDICINE: MedicineItem = { name: '', type: 'ayurvedic', dosage: '', frequency: '', duration: '', instructions: '' }

const FREQ_OPTIONS = ['Once daily', 'Twice daily', 'Thrice daily', 'Morning & Night', 'Before food', 'After food', 'As needed']
const DUR_OPTIONS = ['7 days', '10 days', '14 days', '21 days', '30 days', '45 days', '60 days', '90 days']

/* ─── Helpers ────────────────────────────────────────────────────────── */
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function statusVariant(s: string): 'green' | 'gold' | 'gray' | 'red' {
    if (s === 'completed') return 'green'
    if (s === 'with_doctor') return 'gold'
    if (s === 'waiting') return 'gray'
    return 'red'
}
function statusLabel(s: string) {
    return s === 'with_doctor' ? 'With Doctor' : s.charAt(0).toUpperCase() + s.slice(1)
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function VisitDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { toast } = useToast()

    const [visit, setVisit] = useState<Visit | null>(null)
    const [prescription, setPrescription] = useState<Prescription>(EMPTY_PRESCRIPTION)
    const [isDoctor, setIsDoctor] = useState(false)
    const [saving, setSaving] = useState(false)
    const [completing, setCompleting] = useState(false)
    const [showPrint, setShowPrint] = useState(false)
    const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({ clinic_name: "Dr. Shetty's Ayur Clinic" })
    const [catalogue, setCatalogue] = useState<Array<{ name: string }>>([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        setLoading(true)
        const [sessionRes, visitRes, prescRes, settingsRes] = await Promise.all([
            fetch('/api/auth/session'),
            fetch(`/api/visits/${id}`),
            fetch(`/api/visits/${id}/prescription`),
            fetch('/api/settings'),
            fetch('/api/catalogue?per_page=500'),
        ])

        const session = await sessionRes.json()
        setIsDoctor(session?.data?.role === 'doctor')

        if (!visitRes.ok) { router.replace('/patients'); return }
        const visitJson = await visitRes.json()
        setVisit(visitJson.data)

        const prescJson = await prescRes.json()
        if (prescJson.success && prescJson.data) {
            setPrescription({
                medicines: prescJson.data.medicines ?? [],
                treatment_notes: prescJson.data.treatment_notes ?? '',
                diet_advice: prescJson.data.diet_advice ?? '',
                lifestyle_advice: prescJson.data.lifestyle_advice ?? '',
                follow_up_notes: prescJson.data.follow_up_notes ?? '',
            })
        }

        const settingsJson = await settingsRes.json()
        if (settingsJson.success && settingsJson.data) {
            setClinicInfo({
                clinic_name: settingsJson.data.clinic_name ?? "Dr. Shetty's Ayur Clinic",
                address: settingsJson.data.address,
                phone: settingsJson.data.phone,
                gst_number: settingsJson.data.gst_number,
            })
        }

        const catalogueRes = await Promise.resolve(arguments[0]?.[4] || fetch('/api/catalogue?per_page=500').then(r=>r)) // doing differently since i added it after settingsRes
        
        // Actually earlier code used `Promise.all([sessionRes, visitRes, prescRes, settingsRes])` which I modified but let's just do it sequentially here for the catalogue to not disrupt the array destructuring.
        try {
            const catRes = await fetch('/api/catalogue?per_page=500')
            const catJson = await catRes.json()
            if (catJson.success && catJson.data) {
                // Filter only medicines
                setCatalogue(catJson.data.filter((item: any) => item.item_type === 'medicine'))
            }
        } catch (e) { console.error('Error fetching catalogue', e) }

        setLoading(false)
    }, [id, router])

    useEffect(() => { load() }, [load])

    const savePrescription = async () => {
        setSaving(true)
        const res = await fetch(`/api/visits/${id}/prescription`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prescription),
        })
        setSaving(false)
        if (res.ok) {
            toast('success', 'Prescription saved')
        } else {
            const json = await res.json()
            toast('error', json.error?.message ?? 'Failed to save prescription')
        }
    }

    const completeVisit = async () => {
        setCompleting(true)
        // First save prescription, then mark visit completed
        await fetch(`/api/visits/${id}/prescription`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prescription),
        })
        const res = await fetch(`/api/visits/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' }),
        })
        setCompleting(false)
        if (res.ok) {
            toast('success', 'Visit completed & prescription saved')
            setVisit(v => v ? { ...v, status: 'completed' } : v)
        } else {
            toast('error', 'Failed to complete visit')
        }
    }

    // Medicine helpers
    const addMedicine = () => setPrescription(p => ({ ...p, medicines: [...p.medicines, { ...EMPTY_MEDICINE }] }))
    const updateMedicine = (i: number, field: keyof MedicineItem, value: string) => {
        setPrescription(p => {
            const meds = [...p.medicines]
            meds[i] = { ...meds[i], [field]: value }
            return { ...p, medicines: meds }
        })
    }
    const removeMedicine = (i: number) => setPrescription(p => ({ ...p, medicines: p.medicines.filter((_, idx) => idx !== i) }))

    if (loading) {
        return (
            <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                    <div className="skeleton h-4 w-20" />
                </div>
                <div className="card p-6 space-y-3">
                    <div className="skeleton h-8 w-48" />
                    <div className="skeleton h-4 w-32" />
                </div>
            </div>
        )
    }

    if (!visit) return null

    // Build prescription data for print
    const printData: PrescriptionPrintData = {
        visit_id: id,
        visit_date: visit.visit_date,
        chief_complaint: visit.chief_complaint ?? '',
        medicines: prescription.medicines.map(m => ({ ...m, medicine_id: m.medicine_id ?? undefined })),
        treatment_notes: prescription.treatment_notes,
        diet_advice: prescription.diet_advice,
        lifestyle_advice: prescription.lifestyle_advice,
        follow_up_notes: prescription.follow_up_notes,
        patient: {
            full_name: visit.patients?.full_name ?? '',
            uhid: visit.patients?.uhid ?? '',
            phone: '',
            date_of_birth: visit.patients?.date_of_birth ?? '',
            gender: visit.patients?.gender ?? '',
        },
        doctor: { full_name: '' },
    }

    const canEdit = isDoctor && visit.status !== 'cancelled'

    return (
        <div className="animate-fade-in max-w-4xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link href={`/patients/${visit.patient_id}`} style={{ color: 'rgba(44,44,44,0.5)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'var(--font-sans)' }}>
                        <ArrowLeft className="w-4 h-4" /> Back to Patient
                    </Link>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPrint(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--color-warm-300)', background: 'white', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}
                    >
                        <Printer className="w-4 h-4" /> Print Rx
                    </button>
                    {canEdit && (
                        <>
                            <button
                                onClick={savePrescription}
                                disabled={saving}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--color-forest-700)', color: 'white', cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 500 }}
                            >
                                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
                            </button>
                            {visit.status !== 'completed' && (
                                <button
                                    onClick={completeVisit}
                                    disabled={completing}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#166534', color: 'white', cursor: completing ? 'wait' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 500 }}
                                >
                                    <CheckCircle className="w-4 h-4" /> {completing ? 'Completing…' : 'Save & Complete'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Visit summary card */}
            <div className="card p-5 mb-5 flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="section-title" style={{ margin: 0 }}>
                            {visit.patients?.full_name ?? 'Visit Detail'}
                        </h1>
                        <Badge variant={statusVariant(visit.status)}>{statusLabel(visit.status)}</Badge>
                    </div>
                    <p className="text-sm" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                        <span className="uhid">{visit.patients?.uhid}</span>
                        &nbsp;·&nbsp;
                        <Clock className="w-3.5 h-3.5 inline" style={{ marginBottom: 1 }} />
                        &nbsp;{fmtDate(visit.visit_date)}{visit.visit_time ? ` · ${visit.visit_time}` : ''}
                    </p>
                    {visit.chief_complaint && (
                        <p className="text-sm mt-2 flex items-start gap-2" style={{ color: 'rgba(44,44,44,0.7)', fontFamily: 'var(--font-sans)', maxWidth: 500 }}>
                            <Stethoscope className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-forest-600)' }} />
                            {visit.chief_complaint}
                        </p>
                    )}
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--color-warm-100)', color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                    {visit.visit_type}
                </span>
            </div>

            {/* ── Medicines ──────────────────────────────────────── */}
            <div className="card mb-5 overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-warm-200)', background: 'var(--color-warm-50)' }}>
                    <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4" style={{ color: 'var(--color-forest-600)' }} />
                        <h2 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>Medicines</h2>
                    </div>
                    {canEdit && (
                        <button
                            onClick={addMedicine}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1px solid var(--color-warm-300)', background: 'white', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Medicine
                        </button>
                    )}
                </div>

                <datalist id="medicine-catalogue">
                    {catalogue.map((med, idx) => (
                        <option key={idx} value={med.name} />
                    ))}
                </datalist>

                {prescription.medicines.length === 0 ? (
                    <div className="p-6 text-center">
                        <Pill className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-warm-300)' }} />
                        <p className="text-sm" style={{ color: 'rgba(44,44,44,0.4)', fontFamily: 'var(--font-sans)' }}>
                            {canEdit ? 'No medicines added yet. Click "Add Medicine" to start.' : 'No medicines in this prescription.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--color-warm-100)' }}>
                        {prescription.medicines.map((med, i) => (
                            <div key={i} className="p-4 grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr auto', alignItems: 'start' }}>
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>Medicine *</label>
                                    {canEdit ? (
                                        <input
                                            className="input-base w-full text-sm"
                                            placeholder="e.g. Triphala Churna"
                                            value={med.name}
                                            list="medicine-catalogue"
                                            onChange={e => updateMedicine(i, 'name', e.target.value)}
                                        />
                                    ) : (
                                        <p className="text-sm font-medium">{med.name}</p>
                                    )}
                                </div>

                                {/* Dosage */}
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>Dosage</label>
                                    {canEdit ? (
                                        <input
                                            className="input-base w-full text-sm"
                                            placeholder="e.g. 5g / 2 tablets"
                                            value={med.dosage ?? ''}
                                            onChange={e => updateMedicine(i, 'dosage', e.target.value)}
                                        />
                                    ) : (
                                        <p className="text-sm">{med.dosage ?? '—'}</p>
                                    )}
                                </div>

                                {/* Frequency */}
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>Frequency</label>
                                    {canEdit ? (
                                        <select
                                            className="input-base w-full text-sm"
                                            value={med.frequency ?? ''}
                                            onChange={e => updateMedicine(i, 'frequency', e.target.value)}
                                        >
                                            <option value="">Select…</option>
                                            {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    ) : (
                                        <p className="text-sm">{med.frequency ?? '—'}</p>
                                    )}
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>Duration</label>
                                    {canEdit ? (
                                        <select
                                            className="input-base w-full text-sm"
                                            value={med.duration ?? ''}
                                            onChange={e => updateMedicine(i, 'duration', e.target.value)}
                                        >
                                            <option value="">Select…</option>
                                            {DUR_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    ) : (
                                        <p className="text-sm">{med.duration ?? '—'}</p>
                                    )}
                                </div>

                                {/* Remove */}
                                {canEdit && (
                                    <button
                                        onClick={() => removeMedicine(i)}
                                        style={{ padding: 6, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer', marginTop: 20 }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Instructions — full row */}
                                {canEdit && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>Instructions</label>
                                        <input
                                            className="input-base w-full text-sm"
                                            placeholder="e.g. With warm water before bed"
                                            value={med.instructions ?? ''}
                                            onChange={e => updateMedicine(i, 'instructions', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Treatment Notes ─────────────────────────────────── */}
            <div className="card mb-5 p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Stethoscope className="w-4 h-4" style={{ color: 'var(--color-forest-600)' }} />
                    <h2 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>Treatment Notes</h2>
                </div>
                {canEdit ? (
                    <textarea
                        className="input-base w-full text-sm"
                        rows={3}
                        placeholder="Add treatment observations, clinical notes…"
                        value={prescription.treatment_notes ?? ''}
                        onChange={e => setPrescription(p => ({ ...p, treatment_notes: e.target.value }))}
                    />
                ) : (
                    <p className="text-sm" style={{ color: prescription.treatment_notes ? 'var(--color-charcoal)' : 'rgba(44,44,44,0.35)', fontFamily: 'var(--font-sans)' }}>
                        {prescription.treatment_notes || 'No treatment notes recorded.'}
                    </p>
                )}
            </div>

            {/* ── Diet & Lifestyle ─────────────────────────────── */}
            <div className="grid md:grid-cols-2 gap-5 mb-5">
                <div className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Salad className="w-4 h-4" style={{ color: 'var(--color-forest-600)' }} />
                        <h2 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>Diet Advice</h2>
                    </div>
                    {canEdit ? (
                        <textarea
                            className="input-base w-full text-sm"
                            rows={3}
                            placeholder="Foods to eat, foods to avoid…"
                            value={prescription.diet_advice ?? ''}
                            onChange={e => setPrescription(p => ({ ...p, diet_advice: e.target.value }))}
                        />
                    ) : (
                        <p className="text-sm" style={{ color: prescription.diet_advice ? 'var(--color-charcoal)' : 'rgba(44,44,44,0.35)', fontFamily: 'var(--font-sans)' }}>
                            {prescription.diet_advice || '—'}
                        </p>
                    )}
                </div>
                <div className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Moon className="w-4 h-4" style={{ color: 'var(--color-forest-600)' }} />
                        <h2 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>Lifestyle Advice</h2>
                    </div>
                    {canEdit ? (
                        <textarea
                            className="input-base w-full text-sm"
                            rows={3}
                            placeholder="Rest, exercise, stress management…"
                            value={prescription.lifestyle_advice ?? ''}
                            onChange={e => setPrescription(p => ({ ...p, lifestyle_advice: e.target.value }))}
                        />
                    ) : (
                        <p className="text-sm" style={{ color: prescription.lifestyle_advice ? 'var(--color-charcoal)' : 'rgba(44,44,44,0.35)', fontFamily: 'var(--font-sans)' }}>
                            {prescription.lifestyle_advice || '—'}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Follow-up ─────────────────────────────────────── */}
            <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4" style={{ color: 'var(--color-forest-600)' }} />
                    <h2 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>Follow-up</h2>
                </div>
                {canEdit ? (
                    <input
                        className="input-base w-full text-sm"
                        placeholder="e.g. Review after 14 days / After completing course"
                        value={prescription.follow_up_notes ?? ''}
                        onChange={e => setPrescription(p => ({ ...p, follow_up_notes: e.target.value }))}
                    />
                ) : (
                    <p className="text-sm" style={{ color: prescription.follow_up_notes ? 'var(--color-charcoal)' : 'rgba(44,44,44,0.35)', fontFamily: 'var(--font-sans)' }}>
                        {prescription.follow_up_notes || '—'}
                    </p>
                )}
            </div>

            {/* Print preview */}
            {showPrint && (
                <PrintPreviewModal
                    title={`Prescription — ${visit.patients?.full_name}`}
                    onClose={() => setShowPrint(false)}
                >
                    <PrescriptionPrintA4 prescription={printData} clinic={clinicInfo} />
                </PrintPreviewModal>
            )}
        </div>
    )
}
