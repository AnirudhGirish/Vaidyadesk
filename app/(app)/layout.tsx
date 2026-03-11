import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomDock } from '@/components/layout/BottomDock'
import { MobileHeader } from '@/components/layout/MobileHeader'

async function getSession() {
    try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/auth/session`, {
            headers: { Cookie: cookieHeader },
            cache: 'no-store',
        })

        if (!res.ok) return null
        const data = await res.json()
        return data.success ? data.data : null
    } catch {
        return null
    }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-warm-50)' }}>
            <Sidebar
                role={session.role}
                fullName={session.fullName}
                email={session.email}
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <MobileHeader />
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-8 max-w-[1280px] mx-auto animate-fade-in">
                        {children}
                    </div>
                    {/* Spacer for mobile bottom dock */}
                    <div className="h-20 md:hidden" />
                </main>
            </div>
            <BottomDock role={session.role} />
        </div>
    )
}
