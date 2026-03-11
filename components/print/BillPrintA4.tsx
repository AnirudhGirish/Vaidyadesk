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

export interface BillPrintData {
    id: string;
    bill_number: string;
    bill_date: string;
    subtotal: number;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    total_amount: number;
    payment_status: string;
    notes?: string;
    bill_items: BillItem[];
    gst_breakdown?: Array<{ rate: number; taxable_amount: number; gst_amount: number }>;
    payments: Payment[];
    patients?: { full_name: string; uhid: string; phone: string; date_of_birth?: string; gender?: string };
}

export interface ClinicInfo {
    clinic_name: string;
    address?: string;
    phone?: string;
    email?: string;
    gst_number?: string;
    logo_url?: string;
}

function fmt(n: number | null | undefined) { return (n ?? 0).toFixed(2) }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}
function calcAge(dob?: string) {
    if (!dob) return null
    const birth = new Date(dob); const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
    return age
}

export function BillPrintA4({ bill, clinic }: { bill: BillPrintData; clinic: ClinicInfo }) {
    const totalPaid = (bill.payments ?? []).reduce((s, p) => s + Number(p.amount), 0)
    const balance = Math.max(0, Number(bill.total_amount) - totalPaid)
    const totalGst = (bill.gst_breakdown ?? []).reduce((s, g) => s + Number(g.gst_amount), 0)
    const age = calcAge(bill.patients?.date_of_birth)

    return (
        <div className="print-template" style={{
            width: '210mm', minHeight: '270mm', margin: '0 auto',
            fontFamily: 'Georgia, serif', background: 'white', color: '#1a1a1a',
            fontSize: '10pt', lineHeight: 1.5, padding: '0',
        }}>
            {/* Header */}
            <div style={{ background: '#1A3D2B', color: 'white', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontSize: '7pt', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', marginBottom: 4, fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>Tax Invoice</p>
                    <h1 style={{ fontSize: '18pt', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>{clinic.clinic_name}</h1>
                    {clinic.address && <p style={{ fontSize: '8pt', color: 'rgba(255,255,255,0.65)', margin: 0, fontFamily: 'Arial, sans-serif' }}>{clinic.address}{clinic.phone ? ` · ${clinic.phone}` : ''}</p>}
                    {clinic.gst_number && <p style={{ fontSize: '7.5pt', color: 'rgba(255,255,255,0.5)', margin: '3px 0 0', fontFamily: 'Courier, monospace' }}>GSTIN: {clinic.gst_number}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13pt', fontWeight: 700, fontFamily: 'Courier, monospace', margin: '0 0 4px 0' }}>{bill.bill_number}</p>
                    <p style={{ fontSize: '8pt', color: 'rgba(255,255,255,0.65)', margin: 0, fontFamily: 'Arial, sans-serif' }}>{fmtDate(bill.bill_date)}</p>
                </div>
            </div>

            {/* Patient info band */}
            <div style={{ background: '#FAF8F5', padding: '14px 28px', borderBottom: '1px solid #EDE7DC', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontSize: '6.5pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888', margin: '0 0 5px 0' }}>Billed To</p>
                    <p style={{ fontSize: '12pt', fontWeight: 700, margin: '0 0 2px 0' }}>{bill.patients?.full_name ?? '—'}</p>
                    <p style={{ fontSize: '7.5pt', fontFamily: 'Courier, monospace', color: '#666', background: '#EDE7DC', display: 'inline-block', padding: '1px 8px', borderRadius: 3, margin: '0 0 3px' }}>{bill.patients?.uhid}</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 3 }}>
                        {bill.patients?.phone && <p style={{ fontSize: '8.5pt', color: '#555', fontFamily: 'Arial, sans-serif', margin: 0 }}>{bill.patients.phone}</p>}
                        {age !== null && <p style={{ fontSize: '8.5pt', color: '#555', fontFamily: 'Arial, sans-serif', margin: 0 }}>{age} yrs{bill.patients?.gender ? `, ${bill.patients.gender}` : ''}</p>}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{
                        display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: '8pt', fontWeight: 600, fontFamily: 'Arial, sans-serif',
                        background: bill.payment_status === 'paid' ? '#D6E6DC' : bill.payment_status === 'partial' ? 'rgba(212,168,67,0.2)' : '#fee2e2',
                        color: bill.payment_status === 'paid' ? '#1A3D2B' : bill.payment_status === 'partial' ? '#9A7820' : '#b91c1c',
                    }}>
                        {bill.payment_status.charAt(0).toUpperCase() + bill.payment_status.slice(1)}
                    </span>
                </div>
            </div>

            {/* Items table */}
            <div style={{ padding: '18px 28px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #EDE7DC' }}>
                            {['#', 'Description', 'Qty', 'Rate (₹)', 'GST', 'Total (₹)'].map((h, i) => (
                                <th key={h} style={{
                                    padding: '6px 8px 6px 0', textAlign: i >= 2 ? 'center' : 'left',
                                    fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase',
                                    letterSpacing: '1px', color: '#888', fontWeight: 600,
                                    ...(i === 5 ? { textAlign: 'right' } : {}),
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(bill.bill_items ?? []).map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #F5F1EB' }}>
                                <td style={{ padding: '8px 8px 8px 0', fontSize: '8pt', color: '#aaa', width: 20 }}>{idx + 1}</td>
                                <td style={{ padding: '8px 8px 8px 0' }}>
                                    <p style={{ margin: 0, fontSize: '9.5pt', fontWeight: 600 }}>{item.name}</p>
                                    <p style={{ margin: 0, fontSize: '7.5pt', color: '#888', fontFamily: 'Arial, sans-serif', textTransform: 'capitalize' }}>{item.item_type}</p>
                                </td>
                                <td style={{ padding: '8px 8px 8px 0', fontSize: '9pt', textAlign: 'center', color: '#555' }}>{item.quantity}</td>
                                <td style={{ padding: '8px 8px 8px 0', fontSize: '9pt', fontFamily: 'Courier, monospace', textAlign: 'center' }}>₹{fmt(item.unit_price)}</td>
                                <td style={{ padding: '8px 8px 8px 0', fontSize: '8pt', color: '#888', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                                    {item.gst_applicable ? `${item.gst_rate}%` : 'Nil'}
                                    <br /><span style={{ fontFamily: 'Courier, monospace' }}>+₹{fmt(item.gst_amount)}</span>
                                </td>
                                <td style={{ padding: '8px 0', fontSize: '9.5pt', fontWeight: 700, textAlign: 'right', fontFamily: 'Courier, monospace' }}>₹{fmt(item.line_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div style={{ padding: '12px 28px 16px', background: '#FAF8F5', borderTop: '1px solid #EDE7DC' }}>
                <div style={{ maxWidth: 260, marginLeft: 'auto' }}>
                    {[
                        { label: 'Subtotal', value: `₹${fmt(bill.subtotal)}`, show: true },
                        { label: 'GST', value: `+₹${fmt(totalGst)}`, show: totalGst > 0 },
                        { label: `Discount (${bill.discount_type === 'percentage' ? bill.discount_value + '%' : 'flat'})`, value: `-₹${fmt(bill.discount_amount)}`, show: bill.discount_amount > 0, color: '#b91c1c' },
                    ].filter(r => r.show).map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '9pt', color: r.color ?? '#666', fontFamily: 'Arial, sans-serif' }}>
                            <span>{r.label}</span><span style={{ fontFamily: 'Courier, monospace' }}>{r.value}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px', borderTop: '2px solid #1A3D2B', fontSize: '12pt', fontWeight: 700, color: '#1A3D2B' }}>
                        <span>Total</span><span style={{ fontFamily: 'Courier, monospace' }}>₹{fmt(bill.total_amount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '9pt', color: '#555', fontFamily: 'Arial, sans-serif' }}>
                        <span>Amount Paid</span><span style={{ fontFamily: 'Courier, monospace' }}>₹{fmt(totalPaid)}</span>
                    </div>
                    {balance > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '9pt', fontWeight: 700, color: '#b91c1c', fontFamily: 'Arial, sans-serif' }}>
                            <span>Balance Due</span><span style={{ fontFamily: 'Courier, monospace' }}>₹{fmt(balance)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* GST breakdown */}
            {(bill.gst_breakdown ?? []).length > 0 && (
                <div style={{ padding: '10px 28px', borderTop: '1px solid #EDE7DC' }}>
                    <p style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', margin: '0 0 6px' }}>GST Summary</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', fontFamily: 'Arial, sans-serif' }}>
                        <thead>
                            <tr style={{ color: '#666' }}>
                                {['Rate', 'Taxable Amount', 'GST Amount'].map(h => <th key={h} style={{ padding: '3px 8px 3px 0', textAlign: 'left', fontWeight: 600 }}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {bill.gst_breakdown!.map((g, i) => (
                                <tr key={i}>
                                    <td style={{ padding: '3px 8px 3px 0' }}>{g.rate}%</td>
                                    <td style={{ padding: '3px 8px 3px 0', fontFamily: 'Courier, monospace' }}>₹{fmt(g.taxable_amount)}</td>
                                    <td style={{ padding: '3px 0', fontFamily: 'Courier, monospace' }}>₹{fmt(g.gst_amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Payment history */}
            {bill.payments.length > 0 && (
                <div style={{ padding: '10px 28px', borderTop: '1px solid #EDE7DC' }}>
                    <p style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', margin: '0 0 6px' }}>Payment History</p>
                    {bill.payments.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '8.5pt', fontFamily: 'Arial, sans-serif', color: '#555' }}>
                            <span style={{ textTransform: 'capitalize' }}>{p.payment_mode} · {fmtDate(p.payment_date)}{p.reference_number ? ` · Ref #${p.reference_number}` : ''}</span>
                            <span style={{ fontFamily: 'Courier, monospace', fontWeight: 600, color: '#1A3D2B' }}>₹{fmt(p.amount)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Notes */}
            {bill.notes && (
                <div style={{ padding: '10px 28px', borderTop: '1px solid #EDE7DC' }}>
                    <p style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', margin: '0 0 6px' }}>Notes</p>
                    <p style={{ fontSize: '8.5pt', color: '#555', margin: 0 }}>{bill.notes}</p>
                </div>
            )}

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid #EDE7DC', background: '#FAF8F5', textAlign: 'center', marginTop: 'auto' }}>
                <p style={{ fontSize: '8pt', color: '#aaa', fontFamily: 'Arial, sans-serif', margin: 0 }}>
                    Thank you for choosing {clinic.clinic_name}. This is a computer-generated invoice.
                </p>
            </div>
        </div>
    )
}
