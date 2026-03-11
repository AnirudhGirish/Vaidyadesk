'use client'
import { useState } from 'react'
import { Printer } from 'lucide-react'
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal'
import { PrescriptionPrintA4 } from '@/components/print/PrescriptionPrintA4'
import type { PrescriptionPrintData, ClinicInfo } from '@/components/print/PrescriptionPrintA4'

interface PrescriptionPrintButtonProps {
    visitId: string
    visitDate: string
    patientId: string
}

export function PrescriptionPrintButton({ visitId, visitDate, patientId }: PrescriptionPrintButtonProps) {
    const [showPreview, setShowPreview] = useState(false)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<{ prescription: PrescriptionPrintData; clinic: ClinicInfo } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleOpen = async () => {
        if (data) { setShowPreview(true); return }
        setLoading(true)
        setError(null)
        try {
            const [prescRes, visitRes, settingsRes, sessionRes] = await Promise.all([
                fetch(`/api/visits/${visitId}/prescription`),
                fetch(`/api/visits/${visitId}`),
                fetch('/api/settings'),
                fetch('/api/auth/session'),
            ])

            if (!prescRes.ok && prescRes.status !== 404) throw new Error('Failed to load prescription')

            const [prescJson, visitJson, settingsJson, sessionJson] = await Promise.all([
                prescRes.json(),
                visitRes.json(),
                settingsRes.json(),
                sessionRes.json(),
            ])

            const presc = prescJson.success ? prescJson.data : null
            const visit = visitJson.success ? visitJson.data : null
            const settings = settingsJson.success ? settingsJson.data : null
            const session = sessionJson

            const clinic: ClinicInfo = {
                clinic_name: settings?.clinic_name ?? "Dr. Shetty's Ayur Clinic",
                address: settings?.address ?? '',
                phone: settings?.phone ?? '',
                gst_number: settings?.gst_number ?? '',
            }

            const prescription: PrescriptionPrintData = {
                visit_id: visitId,
                visit_date: visitDate,
                chief_complaint: visit?.chief_complaint ?? '',
                medicines: presc?.medicines ?? [],
                treatment_notes: presc?.treatment_notes ?? '',
                diet_advice: presc?.diet_advice ?? '',
                lifestyle_advice: presc?.lifestyle_advice ?? '',
                follow_up_notes: presc?.follow_up_notes ?? '',
                patient: {
                    full_name: visit?.patients?.full_name ?? '',
                    uhid: visit?.patients?.uhid ?? '',
                    phone: '',
                    date_of_birth: visit?.patients?.date_of_birth ?? '',
                    gender: visit?.patients?.gender ?? '',
                },
                doctor: {
                    full_name: session?.full_name ?? session?.email?.split('@')[0] ?? 'Doctor',
                    signature_url: session?.signature_url ?? undefined,
                },
            }

            setData({ prescription, clinic })
            setShowPreview(true)
        } catch {
            setError('Failed to load prescription')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={handleOpen}
                disabled={loading}
                title="Print Prescription"
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 6, border: '1px solid var(--color-warm-300)',
                    background: 'white', cursor: loading ? 'wait' : 'pointer',
                    fontSize: '11px', color: 'var(--color-forest-700)',
                    fontFamily: 'var(--font-sans)', fontWeight: 500,
                    transition: 'all 0.15s',
                }}
            >
                <Printer style={{ width: 12, height: 12 }} />
                {loading ? 'Loading…' : 'Rx'}
            </button>
            {error && <span style={{ fontSize: '11px', color: '#b91c1c', marginLeft: 4 }}>{error}</span>}

            {showPreview && data && (
                <PrintPreviewModal
                    title={`Prescription — ${new Date(visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    onClose={() => setShowPreview(false)}
                >
                    <PrescriptionPrintA4 prescription={data.prescription} clinic={data.clinic} />
                </PrintPreviewModal>
            )}
        </>
    )
}
