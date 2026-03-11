import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * GET /auth/callback
 *
 * Supabase redirects here after OAuth login with ?code=...
 * We exchange the code for a session (setting session cookies server-side),
 * then redirect to the correct dashboard based on the user's role.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const cookieStore = await cookies()

    // Anon client for code exchange — sets session cookies on the response
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        )
                    } catch { /* ignore from Server Route context */ }
                },
            },
        },
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    // Use service role client for profiles lookup.
    // The profiles RLS policy has infinite recursion when accessed via anon key,
    // so we bypass RLS here. This is safe — user identity is already confirmed above.
    const adminClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: profileData, error: profileError } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single()

    const profile = profileData as { role: string | null } | null

    if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError)
        return NextResponse.redirect(`${origin}/login?error=profile_failed`)
    }

    // Profile doesn't exist OR role not yet assigned — show pending access page
    if (!profile || !profile.role) {
        return NextResponse.redirect(`${origin}/login?error=no_access`)
    }

    // Redirect based on role
    const roleMap: Record<string, string> = {
        doctor: '/doctor/dashboard',
        frontdesk: '/frontdesk/dashboard',
    }

    return NextResponse.redirect(`${origin}${roleMap[profile.role] ?? next}`)
}
