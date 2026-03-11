import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, Plus, CalendarDays, Receipt } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import PatientTabs from './PatientTabs'

async function fetchAPI(path: string) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${base}${path}`, {
        headers: { Cookie: cookieHeader },
        cache: 'no-store',
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data : null
}

function calcAge(dob: string) {
    const birth = new Date(dob)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    if (now.getMonth() - birth.getMonth() < 0 || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
    return age
}

function patientTypeBadge(type: string): { variant: 'green' | 'gold' | 'gray'; label: string } {
    const map: Record<string, { variant: 'green' | 'gold' | 'gray'; label: string }> = {
        new: { variant: 'green', label: '🌱 New' },
        returning: { variant: 'gold', label: 'Returning' },
        followup: { variant: 'gray', label: 'Follow-up' },
    }
    return map[type] ?? { variant: 'gray', label: type }
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function PatientProfilePage({ params }: PageProps) {
    const { id } = await params

    const [patient, visits, treatments, bills, session] = await Promise.all([
        fetchAPI(`/api/patients/${id}`),
        fetchAPI(`/api/visits?patient_id=${id}`),
        fetchAPI(`/api/treatments?patient_id=${id}`),
        fetchAPI(`/api/bills?patient_id=${id}&per_page=20`),
        fetchAPI('/api/auth/session'),
    ])

    if (!patient) notFound()

    const { variant, label } = patientTypeBadge(patient.patient_type)
    const isDoctor = session?.role === 'doctor'

    return (
        <div className="animate-fade-in">
            {/* Back */}
            <Link href="/patients" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors" style={{ color: 'rgba(44,44,44,0.5)', textDecoration: 'none' }}>
                <ArrowLeft className="w-4 h-4" /> All Patients
            </Link>

            {/* Patient Card */}
            <div className="card p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-start gap-5">
                    {/* Avatar */}
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-xl font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, var(--color-forest-700), var(--color-forest-500))', fontFamily: 'var(--font-display)' }}
                    >
                        {patient.full_name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start gap-3 mb-2">
                            <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                                {patient.full_name}
                            </h1>
                            <Badge variant={variant}>{label}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="uhid">{patient.uhid}</span>
                            {patient.date_of_birth && (
                                <>
                                    <span className="text-sm" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                        {calcAge(patient.date_of_birth)} years
                                    </span>
                                    <span className="text-sm" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                        {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}
                                    </span>
                                </>
                            )}
                            {patient.blood_group && (
                                <span
                                    className="text-xs px-2 py-0.5 rounded font-medium"
                                    style={{ background: '#fee2e2', color: '#b91c1c', fontFamily: 'var(--font-sans)' }}
                                >
                                    {patient.blood_group}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                            {patient.phone && (
                                <span className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> {patient.phone}
                                </span>
                            )}
                            {patient.email && (
                                <span className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" /> {patient.email}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap md:flex-nowrap shrink-0">
                        <Link href={`/patients/${id}/edit`} style={{ textDecoration: 'none' }}>
                            <button
                                className="btn-ghost text-sm px-3 py-2"
                                style={{ border: '1px solid var(--color-warm-300)' }}
                            >
                                Edit
                            </button>
                        </Link>
                        <Link href={`/billing/new?patient_id=${id}`} style={{ textDecoration: 'none' }}>
                            <button className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5">
                                <Receipt className="w-4 h-4" /> Bill
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <PatientTabs
                patientId={id}
                patient={patient}
                visits={visits ?? []}
                treatments={treatments ?? []}
                bills={bills ?? []}
                isDoctor={isDoctor}
            />
        </div>
    )
}
