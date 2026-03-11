'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const PRAKRITI_OPTIONS = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridosha']
const COMMON_DISEASES = ['Diabetes', 'Hypertension', 'Asthma', 'Arthritis', 'Thyroid disorders', 'PCOD', 'Obesity', 'Anaemia']
const COMMON_ALLERGIES = ['Pollen', 'Dust', 'Dairy', 'Gluten', 'Shellfish', 'Nuts', 'Latex']

function TagInput({ label, values, options, onChange }: {
    label: string; values: string[]; options: string[]; onChange: (v: string[]) => void
}) {
    const [inputVal, setInputVal] = useState('')
    const [focused, setFocused] = useState(false)
    const filtered = options.filter(o => !values.includes(o) && o.toLowerCase().includes(inputVal.toLowerCase()))

    const add = (val: string) => { if (!values.includes(val) && val.trim()) { onChange([...values, val.trim()]); setInputVal('') } }
    const remove = (val: string) => onChange(values.filter(v => v !== val))

    return (
        <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>{label}</label>
            <div className="flex flex-wrap gap-2 mb-2">
                {values.map(v => (
                    <span key={v} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm"
                        style={{ background: 'var(--color-forest-50)', color: 'var(--color-forest-700)', border: '1px solid var(--color-forest-200)' }}>
                        {v}
                        <button type="button" onClick={() => remove(v)}><X className="w-3 h-3" /></button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (filtered[0]) add(filtered[0]); else if (inputVal) add(inputVal) } }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setTimeout(() => setFocused(false), 200)}
                        placeholder="Type or select..."
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ border: '1px solid var(--color-warm-300)', fontFamily: 'var(--font-sans)', outline: 'none', background: 'white' }}
                    />
                    {focused && filtered.length > 0 && (
                        <div className="absolute z-20 top-full left-0 w-full mt-1 rounded-xl shadow-lg overflow-hidden"
                            style={{ background: 'white', border: '1px solid var(--color-warm-200)' }}>
                            {filtered.slice(0, 5).map(opt => (
                                <button key={opt} type="button" onClick={() => add(opt)}
                                    className="w-full text-left px-4 py-2 text-sm transition-colors"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-warm-50)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => { if (inputVal) add(inputVal) }} icon={<Plus className="w-3.5 h-3.5" />}>Add</Button>
            </div>
        </div>
    )
}

function Textarea({ label, value, onChange, placeholder, hint }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string
}) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>{label}</label>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
                style={{ border: '1px solid var(--color-warm-300)', fontFamily: 'var(--font-sans)', outline: 'none', background: 'white', lineHeight: 1.6 }}
            />
            {hint && <p className="text-xs mt-1" style={{ color: 'rgba(44,44,44,0.45)' }}>{hint}</p>}
        </div>
    )
}

