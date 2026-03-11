'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, Users, UserRound, CalendarDays,
    Receipt, BookOpen, BarChart3, Settings, LogOut, ClipboardList, ShieldCheck
} from 'lucide-react'
import { VaidyaLogo } from '@/components/common/VaidyaLogo'
import { cn } from '@/lib/utils/cn'

interface NavItem {
    icon: React.ElementType
    label: string
    href: string
}

const doctorNav: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/doctor/dashboard' },
    { icon: UserRound, label: 'Patients', href: '/patients' },
    { icon: Receipt, label: 'Billing', href: '/billing' },
    { icon: ClipboardList, label: 'Treatments', href: '/treatments' },
    { icon: Users, label: 'Queue', href: '/doctor/queue' },
    { icon: CalendarDays, label: 'Appointments', href: '/appointments' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
    { icon: ShieldCheck, label: 'Audit Log', href: '/audit' },
    { icon: BookOpen, label: 'Catalogue', href: '/catalogue' },
    { icon: Settings, label: 'Settings', href: '/settings' },
]

const frontdeskNav: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/frontdesk/dashboard' },
    { icon: Users, label: 'Queue', href: '/frontdesk/queue' },
    { icon: UserRound, label: 'Patients', href: '/patients' },
    { icon: CalendarDays, label: 'Appointments', href: '/appointments' },
    { icon: Receipt, label: 'Billing', href: '/billing' },
]

interface SidebarProps {
    role: string
    fullName: string
    email: string
}

export function Sidebar({ role, fullName, email }: SidebarProps) {
    const pathname = usePathname()
    const navItems = role === 'doctor' ? doctorNav : frontdeskNav

    const handleLogout = async () => {
        // POST to server-side logout so it can clear HttpOnly session cookies
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/login'
    }

    const initials = fullName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    return (
        <aside
            className="hidden md:flex flex-col h-screen sticky top-0 shrink-0"
            style={{ width: 240, background: 'var(--color-forest-700)' }}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-3 px-5 py-6"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(184,146,42,0.25)' }}
                >
                    <VaidyaLogo className="w-5 h-5" style={{ color: 'var(--color-gold-400)' }} />
                </div>
                <div className="min-w-0">
                    <p
                        className="font-semibold leading-tight truncate"
                        style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'white' }}
                    >
                        Dr. Shetty&apos;s
                    </p>
                    <p className="text-xs tracking-widest" style={{ color: 'var(--color-gold-400)', fontFamily: 'var(--font-sans)' }}>
                        AYUR CLINIC
                    </p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map(({ icon: Icon, label, href }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group',
                            )}
                            style={{
                                color: active ? 'white' : 'rgba(255,255,255,0.6)',
                                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderLeft: active ? `3px solid var(--color-gold-400)` : '3px solid transparent',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: active ? 500 : 400,
                            }}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {label}
                        </Link>
                    )
                })}
            </nav>

            {/* User */}
            <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-2">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
                        style={{ background: 'var(--color-gold-500)', color: 'white', fontFamily: 'var(--font-sans)' }}
                    >
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate text-white" style={{ fontFamily: 'var(--font-sans)' }}>
                            {fullName}
                        </p>
                        <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                                background: role === 'doctor' ? 'rgba(212,168,67,0.2)' : 'rgba(255,255,255,0.1)',
                                color: role === 'doctor' ? 'var(--color-gold-400)' : 'rgba(255,255,255,0.6)',
                                fontFamily: 'var(--font-sans)',
                            }}
                        >
                            {role === 'doctor' ? 'Doctor' : 'Front Desk'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200"
                    style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)' }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(192,57,43,0.2)'
                        e.currentTarget.style.color = '#f87171'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                    }}
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
