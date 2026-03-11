import { notFound } from 'next/navigation'
import AuditClient from './AuditClient'

interface SearchParams {
    table?: string
    action?: string
    from_date?: string
    to_date?: string
    page?: string
}

async function fetchAuditLogs(searchParams: SearchParams) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const params = new URLSearchParams()
    if (searchParams.table) params.set('table', searchParams.table)
    if (searchParams.action) params.set('action', searchParams.action)
    if (searchParams.from_date) params.set('from_date', searchParams.from_date)
    if (searchParams.to_date) params.set('to_date', searchParams.to_date)
    params.set('page', searchParams.page ?? '1')
    params.set('per_page', '25')

    const res = await fetch(`${base}/api/audit?${params.toString()}`, {
        headers: { Cookie: cookieHeader },
        cache: 'no-store',
    })

    if (res.status === 403) return null
    if (!res.ok) return { logs: [], total: 0 }
    const json = await res.json()
    return json.success ? { logs: json.data ?? [], total: json.pagination?.total ?? 0 } : { logs: [], total: 0 }
}

interface PageProps {
    searchParams: Promise<SearchParams>
}

export default async function AuditPage({ searchParams }: PageProps) {
    const sp = await searchParams
    const result = await fetchAuditLogs(sp)
    if (result === null) notFound()

    return (
        <AuditClient
            initialLogs={result.logs}
            total={result.total}
            filters={sp}
        />
    )
}
