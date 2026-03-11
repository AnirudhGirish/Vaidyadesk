'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/Badge'
import { ShieldCheck, ChevronDown, ChevronRight, Filter } from 'lucide-react'

/* ────────────────────────────────────── Types ── */
interface AuditProfile { full_name?: string; role?: string }

interface AuditLog {
    id: string
    table_name: string
    record_id: string
    action: 'INSERT' | 'UPDATE' | 'DELETE' | string
    changed_by: string
    changed_by_role: string
    old_values: Record<string, unknown> | null
    new_values: Record<string, unknown> | null
    ip_address?: string
    created_at: string
    profiles?: AuditProfile | null
}

interface Filters {
    table?: string
    action?: string
    from_date?: string
    to_date?: string
    page?: string
}

interface Props {
    initialLogs: AuditLog[]
    total: number
    filters: Filters
}

/* ────────────────────────────────────── Helpers ── */
const PER_PAGE = 25

function actionVariant(action: string): 'green' | 'gold' | 'red' | 'gray' {
    if (action === 'INSERT') return 'green'
    if (action === 'UPDATE') return 'gold'
    if (action === 'DELETE') return 'red'
    return 'gray'
}

function fmtDate(d: string) {
    return new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    })
}

/* Simple JSON diff — shows changed keys with old → new values */
function DiffView({ oldV, newV }: { oldV: Record<string, unknown> | null; newV: Record<string, unknown> | null }) {
    if (!oldV && !newV) return <p style={{ color: 'rgba(44,44,44,0.4)', fontSize: '0.8rem' }}>No data recorded.</p>

    const keys = Array.from(new Set([
        ...Object.keys(oldV ?? {}),
        ...Object.keys(newV ?? {}),
    ])).filter(k => JSON.stringify((oldV ?? {})[k]) !== JSON.stringify((newV ?? {})[k]))

    if (keys.length === 0) {
        return <p style={{ color: 'rgba(44,44,44,0.4)', fontSize: '0.8rem' }}>No field changes detected.</p>
    }

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
            <thead>
                <tr>
                    {['Field', 'Before', 'After'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '4px 10px 4px 0', color: 'rgba(44,44,44,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-sans)' }}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {keys.map(k => (
                    <tr key={k} style={{ borderTop: '1px solid var(--color-warm-100)' }}>
                        <td style={{ padding: '5px 10px 5px 0', color: 'var(--color-charcoal)', fontWeight: 600 }}>{k}</td>
                        <td style={{ padding: '5px 10px 5px 0', color: '#b91c1c', wordBreak: 'break-all' }}>
                            {oldV?.[k] !== undefined ? JSON.stringify(oldV[k]) : <span style={{ color: 'rgba(44,44,44,0.35)' }}>—</span>}
                        </td>
                        <td style={{ padding: '5px 0', color: '#166534', wordBreak: 'break-all' }}>
                            {newV?.[k] !== undefined ? JSON.stringify(newV[k]) : <span style={{ color: 'rgba(44,44,44,0.35)' }}>—</span>}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

/* ────────────────────────────────────── Row ── */
function AuditRow({ log }: { log: AuditLog }) {
    const [open, setOpen] = useState(false)
    const hasDiff = log.old_values || log.new_values

    return (
        <>
            <tr
                style={{ borderBottom: '1px solid var(--color-warm-100)', cursor: hasDiff ? 'pointer' : 'default' }}
                onClick={() => hasDiff && setOpen(o => !o)}
            >
                {/* Timestamp */}
                <td className="px-5 py-3 text-xs" style={{ color: 'rgba(44,44,44,0.55)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {fmtDate(log.created_at)}
                </td>
                {/* Action */}
                <td className="px-5 py-3">
                    <Badge variant={actionVariant(log.action)}>
                        {log.action}
                    </Badge>
                </td>
                {/* Table */}
                <td className="px-5 py-3 text-sm" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-mono)' }}>
                    {log.table_name}
                </td>
                {/* Record ID */}
                <td className="px-5 py-3">
                    <span className="uhid text-xs" title={log.record_id}>
                        {log.record_id?.slice(0, 8)}…
                    </span>
                </td>
                {/* Changed by */}
                <td className="px-5 py-3 text-sm" style={{ color: 'rgba(44,44,44,0.7)' }}>
                    {(log.profiles as AuditProfile)?.full_name ?? log.changed_by_role ?? '—'}
                </td>
                {/* Expand */}
                <td className="px-5 py-3 text-center">
                    {hasDiff ? (
                        open
                            ? <ChevronDown className="w-4 h-4 inline" style={{ color: 'var(--color-gold-500)' }} />
                            : <ChevronRight className="w-4 h-4 inline" style={{ color: 'rgba(44,44,44,0.3)' }} />
                    ) : null}
                </td>
            </tr>
            {open && hasDiff && (
                <tr>
                    <td colSpan={6} style={{ padding: '12px 20px 16px 40px', background: 'var(--color-warm-50)', borderBottom: '1px solid var(--color-warm-200)' }}>
                        <DiffView oldV={log.old_values} newV={log.new_values} />
                    </td>
                </tr>
            )}
        </>
    )
}

/* ────────────────────────────────────── Main Client Component ── */
const TABLE_OPTIONS = [
    'patients', 'visits', 'bills', 'bill_items', 'payments',
    'treatments', 'treatment_sessions', 'appointments', 'clinic_settings', 'profiles',
]

export default function AuditClient({ initialLogs, total, filters }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const [, startTransition] = useTransition()

    const currentPage = parseInt(filters.page ?? '1')
    const totalPages = Math.ceil(total / PER_PAGE)

    function applyFilters(newFilters: Partial<Filters>) {
        const merged = { ...filters, ...newFilters, page: '1' }
        const params = new URLSearchParams()
        Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
        startTransition(() => router.push(`${pathname}?${params.toString()}`))
    }

    function goPage(p: number) {
        const params = new URLSearchParams()
        Object.entries({ ...filters, page: String(p) }).forEach(([k, v]) => { if (v) params.set(k, v) })
        startTransition(() => router.push(`${pathname}?${params.toString()}`))
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-forest-50)' }}>
                    <ShieldCheck className="w-5 h-5" style={{ color: 'var(--color-forest-700)' }} />
                </div>
                <div>
                    <h1 className="section-title">Audit Log</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                        {total.toLocaleString()} events recorded
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
                <Filter className="w-4 h-4 shrink-0 mt-1" style={{ color: 'rgba(44,44,44,0.4)' }} />

                {/* Table filter */}
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>Table</label>
                    <select
                        className="input-base"
                        style={{ width: 180, fontSize: '0.82rem', padding: '6px 12px' }}
                        value={filters.table ?? ''}
                        onChange={e => applyFilters({ table: e.target.value || undefined })}
                    >
                        <option value="">All tables</option>
                        {TABLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Action filter */}
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>Action</label>
                    <select
                        className="input-base"
                        style={{ width: 140, fontSize: '0.82rem', padding: '6px 12px' }}
                        value={filters.action ?? ''}
                        onChange={e => applyFilters({ action: e.target.value || undefined })}
                    >
                        <option value="">All actions</option>
                        <option value="INSERT">INSERT</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>

                {/* Date from */}
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>From</label>
                    <input
                        type="date"
                        className="input-base"
                        style={{ width: 150, fontSize: '0.82rem', padding: '6px 12px' }}
                        value={filters.from_date ?? ''}
                        onChange={e => applyFilters({ from_date: e.target.value || undefined })}
                    />
                </div>

                {/* Date to */}
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>To</label>
                    <input
                        type="date"
                        className="input-base"
                        style={{ width: 150, fontSize: '0.82rem', padding: '6px 12px' }}
                        value={filters.to_date ?? ''}
                        onChange={e => applyFilters({ to_date: e.target.value || undefined })}
                    />
                </div>

                {/* Clear */}
                {(filters.table || filters.action || filters.from_date || filters.to_date) && (
                    <button
                        onClick={() => router.push(pathname)}
                        className="text-xs font-medium"
                        style={{ color: 'var(--color-gold-500)', fontFamily: 'var(--font-sans)', background: 'none', border: 'none', cursor: 'pointer', paddingBottom: 2 }}
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {initialLogs.length === 0 ? (
                    <div className="p-10 text-center">
                        <ShieldCheck className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-warm-300)' }} />
                        <p className="text-sm" style={{ color: 'rgba(44,44,44,0.4)', fontFamily: 'var(--font-sans)' }}>No audit events match the current filters.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: 'var(--color-warm-50)', borderBottom: '2px solid var(--color-warm-200)' }}>
                                {['Timestamp', 'Action', 'Table', 'Record ID', 'Changed By', ''].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {initialLogs.map(log => <AuditRow key={log.id} log={log} />)}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5">
                    <p className="text-sm" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                        Page {currentPage} of {totalPages} &middot; {total} total events
                    </p>
                    <div className="flex gap-2">
                        {currentPage > 1 && (
                            <button onClick={() => goPage(currentPage - 1)} className="btn-secondary text-xs px-3 py-1.5">
                                ← Prev
                            </button>
                        )}
                        {currentPage < totalPages && (
                            <button onClick={() => goPage(currentPage + 1)} className="btn-secondary text-xs px-3 py-1.5">
                                Next →
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
