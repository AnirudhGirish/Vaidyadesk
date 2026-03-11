'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pill, Stethoscope, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'

type Tab = 'service' | 'medicine'

const categoryOptions = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'therapy', label: 'Therapy' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'package', label: 'Package' },
    { value: 'other', label: 'Other' },
]

const durationOptions = [
    { value: 'single', label: 'Single Session' },
    { value: 'package', label: 'Package (Multi-day)' },
]

const medicineTypeOptions = [
    { value: 'ayurvedic', label: 'Ayurvedic' },
    { value: 'general', label: 'General' },
]

const gstRateOptions = [
    { value: '0', label: '0% (Nil)' },
    { value: '5', label: '5%' },
    { value: '12', label: '12%' },
    { value: '18', label: '18%' },
    { value: '28', label: '28%' },
]

function FormRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>
                {label}{required && <span style={{ color: 'var(--color-gold-500)' }} className="ml-0.5">*</span>}
            </label>
            {children}
        </div>
    )
}

export function CatalogueClient({ role }: { role?: string }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState<Tab>('service')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)

    // Service form state
    const [svcName, setSvcName] = useState('')
    const [svcCategory, setSvcCategory] = useState('')
    const [svcPrice, setSvcPrice] = useState('')
    const [svcGst, setSvcGst] = useState(false)
    const [svcGstRate, setSvcGstRate] = useState('18')
    const [svcDurationType, setSvcDurationType] = useState('single')
    const [svcPackageDays, setSvcPackageDays] = useState('')

    // Medicine form state
    const [medName, setMedName] = useState('')
    const [medType, setMedType] = useState('ayurvedic')
    const [medForm, setMedForm] = useState('')
    const [medUnit, setMedUnit] = useState('')
    const [medPrice, setMedPrice] = useState('')
    const [medGst, setMedGst] = useState(false)
    const [medGstRate, setMedGstRate] = useState('18')

    function resetForms() {
        setSvcName(''); setSvcCategory(''); setSvcPrice(''); setSvcGst(false); setSvcGstRate('18'); setSvcDurationType('single'); setSvcPackageDays('')
        setMedName(''); setMedType('ayurvedic'); setMedForm(''); setMedUnit(''); setMedPrice(''); setMedGst(false); setMedGstRate('18')
        setError(null)
    }

    function showToast(msg: string) {
        setToast(msg)
        setTimeout(() => setToast(null), 3500)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            let body: Record<string, unknown>
            let url: string

            if (tab === 'service') {
                if (!svcName || !svcPrice) { setError('Name and price are required.'); setLoading(false); return }
                body = {
                    name: svcName,
                    category: svcCategory || undefined,
                    base_price: parseFloat(svcPrice),
                    gst_applicable: svcGst,
                    gst_rate: svcGst ? parseFloat(svcGstRate) : 0,
                    duration_type: svcDurationType,
                    ...(svcDurationType === 'package' && svcPackageDays ? { package_days: parseInt(svcPackageDays) } : {}),
                }
                url = '/api/catalogue/services'
            } else {
                if (!medName) { setError('Name is required.'); setLoading(false); return }
                body = {
                    name: medName,
                    type: medType,
                    form: medForm || undefined,
                    unit: medUnit || undefined,
                    price_per_unit: medPrice ? parseFloat(medPrice) : undefined,
                    gst_applicable: medGst,
                    gst_rate: medGst ? parseFloat(medGstRate) : 0,
                }
                url = '/api/catalogue/medicines'
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const json = await res.json()

            if (!res.ok || !json.success) {
                setError(json.error?.message ?? 'Failed to add item. Please check your inputs.')
                setLoading(false)
                return
            }

            setOpen(false)
            resetForms()
            showToast(`${tab === 'service' ? 'Service' : 'Medicine'} added successfully!`)
            router.refresh()
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const isDoctor = role === 'doctor'

    return (
        <>
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

            {/* Add Button — only for doctors */}
            {isDoctor && (
                <Button
                    variant="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => { resetForms(); setOpen(true) }}
                >
                    Add Item
                </Button>
            )}

            {/* Modal */}
            <Modal open={open} onClose={() => setOpen(false)} title="Add Catalogue Item" size="md">
                {/* Tab switcher */}
                <div className="flex rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--color-warm-200)', background: 'var(--color-warm-50)' }}>
                    {(['service', 'medicine'] as Tab[]).map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => { setTab(t); setError(null) }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all"
                            style={{
                                background: tab === t ? 'white' : 'transparent',
                                color: tab === t ? 'var(--color-forest-700)' : 'rgba(44,44,44,0.5)',
                                borderRadius: t === 'service' ? '10px 0 0 10px' : '0 10px 10px 0',
                                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            }}
                        >
                            {t === 'service' ? <Stethoscope className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                            {t === 'service' ? 'Service / Treatment' : 'Medicine'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {tab === 'service' ? (
                        <>
                            <Input
                                label="Service Name" required
                                placeholder="e.g. Panchakarma Session"
                                value={svcName} onChange={e => setSvcName(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Category"
                                    options={categoryOptions}
                                    placeholder="Select category"
                                    value={svcCategory} onChange={e => setSvcCategory(e.target.value)}
                                />
                                <Input
                                    label="Base Price (₹)" required type="number" min="0" step="0.01"
                                    placeholder="e.g. 1500"
                                    value={svcPrice} onChange={e => setSvcPrice(e.target.value)}
                                />
                            </div>
                            <Select
                                label="Duration Type"
                                options={durationOptions}
                                value={svcDurationType} onChange={e => setSvcDurationType(e.target.value)}
                            />
                            {svcDurationType === 'package' && (
                                <Input
                                    label="Package Days" required type="number" min="1"
                                    placeholder="e.g. 7"
                                    value={svcPackageDays} onChange={e => setSvcPackageDays(e.target.value)}
                                />
                            )}
                            <div className="flex items-center gap-3 py-1">
                                <button
                                    type="button"
                                    onClick={() => setSvcGst(!svcGst)}
                                    className="relative w-10 h-5 rounded-full transition-colors"
                                    style={{ background: svcGst ? 'var(--color-forest-700)' : 'var(--color-warm-300)' }}
                                    aria-label="Toggle GST"
                                >
                                    <span
                                        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                                        style={{ transform: svcGst ? 'translateX(20px)' : 'translateX(0)' }}
                                    />
                                </button>
                                <span className="text-sm" style={{ color: 'rgba(44,44,44,0.75)', fontFamily: 'var(--font-sans)' }}>GST Applicable</span>
                            </div>
                            {svcGst && (
                                <Select
                                    label="GST Rate"
                                    options={gstRateOptions}
                                    value={svcGstRate} onChange={e => setSvcGstRate(e.target.value)}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            <Input
                                label="Medicine Name" required
                                placeholder="e.g. Ashwagandha Churna"
                                value={medName} onChange={e => setMedName(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Type"
                                    options={medicineTypeOptions}
                                    value={medType} onChange={e => setMedType(e.target.value)}
                                />
                                <Input
                                    label="Form"
                                    placeholder="e.g. Tablet, Powder, Oil"
                                    value={medForm} onChange={e => setMedForm(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Unit"
                                    placeholder="e.g. 100g, 60 tabs"
                                    value={medUnit} onChange={e => setMedUnit(e.target.value)}
                                />
                                <Input
                                    label="Price per Unit (₹)" type="number" min="0" step="0.01"
                                    placeholder="e.g. 250"
                                    value={medPrice} onChange={e => setMedPrice(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3 py-1">
                                <button
                                    type="button"
                                    onClick={() => setMedGst(!medGst)}
                                    className="relative w-10 h-5 rounded-full transition-colors"
                                    style={{ background: medGst ? 'var(--color-forest-700)' : 'var(--color-warm-300)' }}
                                    aria-label="Toggle GST"
                                >
                                    <span
                                        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                                        style={{ transform: medGst ? 'translateX(20px)' : 'translateX(0)' }}
                                    />
                                </button>
                                <span className="text-sm" style={{ color: 'rgba(44,44,44,0.75)', fontFamily: 'var(--font-sans)' }}>GST Applicable</span>
                            </div>
                            {medGst && (
                                <Select
                                    label="GST Rate"
                                    options={gstRateOptions}
                                    value={medGstRate} onChange={e => setMedGstRate(e.target.value)}
                                />
                            )}
                        </>
                    )}

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5" style={{ fontFamily: 'var(--font-sans)' }}>
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
                        <Button type="submit" variant="primary" loading={loading} className="flex-1">
                            {loading ? 'Adding...' : 'Add Item'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    )
}
