'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, UserRound, CalendarDays, Receipt } from 'lucide-react'

interface DockItem {
    icon: React.ElementType
    label: string
    href: string
}

const doctorDock: DockItem[] = [
    { icon: LayoutDashboard, label: 'Home', href: '/doctor/dashboard' },
    { icon: Users, label: 'Queue', href: '/doctor/queue' },
    { icon: UserRound, label: 'Patients', href: '/patients' },
    { icon: CalendarDays, label: 'Appts', href: '/appointments' },
    { icon: Receipt, label: 'Billing', href: '/billing' },
]

const frontdeskDock: DockItem[] = [
    { icon: LayoutDashboard, label: 'Home', href: '/frontdesk/dashboard' },
    { icon: Users, label: 'Queue', href: '/frontdesk/queue' },
    { icon: UserRound, label: 'Patients', href: '/patients' },
    { icon: CalendarDays, label: 'Appts', href: '/appointments' },
    { icon: Receipt, label: 'Billing', href: '/billing' },
]

export function BottomDock({ role }: { role: string }) {
    const pathname = usePathname()
    const items = role === 'doctor' ? doctorDock : frontdeskDock

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe"
            style={{
                background: 'white',
                borderTop: '1px solid var(--color-warm-200)',
                boxShadow: '0 -4px 20px rgba(26,61,43,0.08)',
            }}
        >
            <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                {items.map(({ icon: Icon, label, href }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-all duration-200"
                            style={{
                                color: active ? 'var(--color-gold-500)' : 'rgba(44,44,44,0.45)',
                                minHeight: 56,
                            }}
                        >
                            <Icon className="w-5 h-5" style={{ strokeWidth: active ? 2.5 : 1.8 }} />
                            <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-sans)' }}>
                                {label}
                            </span>
                            {active && (
                                <span
                                    className="absolute -top-px w-8 h-0.5 rounded-full"
                                    style={{ background: 'var(--color-gold-500)' }}
                                />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
