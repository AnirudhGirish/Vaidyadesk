'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(v => ({ value: v, label: v }))
const patientTypes = [{ value: 'new', label: 'New' }, { value: 'returning', label: 'Returning' }, { value: 'followup', label: 'Follow-up' }]
const genderOptions = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]

interface Patient {
    id: string; full_name: string; date_of_birth: string; gender: string;
    phone: string; email?: string; address?: string; city?: string;
    patient_type: string; referred_by?: string; blood_group?: string;
    emergency_contact_name?: string; emergency_contact_phone?: string;
}

export default function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const [id, setId] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [form, setForm] = useState<Partial<Patient>>({})

    useEffect(() => {
        params.then(p => {
            setId(p.id)
            fetch(`/api/patients/${p.id}`)
                .then(r => r.json())
                .then(j => {
                    if (j.success) setForm(j.data)
                    else router.push('/patients')
                })
                .finally(() => setLoading(false))
        })
    }, [params, router])

    const set = (field: keyof Patient) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        // Only send fields that PUT accepts
        const payload: Record<string, unknown> = {
            full_name: form.full_name,
            date_of_birth: form.date_of_birth,
            gender: form.gender,
            phone: form.phone,
            email: form.email || undefined,
            address: form.address || undefined,
            city: form.city || undefined,
            patient_type: form.patient_type,
            referred_by: form.referred_by || undefined,
            blood_group: form.blood_group || undefined,
            emergency_contact_name: form.emergency_contact_name || undefined,
            emergency_contact_phone: form.emergency_contact_phone || undefined,
        }
        // Remove undefined keys
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

        const res = await fetch(`/api/patients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        const json = await res.json()
        setSaving(false)

        if (res.ok) {
            router.push(`/patients/${id}`)
            router.refresh()
        } else {
            setError(json.error?.message ?? 'Failed to update patient.')
        }
    }

    if (loading) return (
        <div className="animate-fade-in max-w-2xl">
            <div className="h-8 w-48 rounded-lg animate-pulse mb-6" style={{ background: 'var(--color-warm-200)' }} />
            <div className="card p-8 animate-pulse" style={{ height: 400 }} />
        </div>
    )

    return (
        <div className="animate-fade-in max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/patients/${id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
                </Link>
                <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                    Edit Patient
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="card p-6 space-y-5">
                    <h2 className="font-semibold text-sm uppercase tracking-widest" style={{ color: 'rgba(44,44,44,0.5)' }}>Personal Information</h2>
                    <Input label="Full Name" required value={form.full_name ?? ''} onChange={set('full_name')} placeholder="Patient's full name" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date of Birth" required type="date" value={form.date_of_birth ?? ''} onChange={set('date_of_birth')} />
                        <Select label="Gender" required options={genderOptions} value={form.gender ?? ''} onChange={set('gender')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Blood Group" value={form.blood_group ?? ''} onChange={set('blood_group')} placeholder="e.g. O+" />
                        <Select label="Patient Type" options={patientTypes} value={form.patient_type ?? 'new'} onChange={set('patient_type')} />
                    </div>
                </div>

                <div className="card p-6 space-y-5">
                    <h2 className="font-semibold text-sm uppercase tracking-widest" style={{ color: 'rgba(44,44,44,0.5)' }}>Contact</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" required value={form.phone ?? ''} onChange={set('phone')} placeholder="10-digit mobile" />
                        <Input label="Email" type="email" value={form.email ?? ''} onChange={set('email')} placeholder="optional" />
                    </div>
                    <Input label="Address" value={form.address ?? ''} onChange={set('address')} placeholder="Street address" />
                    <Input label="City" value={form.city ?? ''} onChange={set('city')} placeholder="City" />
                    <Input label="Referred By" value={form.referred_by ?? ''} onChange={set('referred_by')} placeholder="Referral source or doctor name" />
                </div>

                <div className="card p-6 space-y-5">
                    <h2 className="font-semibold text-sm uppercase tracking-widest" style={{ color: 'rgba(44,44,44,0.5)' }}>Emergency Contact</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Name" value={form.emergency_contact_name ?? ''} onChange={set('emergency_contact_name')} placeholder="Emergency contact name" />
                        <Input label="Phone" value={form.emergency_contact_phone ?? ''} onChange={set('emergency_contact_phone')} placeholder="10-digit mobile" />
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>{error}</div>
                )}

                <div className="flex gap-3">
                    <Link href={`/patients/${id}`} style={{ textDecoration: 'none' }} className="flex-1">
                        <Button variant="secondary" className="w-full">Cancel</Button>
                    </Link>
                    <Button type="submit" variant="primary" loading={saving} icon={<Save className="w-4 h-4" />} className="flex-1">
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    )
}
