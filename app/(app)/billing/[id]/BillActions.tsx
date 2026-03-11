'use client'
import { useState } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal'
import { BillPrintA4 } from '@/components/print/BillPrintA4'
import type { BillPrintData, ClinicInfo } from '@/components/print/BillPrintA4'

interface BillActionsProps {
    billId: string
    billNumber: string
    bill: BillPrintData
    clinic: ClinicInfo
}

export default function BillActions({ billId, billNumber, bill, clinic }: BillActionsProps) {
    const [showPreview, setShowPreview] = useState(false)
    void billId

    return (
        <>
            <div className="flex gap-2">
                <Button
                    variant="secondary"
                    icon={<Printer className="w-4 h-4" />}
                    onClick={() => setShowPreview(true)}
                    size="sm"
                >
                    Print {billNumber}
                </Button>
            </div>

            {showPreview && (
                <PrintPreviewModal
                    title={`Tax Invoice — ${billNumber}`}
                    onClose={() => setShowPreview(false)}
                >
                    <BillPrintA4 bill={bill} clinic={clinic} />
                </PrintPreviewModal>
            )}
        </>
    )
}
