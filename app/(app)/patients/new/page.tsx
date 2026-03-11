'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, User } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface FormData {
    full_name: string
    date_of_birth: string
    gender: 'male' | 'female' | 'other'
    blood_group?: string
    phone: string
    email?: string
    address?: string
    city?: string
    patient_type: 'new' | 'returning' | 'followup'
    referred_by?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
}

export default function NewPatientPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [showEmergency, setShowEmergency] = useState(false)
    const [phoneError, setPhoneError] = useState<string | null>(null)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        defaultValues: { gender: 'male', patient_type: 'new' },
    })

    const onSubmit = async (data: FormData) => {
        setPhoneError(null)
        // Clean empty optional fields
        const payload = Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== '' && v !== undefined)
        )
        const res = await fetch('/api/patients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        const json = await res.json()

        if (res.status === 409) {
            const uhid = json.details?.uhid
            setPhoneError(`Phone already registered${uhid ? ` — UHID: ${uhid}` : ''}`)
            return
        }
        if (!res.ok) {
            toast('error', json.message ?? 'Failed to register patient')
            return
        }

        const patient = json.data
        toast('success', `Patient registered — UHID: ${patient.uhid}`)
        router.push(`/patients/${patient.id}`)
    }

    const sectionLabel = (text: string) => (
        <div className="flex items-center gap-3 mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-forest-700)', fontFamily: 'var(--font-sans)' }}>
                {text}
            </p>
            <div className="flex-1 h-px" style={{ background: 'var(--color-warm-200)' }} />
        </div>
    )

    return (
        <div className="animate-fade-in max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/patients" style={{ textDecoration: 'none' }}>
                    <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                        Register New Patient
                    </h1>
                    <p className="text-sm" style={{ color: 'rgba(44,44,44,0.5)' }}>
                        A unique UHID will be generated upon registration
                    </p>
                </div>
            </div>

            <div className="card p-8">
                <form onSubmit={handleSubmit(onSubmit)} noValidate>

                    {/* Personal Information */}
                    {sectionLabel('Personal Information')}
                    <div className="grid md:grid-cols-2 gap-5 mb-8">
                        <div className="md:col-span-2">
                            <Input
                                label="Full Name"
                                required
                                placeholder="e.g. Priya Ramesh"
                                icon={<User className="w-4 h-4" />}
                                error={errors.full_name?.message}
                                {...register('full_name', { required: 'Full name is required', minLength: { value: 2, message: 'Name too short' } })}
                            />
                        </div>
                        <Input
                            label="Date of Birth"
                            type="date"
                            required
                            max={new Date().toISOString().split('T')[0]}
                            error={errors.date_of_birth?.message}
                            {...register('date_of_birth', {
                                required: 'Date of birth is required',
                                validate: v => new Date(v) < new Date() || 'Must be in the past',
                            })}
                        />
                        <div>
                            <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(44,44,44,0.8)' }}>
                                Gender <span style={{ color: 'var(--color-gold-500)' }}>*</span>
                            </label>
                            <div className="flex gap-3">
                                {(['male', 'female', 'other'] as const).map(g => (
                                    <label
                                        key={g}
                                        className="flex items-center gap-2 cursor-pointer flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                                        style={{ border: '1px solid var(--color-warm-300)', background: 'white', fontFamily: 'var(--font-sans)' }}
                                    >
                                        <input type="radio" value={g} {...register('gender', { required: true })} className="accent-[#1A3D2B]" />
                                        {g.charAt(0).toUpperCase() + g.slice(1)}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <Select
                            label="Blood Group"
                            placeholder="Select blood group"
                            options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(v => ({ value: v, label: v }))}
                            {...register('blood_group')}
                        />
                    </div>

                    {/* Contact Details */}
                    {sectionLabel('Contact Details')}
                    <div className="grid md:grid-cols-2 gap-5 mb-8">
                        <Input
                            label="Phone"
                            type="tel"
                            required
                            placeholder="10-digit mobile number"
                            error={errors.phone?.message ?? phoneError ?? undefined}
                            hint="Indian mobile number (10 digits)"
                            {...register('phone', {
                                required: 'Phone is required',
                                pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number' },
                            })}
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="Optional"
                            error={errors.email?.message}
                            {...register('email', {
                                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                            })}
                        />
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>
                                Address
                            </label>
                            <textarea
                                placeholder="Optional"
                                rows={2}
                                className="input-base resize-none"
                                {...register('address')}
                            />
                        </div>
                        <Input
                            label="City"
                            placeholder="Optional"
                            {...register('city')}
                        />
                    </div>

                    {/* Clinic Info */}
                    {sectionLabel('Clinic Information')}
                    <div className="grid md:grid-cols-2 gap-5 mb-8">
                        <div>
                            <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(44,44,44,0.8)' }}>
                                Patient Type <span style={{ color: 'var(--color-gold-500)' }}>*</span>
                            </label>
                            <div className="flex gap-3">
                                {([
                                    { value: 'new', label: '🌱 New' },
                                    { value: 'returning', label: 'Returning' },
                                    { value: 'followup', label: 'Follow-up' },
                                ] as const).map(({ value, label }) => (
                                    <label
                                        key={value}
                                        className="flex items-center gap-2 cursor-pointer flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                                        style={{ border: '1px solid var(--color-warm-300)', background: 'white', fontFamily: 'var(--font-sans)' }}
                                    >
                                        <input type="radio" value={value} {...register('patient_type')} className="accent-[#1A3D2B]" />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <Input
                            label="Referred By"
                            placeholder="Optional"
                            {...register('referred_by')}
                        />
                    </div>

                    {/* Emergency Contact (collapsible) */}
                    <button
                        type="button"
                        onClick={() => setShowEmergency(s => !s)}
                        className="flex items-center gap-2 mb-4 text-sm font-medium transition-colors w-full"
                        style={{ color: 'var(--color-forest-700)', fontFamily: 'var(--font-sans)' }}
                    >
                        {showEmergency ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Emergency Contact (optional)
                    </button>

                    {showEmergency && (
                        <div className="grid md:grid-cols-2 gap-5 mb-8 p-5 rounded-xl" style={{ background: 'var(--color-warm-50)', border: '1px solid var(--color-warm-200)' }}>
                            <Input
                                label="Emergency Contact Name"
                                placeholder="Full name"
                                {...register('emergency_contact_name')}
                            />
                            <Input
                                label="Emergency Contact Phone"
                                type="tel"
                                placeholder="10-digit number"
                                error={errors.emergency_contact_phone?.message}
                                {...register('emergency_contact_phone', {
                                    pattern: { value: /^$|^[6-9]\d{9}$/, message: 'Enter a valid 10-digit number' },
                                })}
                            />
                        </div>
                    )}

                    {/* Submit */}
                    <div className="pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-warm-200)' }}>
                        <Button type="submit" variant="gold" loading={isSubmitting} className="flex-1 md:flex-none md:px-8">
                            Register Patient
                        </Button>
                        <Link href="/patients" style={{ textDecoration: 'none' }}>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
