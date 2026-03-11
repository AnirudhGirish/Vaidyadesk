import { PageHeader } from '@/components/ui/PageHeader'
import { SettingsClient } from './SettingsClient'

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

async function fetchSettings() {
    try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
        const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const res = await fetch(`${base}/api/settings`, { headers: { Cookie: cookieHeader }, cache: 'no-store' })
        if (!res.ok) return null
        const json = await res.json()
        return json.success ? json.data : null
    } catch { return null }
}

export default async function SettingsPage() {
    const [session, settings] = await Promise.all([fetchSession(), fetchSettings()])

    if (!session) return null

    return (
        <div className="animate-fade-in max-w-2xl">
            <PageHeader title="Settings" subtitle="Clinic and account configuration" />
            <SettingsClient settings={settings} session={session} />
        </div>
    )
}
