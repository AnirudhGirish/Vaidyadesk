/**
 * lib/utils/format.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all display-formatting utilities.
 * Import from here instead of defining locally in pages/components.
 */

/**
 * Calculate age in years from a date-of-birth string (YYYY-MM-DD or ISO).
 * Returns null if dob is not provided.
 */
export function calcAge(dob?: string | null): number | null {
    if (!dob) return null
    const birth = new Date(dob)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    if (
        now.getMonth() < birth.getMonth() ||
        (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
    ) {
        age--
    }
    return age
}

/**
 * Format a date string or Date object for display (e.g. "11 Mar 2026").
 * Uses en-IN locale by default.
 */
export function formatDate(
    d: string | Date,
    options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', options)
}

/**
 * Short date format: "11 Mar 2026" (default) or "11 Mar" (month + day).
 */
export function formatDateShort(d: string | Date): string {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Format a number as Indian Rupees: ₹1,23,456
 */
export function formatCurrency(amount: number | null | undefined): string {
    return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(amount ?? 0))
}

/**
 * Format a number with exactly 2 decimal places.
 * Useful for bill line-item amounts: fmt(123.4) → "123.40"
 */
export function fmt(n: number | null | undefined): string {
    return (n ?? 0).toFixed(2)
}

/**
 * Format a datetime string as a locale datetime string.
 * e.g. "11 Mar 2026, 02:30 PM"
 */
export function formatDateTime(d: string | Date): string {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    })
}
