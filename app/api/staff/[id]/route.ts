import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/middleware/auth'
import { requireRole } from '@/lib/middleware/role'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/response'
import type { Database } from '@/types/database'

interface RouteParams { params: Promise<{ id: string }> }

function adminClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

const UpdateStaffSchema = z.object({
    role: z.enum(['doctor', 'frontdesk']),
    full_name: z.string().optional(),
})

/**
 * PUT /api/staff/[id]
 * Change a staff member's role (doctor only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await requireAuth()
    if (auth instanceof Response) return auth
    const forbidden = requireRole(auth, 'doctor')
    if (forbidden) return forbidden

    const { id } = await params

    let body: unknown
    try { body = await request.json() }
    catch { return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid JSON', 400) }

    const result = UpdateStaffSchema.safeParse(body)
    if (!result.success) return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', 422)

    const { data, error } = await adminClient()
        .from('profiles')
        .update(result.data as never)
        .eq('id', id)
        .select()
        .single()

    if (error || !data) return errorResponse(ErrorCodes.NOT_FOUND, 'Staff member not found', 404)
    return successResponse(data)
}
