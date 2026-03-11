import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/middleware/auth'
import { requireRole } from '@/lib/middleware/role'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/response'
import type { Database } from '@/types/database'

function adminClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

/**
 * GET /api/staff
 * List all staff profiles (doctor only)
 */
export async function GET() {
    const auth = await requireAuth()
    if (auth instanceof Response) return auth
    const forbidden = requireRole(auth, 'doctor')
    if (forbidden) return forbidden

    const { data, error } = await adminClient()
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false })

    if (error) return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch staff', 500)
    return successResponse(data)
}

/**
 * PUT /api/staff/[id]
 * Update a staff member's role (doctor only)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PUT(request: NextRequest) {
    return errorResponse(ErrorCodes.NOT_FOUND, 'Use /api/staff/[id] route', 404)
}
