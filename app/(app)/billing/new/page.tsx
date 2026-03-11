'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface CatalogueItem {
    id: string
    name: string
    category: string
    item_type: 'service' | 'medicine'
    base_price: number
    unit: string
    gst_applicable: boolean
    gst_rate: number
}

interface BillLine {
    item_id: string
    item_type: 'service' | 'medicine'
    name: string
    category: string
    unit: string
    quantity: number
    unit_price: number
    gst_applicable: boolean
    gst_rate: number
    // computed
    line_subtotal: number
    gst_amount: number
    line_total: number
}

interface PatientResult {
    id: string; full_name: string; uhid: string; phone: string
}

function calcLine(qty: number, unitPrice: number, gstApplicable: boolean, gstRate: number) {
    const line_subtotal = parseFloat((qty * unitPrice).toFixed(2))
    const gst_amount = gstApplicable ? parseFloat(((line_subtotal * gstRate) / 100).toFixed(2)) : 0
    return { line_subtotal, gst_amount, line_total: parseFloat((line_subtotal + gst_amount).toFixed(2)) }
}

const PAYMENT_MODES = ['cash', 'upi', 'card', 'netbanking', 'cheque']

export default function NewBillPage() {
    const router = useRouter()
    const sp = useSearchParams()
    const { toast } = useToast()

    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [patient, setPatient] = useState<PatientResult | null>(null)
    const [patientSearch, setPatientSearch] = useState('')
    const [patientResults, setPatientResults] = useState<PatientResult[]>([])
    const [loadingPatient, setLoadingPatient] = useState(false)

    const [catalogue, setCatalogue] = useState<CatalogueItem[]>([])
    const [catSearch, setCatSearch] = useState('')
    const [catLoading, setCatLoading] = useState(false)
    const [showCatDropdown, setShowCatDropdown] = useState(false)
    const catRef = useRef<HTMLDivElement>(null)
    const [lines, setLines] = useState<BillLine[]>([])
    const [discountType, setDiscountType] = useState<'none' | 'flat' | 'percentage'>('none')
    const [discountValue, setDiscountValue] = useState(0)
    const [notes, setNotes] = useState('')

    const [paymentMode, setPaymentMode] = useState('cash')
    const [amountPaid, setAmountPaid] = useState<string>('')
    const [submitting, setSubmitting] = useState(false)

    // Pre-fill patient from URL
    useEffect(() => {
        const pid = sp.get('patient_id')
        if (pid) {
            fetch(`/api/patients/${pid}`)
                .then(r => r.json())
                .then(j => { if (j.success) setPatient(j.data) })
        }
    }, [sp])

    // Close cat dropdown on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (catRef.current && !catRef.current.contains(e.target as Node)) setShowCatDropdown(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Search patients
    useEffect(() => {
        if (patientSearch.length < 2) { setPatientResults([]); return }
        setLoadingPatient(true)
        const t = setTimeout(async () => {
            const r = await fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}&per_page=5`)
            const j = await r.json()
            setPatientResults(j.data ?? [])
            setLoadingPatient(false)
        }, 300)
        return () => clearTimeout(t)
    }, [patientSearch])

    // Search catalogue
    useEffect(() => {
        if (catSearch.length < 1) { setCatalogue([]); setShowCatDropdown(false); return }
        setCatLoading(true)
        const t = setTimeout(async () => {
            const r = await fetch(`/api/catalogue?search=${encodeURIComponent(catSearch)}&per_page=10`)
            const j = await r.json()
            setCatalogue(j.data ?? [])
            setCatLoading(false)
            setShowCatDropdown(true)
        }, 300)
        return () => clearTimeout(t)
    }, [catSearch])

    const addLine = (item: CatalogueItem) => {
        const computed = calcLine(1, item.base_price, item.gst_applicable, item.gst_rate)
        setLines(prev => [...prev, {
            item_id: item.id,
            item_type: item.item_type,
            name: item.name,
            category: item.category,
            unit: item.unit,
            quantity: 1,
            unit_price: item.base_price,
            gst_applicable: item.gst_applicable,
            gst_rate: item.gst_rate,
            ...computed,
        }])
        setCatSearch('')
        setCatalogue([])
        setShowCatDropdown(false)
    }

    const updateLine = (idx: number, field: 'quantity' | 'unit_price', val: number) => {
        setLines(prev => prev.map((l, i) => {
            if (i !== idx) return l
            const q = field === 'quantity' ? val : l.quantity
            const p = field === 'unit_price' ? val : l.unit_price
            return { ...l, [field]: val, ...calcLine(q, p, l.gst_applicable, l.gst_rate) }
        }))
    }

    const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

    const subtotal = lines.reduce((s, l) => s + l.line_subtotal, 0)
    const totalGst = lines.reduce((s, l) => s + l.gst_amount, 0)
    const discountAmt = discountType === 'flat' ? discountValue
        : discountType === 'percentage' ? parseFloat(((subtotal + totalGst) * discountValue / 100).toFixed(2))
            : 0
    const grandTotal = Math.max(0, parseFloat((subtotal + totalGst - discountAmt).toFixed(2)))

    const paymentStatus = () => {
        const paid = parseFloat(amountPaid) || 0
        if (paid <= 0) return 'due'
        if (paid >= grandTotal) return 'paid'
        return 'partial'
    }

    const handleSubmit = async () => {
        if (!patient) { toast('error', 'Select a patient'); return }
        if (lines.length === 0) { toast('error', 'Add at least one item'); return }
        setSubmitting(true)

        const paidAmt = parseFloat(amountPaid) || 0

        const body = {
            patient_id: patient.id,
            items: lines.map(l => ({
                item_id: l.item_id,
                item_type: l.item_type,
                name: l.name,
                quantity: l.quantity,
                unit_price: l.unit_price,
                gst_applicable: l.gst_applicable,
                gst_rate: l.gst_rate,
            })),
            discount_type: discountType,
            discount_value: discountValue,
            notes: notes || undefined,
            initial_payments: paidAmt > 0 ? [{
                amount: paidAmt,
                payment_mode: paymentMode,
            }] : [],
        }

        const res = await fetch('/api/bills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        setSubmitting(false)

        if (res.ok) {
            const json = await res.json()
            toast('success', `Bill ${json.data.bill_number} created`)
            router.push(`/billing/${json.data.id}`)
        } else {
            const json = await res.json()
            toast('error', json.error?.message ?? 'Failed to create bill')
        }
    }

    const stepLabel = (n: number, label: string) => (
        <div className="flex items-center gap-2">
            <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{
                    background: step >= n ? 'var(--color-forest-700)' : 'var(--color-warm-200)',
                    color: step >= n ? 'white' : 'rgba(44,44,44,0.4)',
                }}
            >
                {n}
            </div>
            <span className="text-sm font-medium" style={{ color: step === n ? 'var(--color-charcoal)' : 'rgba(44,44,44,0.4)' }}>
                {label}
            </span>
        </div>
    )

    return (
        <div className="animate-fade-in max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/billing" style={{ textDecoration: 'none' }}>
                    <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
                </Link>
                <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                    Create Bill
                </h1>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-4 mb-8">
                {stepLabel(1, 'Patient')}
                <div className="flex-1 h-px" style={{ background: 'var(--color-warm-200)' }} />
                {stepLabel(2, 'Items')}
                <div className="flex-1 h-px" style={{ background: 'var(--color-warm-200)' }} />
                {stepLabel(3, 'Payment')}
            </div>

            {/* Step 1 — Patient */}
            {step === 1 && (
                <div className="card p-8 animate-fade-in">
                    <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                        Select Patient
                    </h2>
                    {patient ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--color-forest-50)', border: '1px solid var(--color-forest-100)' }}>
                                <div>
                                    <p className="font-semibold">{patient.full_name}</p>
                                    <span className="uhid mt-1 inline-block">{patient.uhid}</span>
                                    <p className="text-sm mt-1" style={{ color: 'rgba(44,44,44,0.5)' }}>{patient.phone}</p>
                                </div>
                                <button onClick={() => setPatient(null)} className="text-sm" style={{ color: 'rgba(44,44,44,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    Change
                                </button>
                            </div>
                            <Button variant="gold" onClick={() => setStep(2)} className="w-full">
                                Continue to Items →
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(44,44,44,0.4)' }} />
                                <input
                                    className="input-base pl-10"
                                    placeholder="Search patient by name, UHID or phone..."
                                    value={patientSearch}
                                    onChange={e => setPatientSearch(e.target.value)}
                                />
                            </div>
                            {patientResults.length > 0 && (
                                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-warm-200)' }}>
                                    {patientResults.map((p, idx) => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setPatient(p); setPatientSearch(''); setPatientResults([]) }}
                                            className="w-full text-left px-4 py-3 transition-colors"
                                            style={{ borderBottom: idx < patientResults.length - 1 ? '1px solid var(--color-warm-100)' : 'none', background: 'transparent', cursor: 'pointer' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-warm-50)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <p className="font-medium text-sm">{p.full_name}</p>
                                            <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>{p.uhid} · {p.phone}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {patientSearch.length >= 2 && !loadingPatient && patientResults.length === 0 && (
                                <p className="text-sm text-center py-4" style={{ color: 'rgba(44,44,44,0.4)' }}>No patients found</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2 — Items */}
            {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="card p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium">{patient?.full_name}</p>
                            <span className="uhid">{patient?.uhid}</span>
                        </div>
                        <button onClick={() => setStep(1)} className="text-xs" style={{ color: 'rgba(44,44,44,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
                    </div>

                    <div className="card p-6">
                        <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}>
                            Add Services / Medicines
                        </h3>

                        {/* Catalogue search */}
                        <div className="relative mb-4" ref={catRef}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(44,44,44,0.4)' }} />
                            <input
                                className="input-base pl-10"
                                placeholder="Search catalogue by name..."
                                value={catSearch}
                                onChange={e => setCatSearch(e.target.value)}
                                onFocus={() => catalogue.length > 0 && setShowCatDropdown(true)}
                            />
                            {catLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                                    style={{ borderColor: 'var(--color-forest-400)', borderTopColor: 'transparent' }} />
                            )}
                            {showCatDropdown && catalogue.length > 0 && (
                                <div
                                    className="absolute top-full left-0 right-0 z-40 rounded-xl overflow-hidden mt-1"
                                    style={{ background: 'white', border: '1px solid var(--color-warm-200)', boxShadow: 'var(--shadow-warm-lg)', maxHeight: 280, overflowY: 'auto' }}
                                >
                                    {catalogue.map((item, idx) => (
                                        <button
                                            key={item.id}
                                            onClick={() => addLine(item)}
                                            className="w-full text-left px-4 py-3 transition-colors flex items-center justify-between"
                                            style={{ borderBottom: idx < catalogue.length - 1 ? '1px solid var(--color-warm-100)' : 'none', background: 'transparent', cursor: 'pointer' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-warm-50)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                                    {item.item_type} · {item.unit} · GST {item.gst_rate === 0 ? 'Nil' : `${item.gst_rate}%`}
                                                </p>
                                            </div>
                                            <span className="font-semibold text-sm shrink-0 ml-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-700)' }}>
                                                ₹{item.base_price}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showCatDropdown && !catLoading && catalogue.length === 0 && catSearch.length >= 1 && (
                                <div
                                    className="absolute top-full left-0 right-0 z-40 rounded-xl px-4 py-3 mt-1 text-sm"
                                    style={{ background: 'white', border: '1px solid var(--color-warm-200)', color: 'rgba(44,44,44,0.5)' }}
                                >
                                    No items found. <a href="/catalogue" style={{ color: 'var(--color-forest-700)', textDecoration: 'none' }}>Add to catalogue →</a>
                                </div>
                            )}
                        </div>

                        {/* Line items */}
                        {lines.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-warm-50)', borderBottom: '1px solid var(--color-warm-200)' }}>
                                            {['Item', 'Qty', 'Rate (₹)', 'GST', 'Total (₹)', ''].map(h => (
                                                <th key={h} className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((l, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--color-warm-100)' }}>
                                                <td className="px-3 py-2.5">
                                                    <p className="text-sm font-medium">{l.name}</p>
                                                    <p className="text-xs" style={{ color: 'rgba(44,44,44,0.4)' }}>{l.unit}</p>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <input
                                                        type="number" min={1} value={l.quantity}
                                                        onChange={e => updateLine(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="input-base py-1 text-center"
                                                        style={{ width: 56, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <input
                                                        type="number" min={0} value={l.unit_price}
                                                        onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        className="input-base py-1 text-right"
                                                        style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td className="px-3 py-2.5 text-xs" style={{ color: 'rgba(44,44,44,0.5)' }}>
                                                    {l.gst_applicable ? `${l.gst_rate}%` : 'Nil'}<br />
                                                    <span style={{ fontFamily: 'var(--font-mono)' }}>+₹{l.gst_amount}</span>
                                                </td>
                                                <td className="px-3 py-2.5 font-semibold text-sm text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                                                    ₹{l.line_total}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                        <Trash2 className="w-4 h-4" style={{ color: '#C0392B' }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {lines.length === 0 && (
                            <p className="text-sm text-center py-4" style={{ color: 'rgba(44,44,44,0.4)' }}>
                                No items added yet. Search above to add services or medicines.
                            </p>
                        )}
                    </div>

                    {/* Discount + Notes */}
                    <div className="card p-6 grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>Notes (optional)</label>
                            <textarea
                                className="input-base resize-none" rows={3}
                                value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Additional notes..."
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>Discount Type</label>
                                <div className="flex gap-2">
                                    {(['none', 'flat', 'percentage'] as const).map(t => (
                                        <button key={t} type="button"
                                            onClick={() => { setDiscountType(t); setDiscountValue(0) }}
                                            className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                                            style={{
                                                border: `1px solid ${discountType === t ? 'var(--color-forest-700)' : 'var(--color-warm-300)'}`,
                                                background: discountType === t ? 'var(--color-forest-50)' : 'white',
                                                color: discountType === t ? 'var(--color-forest-700)' : 'rgba(44,44,44,0.55)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {t === 'percentage' ? '%' : t === 'flat' ? '₹ Flat' : 'None'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {discountType !== 'none' && (
                                <Input
                                    label={`Discount ${discountType === 'percentage' ? '(%)' : '(₹)'}`}
                                    type="number" min={0}
                                    value={String(discountValue)}
                                    onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="card p-6">
                        <div className="space-y-2 mb-5">
                            <div className="flex justify-between text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                                <span>Subtotal</span><span style={{ fontFamily: 'var(--font-mono)' }}>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                                <span>GST</span><span style={{ fontFamily: 'var(--font-mono)' }}>₹{totalGst.toFixed(2)}</span>
                            </div>
                            {discountAmt > 0 && (
                                <div className="flex justify-between text-sm" style={{ color: '#C0392B' }}>
                                    <span>Discount</span><span style={{ fontFamily: 'var(--font-mono)' }}>-₹{discountAmt.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-lg pt-2" style={{ borderTop: '2px solid var(--color-warm-200)', color: 'var(--color-forest-700)' }}>
                                <span>Grand Total</span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>₹{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <Button variant="gold" onClick={() => setStep(3)} disabled={lines.length === 0} className="w-full">
                            Continue to Payment →
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3 — Payment */}
            {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="card p-6">
                        <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)', fontSize: '1.15rem' }}>
                            Payment Details
                        </h3>
                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-sm font-medium block mb-3" style={{ color: 'rgba(44,44,44,0.8)', fontFamily: 'var(--font-sans)' }}>
                                    Payment Mode
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {PAYMENT_MODES.map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentMode(m)}
                                            className="px-3 py-2.5 rounded-lg text-sm font-medium transition-all capitalize"
                                            style={{
                                                border: `1px solid ${paymentMode === m ? 'var(--color-forest-700)' : 'var(--color-warm-300)'}`,
                                                background: paymentMode === m ? 'var(--color-forest-50)' : 'white',
                                                color: paymentMode === m ? 'var(--color-forest-700)' : 'rgba(44,44,44,0.6)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Input
                                    label={`Amount Paid (₹) — Total: ₹${grandTotal.toFixed(2)}`}
                                    type="number" min={0} max={grandTotal}
                                    placeholder={String(grandTotal.toFixed(2))}
                                    value={amountPaid}
                                    onChange={e => setAmountPaid(e.target.value)}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button className="text-xs px-3 py-1 rounded-full border"
                                        style={{ borderColor: 'var(--color-forest-200)', color: 'var(--color-forest-700)', cursor: 'pointer', background: 'none' }}
                                        onClick={() => setAmountPaid(String(grandTotal.toFixed(2)))}>
                                        Full
                                    </button>
                                    <button className="text-xs px-3 py-1 rounded-full border"
                                        style={{ borderColor: 'var(--color-warm-300)', color: 'rgba(44,44,44,0.5)', cursor: 'pointer', background: 'none' }}
                                        onClick={() => setAmountPaid('0')}>
                                        Due
                                    </button>
                                </div>
                                <p className="text-xs mt-2" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                                    Status: <Badge variant={
                                        paymentStatus() === 'paid' ? 'green' : paymentStatus() === 'partial' ? 'gold' : 'red'
                                    }>{paymentStatus()}</Badge>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-5">
                        <div className="space-y-1.5 mb-4">
                            <div className="flex justify-between text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                                <span>Patient</span><span className="font-medium">{patient?.full_name}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                                <span>Items</span><span>{lines.length}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                                <span>Total</span>
                                <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-700)' }}>
                                    ₹{grandTotal.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                                <span>Amount Paid</span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>₹{parseFloat(amountPaid) || 0}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="gold" onClick={handleSubmit} loading={submitting} className="flex-1">
                                Create Bill
                            </Button>
                            <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
