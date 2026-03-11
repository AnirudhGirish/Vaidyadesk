import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import BillActions from './BillActions'

async function fetchBill(id: string) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/bills/${id}`, {
        headers: { Cookie: cookieHeader }, cache: 'no-store',
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data : null
}

async function fetchSettings() {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/settings`, { headers: { Cookie: cookieHeader }, cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data : null
}

function paymentBadge(status: string): 'green' | 'gold' | 'red' | 'gray' {
    const m: Record<string, 'green' | 'gold' | 'red' | 'gray'> = {
        paid: 'green', partial: 'gold', due: 'red', advance: 'gray'
    }
    return m[status] ?? 'gray'
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmt(n: number | null | undefined) {
    return (n ?? 0).toFixed(2)
}

interface BillItem {
    item_id: string; item_type: string; name: string;
    quantity: number; unit_price: number;
    gst_applicable: boolean; gst_rate: number;
    line_subtotal: number; gst_amount: number; line_total: number;
}

interface Payment {
    id: string; amount: number; payment_mode: string;
    payment_date: string; reference_number?: string; payment_type: string;
}

interface Bill {
    id: string; bill_number: string; bill_date: string; created_at: string;
    subtotal: number; discount_type: string; discount_value: number;
    discount_amount: number; total_amount: number;
    payment_status: string; notes?: string;
    bill_items: BillItem[];
    gst_breakdown?: Array<{ rate: number; taxable_amount: number; gst_amount: number }>;
    payments: Payment[];
    patients?: { full_name: string; uhid: string; phone: string; email?: string; date_of_birth?: string }
}

interface PageProps { params: Promise<{ id: string }> }

export default async function BillDetailPage({ params }: PageProps) {
    const { id } = await params
    const [billRaw, settings] = await Promise.all([fetchBill(id), fetchSettings()])
    if (!billRaw) notFound()
    const bill = billRaw as Bill
    const clinicName = settings?.clinic_name ?? "Dr. Shetty's Ayur Clinic"
    const clinicAddress = settings?.address ?? 'Bangalore, Karnataka'
    const clinicPhone = settings?.phone ?? ''
    const gstin = settings?.gst_number ?? ''

    // Derive totals from payments
    const totalPaid = (bill.payments ?? []).reduce((s: number, p: Payment) => s + Number(p.amount), 0)
    const balance = Math.max(0, Number(bill.total_amount) - totalPaid)
    const totalGst = (bill.gst_breakdown ?? []).reduce((s: number, g: { rate: number; taxable_amount: number; gst_amount: number }) => s + Number(g.gst_amount), 0)

    // Primary payment mode (last payment)
    const primaryPayment = bill.payments?.[bill.payments.length - 1]

    return (
        <div className="animate-fade-in max-w-3xl" id="bill-printable">
            {/* Back + actions */}
            <div className="flex items-center justify-between mb-6 no-print">
                <Link href="/billing" className="flex items-center gap-2 text-sm" style={{ color: 'rgba(44,44,44,0.5)', textDecoration: 'none' }}>
                    <ArrowLeft className="w-4 h-4" /> All Bills
                </Link>
                <BillActions
                    billId={id}
                    billNumber={bill.bill_number}
                    bill={bill}
                    clinic={{ clinic_name: clinicName, address: clinicAddress, phone: clinicPhone, gst_number: gstin }}
                />
            </div>

            {/* Bill Card */}
            <div className="card overflow-hidden print-card">
                {/* Header band */}
                <div className="px-7 py-6 text-white" style={{ background: 'var(--color-forest-700)' }}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-sans)' }}>
                                TAX INVOICE
                            </p>
                            <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                {clinicName}
                            </h2>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-sans)' }}>
                                {clinicAddress}{clinicPhone ? ` · ${clinicPhone}` : ''}
                            </p>
                            {gstin && (
                                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>
                                    GSTIN: {gstin}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-lg" style={{ fontFamily: 'var(--font-mono)' }}>{bill.bill_number}</p>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-sans)' }}>
                                {formatDate(bill.bill_date)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Patient info */}
                <div className="px-7 py-5" style={{ borderBottom: '1px solid var(--color-warm-200)', background: 'var(--color-warm-50)' }}>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                                Billed To
                            </p>
                            <p className="font-semibold" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
                                {bill.patients?.full_name ?? '—'}
                            </p>
                            <p className="text-sm mt-0.5" style={{ color: 'rgba(44,44,44,0.6)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                                {bill.patients?.uhid}
                            </p>
                            {bill.patients?.phone && (
                                <p className="text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>{bill.patients.phone}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="inline-flex flex-col items-end gap-1.5">
                                <Badge variant={paymentBadge(bill.payment_status)}>
                                    {bill.payment_status.charAt(0).toUpperCase() + bill.payment_status.slice(1)}
                                </Badge>
                                {primaryPayment && (
                                    <p className="text-xs" style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}>
                                        Mode: {primaryPayment.payment_mode.toUpperCase()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items table */}
                <div className="px-7 py-5">
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--color-warm-200)' }}>
                                {['#', 'Description', 'Qty', 'Rate (₹)', 'GST', 'Total (₹)'].map((h, i) => (
                                    <th
                                        key={h}
                                        className={`py-2 text-xs font-semibold uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'rgba(44,44,44,0.55)', fontFamily: 'var(--font-sans)', paddingRight: i === 5 ? 0 : 12 }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(bill.bill_items ?? []).map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--color-warm-100)' }}>
                                    <td className="py-3 text-sm" style={{ color: 'rgba(44,44,44,0.4)', paddingRight: 12 }}>{idx + 1}</td>
                                    <td className="py-3" style={{ paddingRight: 12 }}>
                                        <p className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>{item.name}</p>
                                        <p className="text-xs capitalize" style={{ color: 'rgba(44,44,44,0.4)' }}>{item.item_type}</p>
                                    </td>
                                    <td className="py-3 text-sm" style={{ color: 'rgba(44,44,44,0.7)', paddingRight: 12 }}>{item.quantity}</td>
                                    <td className="py-3 text-sm" style={{ fontFamily: 'var(--font-mono)', paddingRight: 12 }}>₹{fmt(item.unit_price)}</td>
                                    <td className="py-3 text-xs" style={{ color: 'rgba(44,44,44,0.5)', paddingRight: 12 }}>
                                        {item.gst_applicable ? `${item.gst_rate}%` : 'Nil'}<br />
                                        <span style={{ fontFamily: 'var(--font-mono)' }}>+₹{fmt(item.gst_amount)}</span>
                                    </td>
                                    <td className="py-3 text-sm font-semibold text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                                        ₹{fmt(item.line_total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="px-7 py-5 ml-auto" style={{ borderTop: '1px solid var(--color-warm-200)', background: 'var(--color-warm-50)' }}>
                    <div className="max-w-xs ml-auto space-y-2">
                        <div className="flex justify-between text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                            <span>Subtotal</span><span style={{ fontFamily: 'var(--font-mono)' }}>₹{fmt(bill.subtotal)}</span>
                        </div>
                        {totalGst > 0 && (
                            <div className="flex justify-between text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                                <span>GST</span><span style={{ fontFamily: 'var(--font-mono)' }}>+₹{fmt(totalGst)}</span>
                            </div>
                        )}
                        {bill.discount_amount > 0 && (
                            <div className="flex justify-between text-sm" style={{ color: '#C0392B' }}>
                                <span>Discount</span><span style={{ fontFamily: 'var(--font-mono)' }}>-₹{fmt(bill.discount_amount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2" style={{ borderTop: '2px solid var(--color-warm-300)', color: 'var(--color-forest-700)' }}>
                            <span>Total</span><span style={{ fontFamily: 'var(--font-mono)' }}>₹{fmt(bill.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm" style={{ color: 'rgba(44,44,44,0.6)' }}>
                            <span>Amount Paid</span><span style={{ fontFamily: 'var(--font-mono)' }}>₹{fmt(totalPaid)}</span>
                        </div>
                        {balance > 0 && (
                            <div className="flex justify-between text-sm font-semibold" style={{ color: '#C0392B' }}>
                                <span>Balance Due</span><span style={{ fontFamily: 'var(--font-mono)' }}>₹{fmt(balance)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payments breakdown — if multiple payments */}
                {bill.payments.length > 0 && (
                    <div className="px-7 py-4" style={{ borderTop: '1px solid var(--color-warm-200)' }}>
                        <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: 'rgba(44,44,44,0.5)' }}>
                            Payment History
                        </p>
                        <div className="space-y-2">
                            {bill.payments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="capitalize px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--color-forest-50)', color: 'var(--color-forest-700)' }}>
                                            {p.payment_mode}
                                        </span>
                                        <span style={{ color: 'rgba(44,44,44,0.5)' }}>{formatDate(p.payment_date)}</span>
                                        {p.reference_number && (
                                            <span className="text-xs" style={{ color: 'rgba(44,44,44,0.4)', fontFamily: 'var(--font-mono)' }}>#{p.reference_number}</span>
                                        )}
                                    </div>
                                    <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-700)' }}>
                                        ₹{fmt(p.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {bill.notes && (
                    <div className="px-7 py-4" style={{ borderTop: '1px solid var(--color-warm-200)' }}>
                        <p className="text-xs uppercase tracking-wider mb-1 font-medium" style={{ color: 'rgba(44,44,44,0.5)' }}>Notes</p>
                        <p className="text-sm" style={{ color: 'rgba(44,44,44,0.7)' }}>{bill.notes}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="px-7 py-4 text-center" style={{ borderTop: '1px solid var(--color-warm-200)', background: 'var(--color-warm-50)' }}>
                    <p className="text-xs" style={{ color: 'rgba(44,44,44,0.4)', fontFamily: 'var(--font-sans)' }}>
                        Thank you for choosing Dr. Shetty&apos;s Ayur Clinic. This is a computer-generated invoice.
                    </p>
                </div>
            </div>
        </div>
    )
}
