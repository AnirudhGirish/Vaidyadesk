import Link from 'next/link'
import { UserRound, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import PatientSearchInput from './PatientSearchInput'

async function fetchPatients(search: string, page: number) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const params = new URLSearchParams({ per_page: '20', page: String(page) })
    if (search) params.set('search', search)
    const res = await fetch(`${base}/api/patients?${params}`, {
        headers: { Cookie: cookieHeader },
        cache: 'no-store',
    })
    if (!res.ok) return { patients: [], total: 0 }
    const json = await res.json()
    return { patients: json.data ?? [], total: json.meta?.total ?? 0 }
}

function calcAge(dob?: string) {
    if (!dob) return '—'
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

function formatDate(dateStr: string) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface PageProps {
    searchParams: Promise<{ search?: string; page?: string }>
}

export default async function PatientsPage({ searchParams }: PageProps) {
    const params = await searchParams
    const search = params.search ?? ''
    const page = parseInt(params.page ?? '1')
    const { patients, total } = await fetchPatients(search, page)

    const totalPages = Math.ceil(total / 20)
    const from = (page - 1) * 20 + 1
    const to = Math.min(page * 20, total)

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Patients"
                subtitle={total > 0 ? `${total} patients registered` : undefined}
                action={
                    <Link href="/patients/new" style={{ textDecoration: 'none' }}>
                        <Button variant="gold" icon={<Plus className="w-4 h-4" />}>
                            Register Patient
                        </Button>
                    </Link>
                }
            />

            {/* Search */}
            <div className="mb-6">
                <PatientSearchInput defaultValue={search} />
            </div>

            {patients.length === 0 ? (
                <div className="card">
                    <EmptyState
                        icon={UserRound}
                        title={search ? `No patients found for "${search}"` : 'No patients registered yet'}
                        description={search ? 'Try a different name, phone, or UHID.' : 'Register your first patient to get started.'}
                        action={
                            search ? (
                                <Link href="/patients" style={{ textDecoration: 'none' }}>
                                    <Button variant="secondary">Clear search</Button>
                                </Link>
                            ) : (
                                <Link href="/patients/new" style={{ textDecoration: 'none' }}>
                                    <Button variant="gold" icon={<Plus className="w-4 h-4" />}>Register Patient</Button>
                                </Link>
                            )
                        }
                    />
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="card overflow-hidden hidden md:block">
                        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-warm-50)', borderBottom: '1px solid var(--color-warm-200)' }}>
                                    {['UHID', 'Name', 'Age / Gender', 'Phone', 'Type', 'Registered', ''].map(h => (
                                        <th
                                            key={h}
                                            className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider"
                                            style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map((p: {
                                    id: string; uhid: string; full_name: string; date_of_birth?: string;
                                    gender?: string; phone: string; patient_type: string; created_at: string
                                }, idx: number) => {
                                    const { variant, label } = patientTypeBadge(p.patient_type)
                                    return (
                                        <tr
                                            key={p.id}
                                            style={{ borderBottom: idx < patients.length - 1 ? '1px solid var(--color-warm-100)' : 'none' }}
                                            className="table-row-hover"
                                        >
                                            <td className="px-5 py-3.5">
                                                <span className="uhid">{p.uhid}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-sm" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-sans)' }}>
                                                    {p.full_name}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                                                {p.date_of_birth ? `${calcAge(p.date_of_birth)} yr` : '—'} / {p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm" style={{ color: 'rgba(44,44,44,0.7)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                                {p.phone}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Badge variant={variant}>{label}</Badge>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                                {formatDate(p.created_at)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Link
                                                    href={`/patients/${p.id}`}
                                                    className="btn-ghost text-xs px-3 py-1.5"
                                                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    View →
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {patients.map((p: {
                            id: string; uhid: string; full_name: string; date_of_birth?: string;
                            gender?: string; phone: string; patient_type: string
                        }) => {
                            const { variant, label } = patientTypeBadge(p.patient_type)
                            return (
                                <Link
                                    key={p.id}
                                    href={`/patients/${p.id}`}
                                    className="card p-4 block transition-all duration-200 hover:shadow-warm-lg"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-medium" style={{ color: 'var(--color-charcoal)' }}>{p.full_name}</p>
                                            <span className="uhid mt-1 inline-block">{p.uhid}</span>
                                        </div>
                                        <Badge variant={variant}>{label}</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(44,44,44,0.55)' }}>
                                        <span>{p.phone}</span>
                                        {p.date_of_birth && <span>{calcAge(p.date_of_birth)} yr, {p.gender}</span>}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-sm" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                                Showing {from}–{to} of {total} patients
                            </p>
                            <div className="flex items-center gap-2">
                                {page > 1 && (
                                    <Link href={`/patients?${new URLSearchParams({ search, page: String(page - 1) })}`} style={{ textDecoration: 'none' }}>
                                        <Button variant="secondary" size="sm">← Prev</Button>
                                    </Link>
                                )}
                                <span className="text-sm px-3" style={{ color: 'rgba(44,44,44,0.6)' }}>
                                    {page} / {totalPages}
                                </span>
                                {page < totalPages && (
                                    <Link href={`/patients?${new URLSearchParams({ search, page: String(page + 1) })}`} style={{ textDecoration: 'none' }}>
                                        <Button variant="secondary" size="sm">Next →</Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
