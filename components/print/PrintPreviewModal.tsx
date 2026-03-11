'use client'
import { useEffect, useRef } from 'react'
import { Printer, X } from 'lucide-react'

interface PrintPreviewModalProps {
    title?: string
    onClose: () => void
    children: React.ReactNode
}

export function PrintPreviewModal({ title = 'Print Preview', onClose, children }: PrintPreviewModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    // Prevent body scroll while open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const handlePrint = () => {
        // Open a fresh window with just the print content — avoids every
        // CSS-specificity fight with the parent page's @media print rules.
        const printWindow = window.open('', '_blank', 'width=900,height=700')
        if (!printWindow) return

        const html = contentRef.current?.innerHTML ?? ''

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: white; font-family: Georgia, serif; }
    @page { margin: 0; size: A4; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>${html}</body>
</html>`)
        printWindow.document.close()
        // Small delay to let fonts/images settle before print dialog
        setTimeout(() => {
            printWindow.focus()
            printWindow.print()
            printWindow.close()
        }, 300)
    }

    return (
        <div
            ref={overlayRef}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.65)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center',
                overflowY: 'auto',
                padding: '24px 16px',
            }}
            onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        >
            {/* Toolbar */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 10,
                width: '100%', maxWidth: 820,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', marginBottom: 16,
                background: '#1A3D2B', borderRadius: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
                <p style={{ color: 'white', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{title}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={handlePrint}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 16px', borderRadius: 7,
                            background: '#B8922A', border: 'none', color: 'white',
                            fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        <Printer style={{ width: 15, height: 15 }} /> Print
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 34, height: 34, borderRadius: 7,
                            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                            cursor: 'pointer',
                        }}
                        aria-label="Close"
                    >
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>
            </div>

            {/* Paper preview */}
            <div
                style={{
                    boxShadow: '0 8px 40px rgba(0,0,0,0.4)', borderRadius: 4,
                    overflow: 'hidden', width: '100%', maxWidth: 794,
                }}
            >
                {/* Capture this div's innerHTML for print */}
                <div ref={contentRef}>
                    {children}
                </div>
            </div>
        </div>
    )
}
