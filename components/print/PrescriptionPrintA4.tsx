export interface MedicineItem {
    medicine_id?: string;
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
}

export interface PrescriptionPrintData {
    visit_id: string;
    visit_date: string;
    chief_complaint?: string;
    medicines: MedicineItem[];
    treatment_notes?: string;
    diet_advice?: string;
    lifestyle_advice?: string;
    follow_up_notes?: string;
    patient: {
        full_name: string;
        uhid: string;
        phone?: string;
        date_of_birth?: string;
        gender?: string;
    };
    doctor: {
        full_name: string;
        signature_url?: string;
    };
}

export interface ClinicInfo {
    clinic_name: string;
    address?: string;
    phone?: string;
    email?: string;
    gst_number?: string;
}

function calcAge(dob?: string) {
    if (!dob) return null
    const birth = new Date(dob); const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
    return age
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function PrescriptionPrintA4({ prescription, clinic }: { prescription: PrescriptionPrintData; clinic: ClinicInfo }) {
    const age = calcAge(prescription.patient?.date_of_birth)

    return (
        <div className="print-template" style={{
            width: '210mm', minHeight: '270mm', margin: '0 auto',
            fontFamily: 'Georgia, serif', background: 'white', color: '#1a1a1a',
            fontSize: '10pt', lineHeight: 1.5, padding: '0', position: 'relative',
        }}>
            {/* Clinic Header */}
            <div style={{ background: '#1A3D2B', color: 'white', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontSize: '7pt', letterSpacing: '2px', color: 'rgba(255,255,255,0.55)', marginBottom: 4, fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>Prescription</p>
                    <h1 style={{ fontSize: '17pt', fontWeight: 700, margin: '0 0 3px 0', letterSpacing: '-0.5px' }}>{clinic.clinic_name}</h1>
                    {clinic.address && <p style={{ fontSize: '8pt', color: 'rgba(255,255,255,0.65)', margin: 0, fontFamily: 'Arial, sans-serif' }}>{clinic.address}{clinic.phone ? ` · ${clinic.phone}` : ''}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '8pt', color: 'rgba(255,255,255,0.65)', margin: 0, fontFamily: 'Arial, sans-serif' }}>Date</p>
                    <p style={{ fontSize: '10pt', fontWeight: 600, margin: '2px 0 0', fontFamily: 'Arial, sans-serif' }}>{fmtDate(prescription.visit_date)}</p>
                </div>
            </div>

            {/* Patient strip */}
            <div style={{ background: '#FAF8F5', padding: '12px 28px', borderBottom: '1px solid #EDE7DC', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div>
                    <p style={{ fontSize: '6.5pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888', margin: '0 0 3px' }}>Patient</p>
                    <p style={{ fontSize: '11pt', fontWeight: 700, margin: '0 0 2px' }}>{prescription.patient.full_name}</p>
                    <span style={{ fontSize: '7.5pt', fontFamily: 'Courier, monospace', color: '#666', background: '#EDE7DC', padding: '1px 8px', borderRadius: 3 }}>{prescription.patient.uhid}</span>
                </div>
                <div>
                    {age !== null && <p style={{ fontSize: '8.5pt', color: '#555', fontFamily: 'Arial, sans-serif', margin: 0 }}><strong>Age:</strong> {age} yrs{prescription.patient.gender ? `, ${prescription.patient.gender}` : ''}</p>}
                    {prescription.patient.phone && <p style={{ fontSize: '8.5pt', color: '#555', fontFamily: 'Arial, sans-serif', margin: '2px 0 0' }}><strong>Ph:</strong> {prescription.patient.phone}</p>}
                </div>
                {prescription.chief_complaint && (
                    <div>
                        <p style={{ fontSize: '6.5pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888', margin: '0 0 3px' }}>Chief Complaint</p>
                        <p style={{ fontSize: '9pt', fontStyle: 'italic', color: '#444', margin: 0 }}>{prescription.chief_complaint}</p>
                    </div>
                )}
            </div>

            {/* Body */}
            <div style={{ padding: '18px 28px' }}>
                {/* Rx symbol */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: '24pt', fontWeight: 900, color: '#1A3D2B', lineHeight: 1 }}>℞</span>
                    <div style={{ flex: 1, height: 1, background: '#EDE7DC' }} />
                </div>

                {/* Medicines table */}
                {prescription.medicines.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #1A3D2B' }}>
                                {['#', 'Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions'].map((h, i) => (
                                    <th key={h} style={{
                                        padding: '5px 8px 5px 0', textAlign: 'left',
                                        fontSize: '7pt', fontFamily: 'Arial, sans-serif',
                                        textTransform: 'uppercase', letterSpacing: '1px',
                                        color: '#888', fontWeight: 600,
                                        width: i === 0 ? 20 : i === 1 ? '30%' : 'auto',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {prescription.medicines.map((med, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #F5F1EB' }}>
                                    <td style={{ padding: '8px 8px 8px 0', fontSize: '8pt', color: '#aaa' }}>{idx + 1}</td>
                                    <td style={{ padding: '8px 8px 8px 0' }}>
                                        <p style={{ margin: 0, fontSize: '9.5pt', fontWeight: 700 }}>{med.name}</p>
                                    </td>
                                    <td style={{ padding: '8px 8px 8px 0', fontSize: '9pt', color: '#444', fontFamily: 'Arial, sans-serif' }}>{med.dosage ?? '—'}</td>
                                    <td style={{ padding: '8px 8px 8px 0', fontSize: '9pt', color: '#444', fontFamily: 'Arial, sans-serif' }}>{med.frequency ?? '—'}</td>
                                    <td style={{ padding: '8px 8px 8px 0', fontSize: '9pt', color: '#444', fontFamily: 'Arial, sans-serif' }}>{med.duration ?? '—'}</td>
                                    <td style={{ padding: '8px 0', fontSize: '8.5pt', color: '#666', fontStyle: 'italic', fontFamily: 'Arial, sans-serif' }}>{med.instructions ?? ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ fontSize: '9pt', color: '#aaa', fontStyle: 'italic', fontFamily: 'Arial, sans-serif', marginBottom: 18 }}>No medicines prescribed.</p>
                )}

                {/* Treatment notes */}
                {prescription.treatment_notes && (
                    <div style={{ marginBottom: 14, padding: '10px 14px', background: '#FAF8F5', borderLeft: '3px solid #1A3D2B', borderRadius: '0 4px 4px 0' }}>
                        <p style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', margin: '0 0 5px' }}>Treatment Notes</p>
                        <p style={{ fontSize: '9pt', color: '#333', margin: 0, whiteSpace: 'pre-wrap' }}>{prescription.treatment_notes}</p>
                    </div>
                )}

                {/* Advice row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    {prescription.diet_advice && (
                        <div style={{ padding: '10px 14px', background: '#F0F5F2', borderRadius: 6 }}>
                            <p style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', color: '#2D6A4F', margin: '0 0 5px', fontWeight: 700 }}>🌿 Diet Advice</p>
                            <p style={{ fontSize: '8.5pt', color: '#333', margin: 0, whiteSpace: 'pre-wrap' }}>{prescription.diet_advice}</p>
                        </div>
                    )}
                    {prescription.lifestyle_advice && (
                        <div style={{ padding: '10px 14px', background: '#FFF8E1', borderRadius: 6 }}>
                            <p style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', color: '#9A7820', margin: '0 0 5px', fontWeight: 700 }}>☀️ Lifestyle</p>
                            <p style={{ fontSize: '8.5pt', color: '#333', margin: 0, whiteSpace: 'pre-wrap' }}>{prescription.lifestyle_advice}</p>
                        </div>
                    )}
                </div>

                {/* Follow-up */}
                {prescription.follow_up_notes && (
                    <div style={{ marginBottom: 14, padding: '8px 14px', background: '#EDE7DC', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '14pt' }}>📅</span>
                        <div>
                            <p style={{ fontSize: '7pt', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', margin: 0 }}>Follow-up</p>
                            <p style={{ fontSize: '9pt', fontWeight: 600, color: '#1A3D2B', margin: 0 }}>{prescription.follow_up_notes}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Signature footer */}
            <div style={{ padding: '14px 28px', borderTop: '1px solid #EDE7DC', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'center', minWidth: 160 }}>
                    {prescription.doctor.signature_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={prescription.doctor.signature_url}
                            alt="Doctor signature"
                            style={{ height: 50, maxWidth: 160, objectFit: 'contain', marginBottom: 4 }}
                        />
                    ) : (
                        <div style={{ height: 50, borderBottom: '1.5px solid #1A3D2B', marginBottom: 4, width: 160 }} />
                    )}
                    <p style={{ fontSize: '9pt', fontWeight: 700, margin: '3px 0 0', fontFamily: 'Arial, sans-serif' }}>Dr. {prescription.doctor.full_name}</p>
                    <p style={{ fontSize: '7.5pt', color: '#888', margin: 0, fontFamily: 'Arial, sans-serif' }}>Ayurvedic Physician</p>
                </div>
            </div>

            {/* Bottom note */}
            <div style={{ padding: '8px 28px 14px', textAlign: 'center' }}>
                <p style={{ fontSize: '7.5pt', color: '#bbb', fontFamily: 'Arial, sans-serif', margin: 0 }}>
                    This prescription is valid for 30 days. Computer-generated from {clinic.clinic_name}.
                </p>
            </div>
        </div>
    )
}
