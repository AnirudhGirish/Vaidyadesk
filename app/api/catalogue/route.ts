/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { successResponse, errorResponse, ErrorCodes } from "@/lib/utils/response";

/**
 * GET /api/catalogue
 * Combined search across both catalogue_services and catalogue_medicines.
 * Used by billing/new and catalogue page for live search + full listing.
 * Query params: search, category, per_page, active_only
 */
export async function GET(request: NextRequest) {
    const auth = await requireAuth();
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const perPage = Math.min(parseInt(searchParams.get("per_page") ?? "50"), 200);
    const activeOnly = searchParams.get("active_only") !== "false";

    const db = createServiceClient();

    // --- Services ---
    let svcQuery = (db as any)
        .from("catalogue_services")
        .select("id, name, description, category, base_price, gst_applicable, gst_rate, duration_type, package_days, is_active")
        .order("name", { ascending: true })
        .limit(perPage);

    if (activeOnly) svcQuery = svcQuery.eq("is_active", true);
    if (search) svcQuery = svcQuery.ilike("name", `%${search}%`);
    if (category) svcQuery = svcQuery.eq("category", category);

    // --- Medicines ---
    let medQuery = (db as any)
        .from("catalogue_medicines")
        .select("id, name, type, form, unit, price_per_unit, gst_applicable, gst_rate, is_active")
        .order("name", { ascending: true })
        .limit(perPage);

    if (activeOnly) medQuery = medQuery.eq("is_active", true);
    if (search) medQuery = medQuery.ilike("name", `%${search}%`);

    const [{ data: services, error: svcErr }, { data: medicines, error: medErr }] =
        await Promise.all([svcQuery, medQuery]);

    if (svcErr || medErr) {
        console.error("Catalogue fetch error:", svcErr ?? medErr);
        return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch catalogue", 500);
    }

    // Normalize into unified shape
    const svcItems = ((services as any[]) ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category ?? "service",
        item_type: "service" as const,
        base_price: Number(s.base_price),
        unit: s.duration_type === "package" ? `${s.package_days ?? 1}-day pkg` : "session",
        gst_applicable: Boolean(s.gst_applicable),
        gst_rate: Number(s.gst_rate ?? 0),
        is_active: Boolean(s.is_active),
    }));

    const medItems = ((medicines as any[]) ?? []).map((m: any) => ({
        id: m.id,
        name: m.name,
        category: m.type ?? "medicine",
        item_type: "medicine" as const,
        base_price: Number(m.price_per_unit ?? 0),
        unit: m.unit ?? "unit",
        gst_applicable: Boolean(m.gst_applicable),
        gst_rate: Number(m.gst_rate ?? 0),
        is_active: Boolean(m.is_active),
    }));

    // Merge, filter by search (in case filter not fully applied above), sort
    let combined = [...svcItems, ...medItems];
    if (search) {
        const q = search.toLowerCase();
        combined = combined.filter((i) => i.name.toLowerCase().includes(q));
    }
    combined.sort((a, b) => a.name.localeCompare(b.name));

    return successResponse(combined.slice(0, perPage), {
        total: combined.length,
        page: 1,
        per_page: perPage,
    });
}
