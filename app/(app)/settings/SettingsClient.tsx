'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Save, Building2, User, Shield, BellOff, Users2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface ClinicSettings {
    id: string
    clinic_name?: string
    address?: string
    phone?: string
    email?: string
    gst_number?: string
    bill_prefix?: string
    default_gst_rate?: number
    max_frontdesk_discount?: number
}

interface UserSession {
    userId: string
    role: string
    fullName: string
    email: string
}

const gstRateOptions = [
    { value: '0', label: '0% (Nil)' },
    { value: '5', label: '5%' },
    { value: '12', label: '12%' },
    { value: '18', label: '18%' },
    { value: '28', label: '28%' },
]

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-forest-50)', border: '1px solid var(--color-forest-100)' }}
            >
                <Icon className="w-5 h-5" style={{ color: 'var(--color-forest-700)' }} />
            </div>
            <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-sans)' }}>{title}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>{subtitle}</p>
            </div>
        </div>
    )
}

export function SettingsClient({ settings, session }: { settings: ClinicSettings | null; session: UserSession }) {
    const router = useRouter()
    const isDoctor = session.role === 'doctor'

    // Clinic config form state
    const [clinicName, setClinicName] = useState(settings?.clinic_name ?? '')
    const [address, setAddress] = useState(settings?.address ?? '')
    const [phone, setPhone] = useState(settings?.phone ?? '')
    const [email, setEmail] = useState(settings?.email ?? '')
    const [gstNumber, setGstNumber] = useState(settings?.gst_number ?? '')
    const [billPrefix, setBillPrefix] = useState(settings?.bill_prefix ?? '')
    const [defaultGstRate, setDefaultGstRate] = useState(String(settings?.default_gst_rate ?? 18))
    const [maxDiscount, setMaxDiscount] = useState(String(settings?.max_frontdesk_discount ?? 10))

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)

    function showToast(msg: string) {
        setToast(msg)
        setTimeout(() => setToast(null), 3500)
    }

    async function handleSaveClinic(e: React.FormEvent) {
        e.preventDefault()
        if (!isDoctor) return
        setSaving(true)
        setError(null)

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clinic_name: clinicName || undefined,
                    address: address || undefined,
                    phone: phone || undefined,
                    email: email || undefined,
                    gst_number: gstNumber || undefined,
                    bill_prefix: billPrefix || undefined,
                    default_gst_rate: parseFloat(defaultGstRate),
                    max_frontdesk_discount: parseFloat(maxDiscount),
                }),
            })
            const json = await res.json()
            if (!res.ok || !json.success) {
                setError(json.error?.message ?? 'Failed to save settings')
                return
            }
            showToast('Settings saved successfully!')
            router.refresh()
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    // Staff management state (doctor only)
    interface StaffMember { id: string; email: string; full_name: string; role: string }
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [staffRoles, setStaffRoles] = useState<Record<string, string>>({})
    const [savingStaff, setSavingStaff] = useState<string | null>(null)

    useEffect(() => {
        if (!isDoctor) return
        fetch('/api/staff').then(r => r.json()).then(j => {
            if (j.success) {
                setStaff(j.data)
                const roleMap: Record<string, string> = {}
                j.data.forEach((s: StaffMember) => { roleMap[s.id] = s.role })
                setStaffRoles(roleMap)
            }
        })
    }, [isDoctor])

    const handleUpdateRole = async (staffId: string) => {
        setSavingStaff(staffId)
        const res = await fetch(`/api/staff/${staffId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: staffRoles[staffId] }),
        })
        setSavingStaff(null)
        if (res.ok) {
            showToast('Role updated successfully!')
            setStaff(prev => prev.map(s => s.id === staffId ? { ...s, role: staffRoles[staffId] } : s))
        } else {
            showToast('Failed to update role')
        }
    }

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up"
                    style={{ background: 'var(--color-forest-700)', color: 'white', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}
                >
                    <span>{toast}</span>
                    <button onClick={() => setToast(null)}><X className="w-4 h-4 opacity-70" /></button>
                </div>
            )}

            {/* Profile (read-only) */}
            <div className="card p-6">
                <SectionHeader icon={User} title="Profile" subtitle="Your account information" />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.55)', fontFamily: 'var(--font-sans)' }}>Full Name</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>{session.fullName || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.55)', fontFamily: 'var(--font-sans)' }}>Email</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>{session.email || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'rgba(44,44,44,0.55)', fontFamily: 'var(--font-sans)' }}>Role</p>
                        <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                            style={{
                                background: session.role === 'doctor' ? 'var(--color-forest-50)' : 'var(--color-gold-50)',
                                color: session.role === 'doctor' ? 'var(--color-forest-700)' : 'var(--color-gold-600)',
                                border: `1px solid ${session.role === 'doctor' ? 'var(--color-forest-200)' : 'var(--color-gold-200)'}`,
                            }}
                        >
                            {session.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Clinic Configuration */}
            <div className="card p-6">
                <SectionHeader icon={Building2} title="Clinic Configuration" subtitle={isDoctor ? 'Edit clinic details, billing settings, and GST' : 'Clinic configuration (doctor access only)'} />
                <form onSubmit={handleSaveClinic} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Clinic Name"
                            placeholder="Dr. Shetty's Ayur Clinic"
                            value={clinicName}
                            onChange={e => setClinicName(e.target.value)}
                            disabled={!isDoctor}
                        />
                        <Input
                            label="Bill Prefix"
                            placeholder="e.g. INV"
                            value={billPrefix}
                            onChange={e => setBillPrefix(e.target.value)}
                            disabled={!isDoctor}
                        />
                    </div>
                    <Input
                        label="Address"
                        placeholder="Clinic address"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        disabled={!isDoctor}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Phone"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            disabled={!isDoctor}
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="clinic@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={!isDoctor}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="GST Number (GSTIN)"
                            placeholder="e.g. 29ABCDE1234F1Z5"
                            value={gstNumber}
                            onChange={e => setGstNumber(e.target.value)}
                            disabled={!isDoctor}
                        />
                        <Select
                            label="Default GST Rate"
                            options={gstRateOptions}
                            value={defaultGstRate}
                            onChange={e => setDefaultGstRate(e.target.value)}
                            disabled={!isDoctor}
                        />
                    </div>
                    <Input
                        label="Max Frontdesk Discount (%)"
                        type="number" min="0" max="100"
                        placeholder="e.g. 10"
                        value={maxDiscount}
                        onChange={e => setMaxDiscount(e.target.value)}
                        disabled={!isDoctor}
                        hint="Maximum discount % that frontdesk staff can apply on bills"
                    />

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                            {error}
                        </p>
                    )}

                    {isDoctor && (
                        <div className="flex justify-end pt-1">
                            <Button type="submit" variant="primary" loading={saving} icon={<Save className="w-4 h-4" />}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    )}

                    {!isDoctor && (
                        <p className="text-xs" style={{ color: 'rgba(44,44,44,0.4)', fontFamily: 'var(--font-sans)' }}>
                            Only the doctor can edit clinic settings.
                        </p>
                    )}
                </form>
            </div>

            {/* Security */}
            <div className="card p-6">
                <SectionHeader icon={Shield} title="Security" subtitle="Password and authentication are managed via your email provider" />
                <div
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{ background: 'var(--color-warm-50)', border: '1px solid var(--color-warm-200)', color: 'rgba(44,44,44,0.6)', fontFamily: 'var(--font-sans)' }}
                >
                    Sign-in is handled securely via magic link / OAuth. To change your password, use the "Forgot password" link on the login page.
                </div>
            </div>

            {/* Notifications */}
            <div className="card p-6">
                <SectionHeader icon={BellOff} title="Notifications" subtitle="Email and push notifications" />
                <div
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{ background: 'var(--color-warm-50)', border: '1px solid var(--color-warm-200)', color: 'rgba(44,44,44,0.6)', fontFamily: 'var(--font-sans)' }}
                >
                    Notification preferences will be available in a future update.
                </div>
            </div>

            {/* Staff Management (doctor only) */}
            {isDoctor && (
                <div className="card p-6">
                    <SectionHeader icon={Users2} title="Staff Management" subtitle="Manage clinic staff accounts and role assignments" />
                    {staff.length === 0 ? (
                        <p className="text-sm" style={{ color: 'rgba(44,44,44,0.4)', fontFamily: 'var(--font-sans)' }}>
                            No staff accounts found. Accounts appear here after the user signs in with Google for the first time.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {staff.map(member => (
                                <div key={member.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                    style={{ background: 'var(--color-warm-50)', border: '1px solid var(--color-warm-100)' }}>
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                                        style={{ background: member.role === 'doctor' ? 'var(--color-forest-50)' : 'rgba(212,168,67,0.12)', color: member.role === 'doctor' ? 'var(--color-forest-700)' : 'var(--color-gold-600)' }}>
                                        {member.full_name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-charcoal)' }}>{member.full_name}</p>
                                        <p className="text-xs truncate" style={{ color: 'rgba(44,44,44,0.45)', fontFamily: 'var(--font-sans)' }}>{member.email}</p>
                                    </div>
                                    <select
                                        value={staffRoles[member.id] ?? member.role}
                                        onChange={e => setStaffRoles(prev => ({ ...prev, [member.id]: e.target.value }))}
                                        className="text-sm px-3 py-1.5 rounded-lg"
                                        style={{ border: '1px solid var(--color-warm-300)', background: 'white', color: 'var(--color-charcoal)', fontFamily: 'var(--font-sans)' }}
                                    >
                                        <option value="frontdesk">Front Desk</option>
                                        <option value="doctor">Doctor</option>
                                    </select>
                                    <Button
                                        variant="secondary" size="sm"
                                        loading={savingStaff === member.id}
                                        icon={<CheckCircle className="w-3.5 h-3.5" />}
                                        onClick={() => handleUpdateRole(member.id)}
                                    >
                                        Save
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Version */}
            <div className="text-center pb-2">
                <p className="text-xs" style={{ color: 'rgba(44,44,44,0.3)', fontFamily: 'var(--font-mono)' }}>
                    Vaidya Desk v1.0.0 · Built by SynkBuilds, Anirudh Girish and Chirag Biradar
                </p>
            </div>
        </div>
    )
}
