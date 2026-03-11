import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * POST /api/auth/logout
 *
 * Signs out the current user from Supabase and clears session cookies.
 */
export async function POST(request: NextRequest) {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        )
                    } catch { /* ignore */ }
                },
            },
        },
    )

    await supabase.auth.signOut()

    const origin = new URL(request.url).origin
    const response = NextResponse.redirect(`${origin}/login`, { status: 303 })

    // Explicitly expire all Supabase auth cookies
    for (const cookie of cookieStore.getAll()) {
        if (cookie.name.startsWith('sb-')) {
            response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
        }
    }

    return response
}
