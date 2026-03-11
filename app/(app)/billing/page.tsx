import Link from 'next/link'
import { Plus, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

async function fetchBills(params: URLSearchParams) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/bills?${params}`, {
        headers: { Cookie: cookieHeader }, cache: 'no-store',
    })
    if (!res.ok) return { bills: [], total: 0 }
    const json = await res.json()
    return { bills: json.data ?? [], total: json.meta?.total ?? 0 }
}

function paymentBadge(status: string): 'green' | 'gold' | 'red' | 'gray' {
    const m: Record<string, 'green' | 'gold' | 'red' | 'gray'> = {
        paid: 'green', partial: 'gold', due: 'red', advance: 'gray'
    }
    return m[status] ?? 'gray'
}

interface Bill {
    id: string; bill_number: string; bill_date: string;
    total_amount: number; payment_status: string;
    patients?: { full_name: string; uhid: string }
}

interface PageProps {
    searchParams: Promise<{ payment_status?: string; from_date?: string; to_date?: string; page?: string }>
}

export default async function BillingPage({ searchParams }: PageProps) {
    const sp = await searchParams
    const page = parseInt(sp.page ?? '1')
    const params = new URLSearchParams({ per_page: '20', page: String(page) })
    if (sp.payment_status) params.set('payment_status', sp.payment_status)
    if (sp.from_date) params.set('from_date', sp.from_date)
    if (sp.to_date) params.set('to_date', sp.to_date)

    const { bills, total } = await fetchBills(params)
    const totalPages = Math.ceil(total / 20)

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Billing"
                subtitle={`${total} bills`}
                action={
                    <Link href="/billing/new" style={{ textDecoration: 'none' }}>
                        <Button variant="gold" icon={<Plus className="w-4 h-4" />}>Create Bill</Button>
                    </Link>
                }
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {[
                    { label: 'All', value: '' },
                    { label: 'Paid', value: 'paid' },
                    { label: 'Partial', value: 'partial' },
                    { label: 'Due', value: 'due' },
                ].map(({ label, value }) => (
                    <Link
                        key={value}
                        href={`/billing${value ? `?payment_status=${value}` : ''}`}
                        className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                        style={{
                            background: sp.payment_status === value || (!value && !sp.payment_status) ? 'var(--color-forest-700)' : 'white',
                            color: sp.payment_status === value || (!value && !sp.payment_status) ? 'white' : 'rgba(44,44,44,0.6)',
                            border: '1px solid var(--color-warm-200)',
                            textDecoration: 'none',
                        }}
                    >
                        {label}
                    </Link>
                ))}
            </div>

            {bills.length === 0 ? (
                <div className="card">
                    <EmptyState
                        icon={Receipt}
                        title="No bills found"
                        description="Create a bill for a patient consultation or treatment."
                        action={<Link href="/billing/new" style={{ textDecoration: 'none' }}><Button variant="gold" icon={<Plus className="w-4 h-4" />}>Create Bill</Button></Link>}
                    />
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: 'var(--color-warm-50)', borderBottom: '1px solid var(--color-warm-200)' }}>
                                {['Bill No.', 'Patient', 'Date', 'Total', 'Status', ''].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(bills as Bill[]).map((b, idx) => (
                                <tr
                                    key={b.id}
                                    style={{ borderBottom: idx < bills.length - 1 ? '1px solid var(--color-warm-100)' : 'none' }}
                                >
                                    <td className="px-5 py-3.5">
                                        <span className="uhid">{b.bill_number}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-sm">{b.patients?.full_name ?? '—'}</p>
                                        {b.patients?.uhid && <span className="uhid">{b.patients.uhid}</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                                        {formatDate(b.bill_date)}
                                    </td>
                                    <td className="px-5 py-3.5 font-semibold text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                                        ₹{b.total_amount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <Badge variant={paymentBadge(b.payment_status)}>
                                            {b.payment_status.charAt(0).toUpperCase() + b.payment_status.slice(1)}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <Link href={`/billing/${b.id}`} className="text-xs font-medium" style={{ color: 'var(--color-gold-500)', textDecoration: 'none' }}>
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid var(--color-warm-200)' }}>
                            <p className="text-sm" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                {total} bills total
                            </p>
                            <div className="flex items-center gap-2">
                                {page > 1 && (
                                    <Link href={`/billing?${new URLSearchParams({ ...sp, page: String(page - 1) })}`} style={{ textDecoration: 'none' }}>
                                        <Button variant="secondary" size="sm">← Prev</Button>
                                    </Link>
                                )}
                                <span className="text-sm" style={{ color: 'rgba(44,44,44,0.5)' }}>{page}/{totalPages}</span>
                                {page < totalPages && (
                                    <Link href={`/billing?${new URLSearchParams({ ...sp, page: String(page + 1) })}`} style={{ textDecoration: 'none' }}>
                                        <Button variant="secondary" size="sm">Next →</Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
