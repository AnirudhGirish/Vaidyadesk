'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'

export default function PatientSearchInput({ defaultValue }: { defaultValue?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const [value, setValue] = useState(defaultValue ?? '')

    const pushSearch = useCallback((q: string) => {
        const params = new URLSearchParams()
        if (q) params.set('search', q)
        params.set('page', '1')
        router.push(`${pathname}?${params.toString()}`)
    }, [router, pathname])

    useEffect(() => {
        const id = setTimeout(() => pushSearch(value), 300)
        return () => clearTimeout(id)
    }, [value, pushSearch])

    return (
        <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(44,44,44,0.4)' }} />
            <input
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Search by name, phone, or UHID..."
                className="input-base pl-10 pr-10"
                aria-label="Search patients"
            />
            {value && (
                <button
                    onClick={() => { setValue(''); pushSearch('') }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                    <X className="w-4 h-4" style={{ color: 'rgba(44,44,44,0.4)' }} />
                </button>
            )}
        </div>
    )
}
