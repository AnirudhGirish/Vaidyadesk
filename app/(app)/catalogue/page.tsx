import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { CatalogueClient } from './CatalogueClient'

async function fetchCatalogue(params: URLSearchParams) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/catalogue?${params}`, {
        headers: { Cookie: cookieHeader }, cache: 'no-store',
    })
    if (!res.ok) return { items: [], total: 0 }
    const json = await res.json()
    return { items: json.data ?? [], total: json.meta?.total ?? 0 }
}

async function fetchSession() {
    try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
        const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const res = await fetch(`${base}/api/auth/session`, { headers: { Cookie: cookieHeader }, cache: 'no-store' })
        if (!res.ok) return null
        const json = await res.json()
        return json.success ? json.data : null
    } catch { return null }
}

function categoryBadge(cat: string): 'green' | 'gold' | 'gray' {
    const m: Record<string, 'green' | 'gold' | 'gray'> = {
        consultation: 'green', medicine: 'gold', service: 'green', therapy: 'gold',
    }
    return m[cat?.toLowerCase()] ?? 'gray'
}

interface CatItem {
    id: string; name: string; category: string; base_price: number;
    gst_rate: number; unit: string; hsn_code?: string; is_active: boolean
}

interface PageProps {
    searchParams: Promise<{ category?: string; search?: string }>
}

export default async function CataloguePage({ searchParams }: PageProps) {
    const sp = await searchParams
    const params = new URLSearchParams({ per_page: '100' })
    if (sp.category) params.set('category', sp.category)
    if (sp.search) params.set('search', sp.search)

    const [{ items, total }, session] = await Promise.all([
        fetchCatalogue(params),
        fetchSession(),
    ])

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Catalogue"
                subtitle={`${total} items`}
                action={<CatalogueClient role={session?.role} />}
            />

            {items.length === 0 ? (
                <div className="card">
                    <EmptyState
                        icon={BookOpen}
                        title="Catalogue is empty"
                        description="Add services and medicines to get started with billing."
                    />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(items as CatItem[]).map(item => (
                        <div
                            key={item.id}
                            className="card-hover p-5 flex flex-col gap-3"
                            style={{ opacity: item.is_active ? 1 : 0.5 }}
                        >
                            <div className="flex items-start justify-between">
                                <h4 className="font-semibold pr-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-charcoal)', fontSize: '0.95rem', lineHeight: 1.3 }}>
                                    {item.name}
                                </h4>
                                <Badge variant={categoryBadge(item.category)} className="shrink-0 capitalize">
                                    {item.category}
                                </Badge>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xl font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-700)' }}>
                                        ₹{item.base_price}
                                    </p>
                                    <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                        {item.unit} · GST {item.gst_rate === 0 ? 'Nil' : `${item.gst_rate}%`}
                                        {item.hsn_code && ` · HSN ${item.hsn_code}`}
                                    </p>
                                </div>
                                {!item.is_active && (
                                    <Badge variant="red">Inactive</Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
