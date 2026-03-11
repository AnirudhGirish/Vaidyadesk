import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware or proxy
 *
 * Protects routes and handles session management.
 * - Redirects unauthenticated users to login
 * - Returns 401 for unauthorized API requests
 * - Handles session refresh
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/login" ||
    path === "/auth/callback" ||
    path === "/auth/redirect" ||
    path.startsWith("/api/auth") ||
    path === "/" ||
    path.startsWith("/_next") ||
    path.includes("favicon") ||
    path.startsWith("/auth/") ||
    path === "/privacy" ||
    path === "/terms";

  const isApiPath = path.startsWith("/api/");

  // Redirect to login if not authenticated and not a public path
  if (!session && !isPublicPath) {
    if (isApiPath) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login page
  if (session && path === "/login") {
    return NextResponse.redirect(new URL("/auth/redirect", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