export default function PatientClinicalPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const [id, setId] = useState('')
    const [patientName, setPatientName] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)

    // Form state matching clinicalProfileSchema
    const [prakriti, setPrakriti] = useState<string[]>([])
    const [vikriti, setVikriti] = useState<string[]>([])
    const [nadiPariksha, setNadiPariksha] = useState('')
    const [chronicDiseases, setChronicDiseases] = useState<string[]>([])
    const [knownAllergies, setKnownAllergies] = useState<string[]>([])
    const [lifestyleNotes, setLifestyleNotes] = useState('')
    const [dietRecommendations, setDietRecommendations] = useState('')

    useEffect(() => {
        params.then(async p => {
            setId(p.id)
            const [patientRes, clinicalRes] = await Promise.all([
                fetch(`/api/patients/${p.id}`).then(r => r.json()),
                fetch(`/api/patients/${p.id}/clinical`).then(r => r.json()),
            ])
            if (patientRes.success) setPatientName(patientRes.data.full_name)
            if (clinicalRes.success && clinicalRes.data) {
                const d = clinicalRes.data
                setPrakriti(d.prakriti ?? [])
                setVikriti(d.vikriti ?? [])
                setNadiPariksha(d.nadi_pariksha ?? '')
                setChronicDiseases(d.chronic_diseases ?? [])
                setKnownAllergies(d.known_allergies ?? [])
                setLifestyleNotes(d.lifestyle_notes ?? '')
                setDietRecommendations(d.diet_recommendations ?? '')
            }
            setLoading(false)
        })
    }, [params])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        const res = await fetch(`/api/patients/${id}/clinical`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prakriti: prakriti.length ? prakriti : undefined,
                vikriti: vikriti.length ? vikriti : undefined,
                nadi_pariksha: nadiPariksha || undefined,
                chronic_diseases: chronicDiseases.length ? chronicDiseases : undefined,
                known_allergies: knownAllergies.length ? knownAllergies : undefined,
                lifestyle_notes: lifestyleNotes || undefined,
                diet_recommendations: dietRecommendations || undefined,
            }),
        })
        const json = await res.json()
        setSaving(false)

        if (res.ok) {
            setToast('Clinical profile saved!')
            setTimeout(() => setToast(null), 3000)
            router.refresh()
        } else {
            setError(json.error?.message ?? 'Failed to save clinical profile.')
        }
    }

    if (loading) return (
        <div className="animate-fade-in max-w-2xl">
            <div className="h-8 w-64 rounded-lg animate-pulse mb-6" style={{ background: 'var(--color-warm-200)' }} />
            <div className="card p-8 animate-pulse" style={{ height: 500 }} />
        </div>
    )

    return (
        <div className="animate-fade-in max-w-2xl">
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3"
                    style={{ background: 'var(--color-forest-700)', color: 'white', fontSize: '0.9rem' }}>
                    {toast}
                </div>
            )}

            <div className="flex items-center gap-4 mb-8">
                <Link href={`/patients/${id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                        Clinical Profile
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'rgba(44,44,44,0.5)' }}>{patientName}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Ayurvedic Constitution */}
                <div className="card p-6 space-y-5">
                    <h2 className="font-semibold text-sm uppercase tracking-widest" style={{ color: 'rgba(44,44,44,0.5)' }}>Ayurvedic Constitution</h2>
                    <TagInput label="Prakriti (Constitution)" values={prakriti} options={PRAKRITI_OPTIONS} onChange={setPrakriti} />
                    <TagInput label="Vikriti (Current Imbalance)" values={vikriti} options={PRAKRITI_OPTIONS} onChange={setVikriti} />
                    
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>Nadi Pariksha (Pulse Diagnosis)</label>
                        <select
                            value={nadiPariksha}
                            onChange={e => setNadiPariksha(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ border: '1px solid var(--color-warm-300)', fontFamily: 'var(--font-sans)', outline: 'none', background: 'white' }}
                        >
                            <option value="">Select Nadi Pariksha...</option>
                            <option value="Vata (Snake-like, fast)">Vata (Snake-like, fast)</option>
                            <option value="Pitta (Frog-like, jumping)">Pitta (Frog-like, jumping)</option>
                            <option value="Kapha (Swan-like, slow)">Kapha (Swan-like, slow)</option>
                            <option value="Vata-Pitta">Vata-Pitta</option>
                            <option value="Pitta-Kapha">Pitta-Kapha</option>
                            <option value="Vata-Kapha">Vata-Kapha</option>
                            <option value="Tridosha">Tridosha</option>
                        </select>
                    </div>
                </div>

                {/* Medical History */}
                <div className="card p-6 space-y-5">
                    <h2 className="font-semibold text-sm uppercase tracking-widest" style={{ color: 'rgba(44,44,44,0.5)' }}>Medical History</h2>
                    <TagInput label="Chronic Diseases" values={chronicDiseases} options={COMMON_DISEASES} onChange={setChronicDiseases} />
                    <TagInput label="Known Allergies" values={knownAllergies} options={COMMON_ALLERGIES} onChange={setKnownAllergies} />
                </div>

                {/* Recommendations */}
                <div className="card p-6 space-y-5">
                    <h2 className="font-semibold text-sm uppercase tracking-widest" style={{ color: 'rgba(44,44,44,0.5)' }}>Lifestyle & Recommendations</h2>
                    <Textarea label="Lifestyle Notes" value={lifestyleNotes} onChange={setLifestyleNotes} placeholder="Sleep patterns, exercise habits, stress levels, occupation..." />
                    <Textarea label="Diet Recommendations" value={dietRecommendations} onChange={setDietRecommendations} placeholder="Dietary advice, foods to avoid, meal timings..." />
                </div>

                {error && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>{error}</div>
                )}

                <div className="flex gap-3">
                    <Link href={`/patients/${id}`} style={{ textDecoration: 'none' }} className="flex-1">
                        <Button variant="secondary" className="w-full">Cancel</Button>
                    </Link>
                    <Button type="submit" variant="primary" loading={saving} icon={<Save className="w-4 h-4" />} className="flex-1">
                        Save Profile
                    </Button>
                </div>
            </form>
        </div>
    )
}
