// import { createAuthClient } from "@/lib/supabase/auth";
// import { createServiceClient } from "@/lib/supabase/server";
// import { NextRequest, NextResponse } from "next/server";

// /* eslint-disable @typescript-eslint/no-explicit-any */

// /**
//  * OAuth Callback Handler
//  *
//  * Handles Google OAuth callback after successful authentication.
//  * Creates user profile if first login.
//  * Redirects based on user role.
//  */
// export async function GET(request: NextRequest) {
//   const requestUrl = new URL(request.url);
//   const origin = requestUrl.origin;

//   // Check for code in query params (Authorization Code flow)
//   const code = requestUrl.searchParams.get("code");

//   // If no code in query params, check for access_token in hash (Implicit flow)
//   // This handles the case where Supabase returns token in URL fragment
//   if (!code && requestUrl.hash) {
//     const hashParams = new URLSearchParams(requestUrl.hash.substring(1));
//     const accessToken = hashParams.get("access_token");

//     if (accessToken) {
//       // For implicit flow, we need to set the session manually
//       const auth = await createAuthClient();

//       // Extract token info from hash
//       const refreshToken = hashParams.get("refresh_token");

//       if (refreshToken) {
//         // Set the session using the tokens from hash
//         const { error: sessionError } = await auth.auth.setSession({
//           access_token: accessToken,
//           refresh_token: refreshToken,
//         });

//         if (sessionError) {
//           console.error("Session error:", sessionError);
//           return NextResponse.redirect(`${origin}/login?error=session_failed`);
//         }

//         // Now get the session
//         const {
//           data: { session },
//           error: getSessionError,
//         } = await auth.auth.getSession();

//         if (getSessionError || !session) {
//           console.error("Get session error:", getSessionError);
//           return NextResponse.redirect(`${origin}/login?error=auth_failed`);
//         }

//         return handleSession(session, origin);
//       }
//     }
//   }

//   if (!code) {
//     console.error("No code found in URL. Hash:", requestUrl.hash);
//     return NextResponse.redirect(`${origin}/login?error=no_code`);
//   }

//   try {
//     const auth = await createAuthClient();
//     const { data, error } = await auth.auth.exchangeCodeForSession(code);

//     if (error || !data.session) {
//       console.error("Exchange code error:", error);
//       return NextResponse.redirect(`${origin}/login?error=auth_failed`);
//     }

//     return handleSession(data.session, origin);
//   } catch (err) {
//     console.error("Callback error:", err);
//     return NextResponse.redirect(`${origin}/login?error=auth_failed`);
//   }
// }

// async function handleSession(session: any, origin: string) {
//   const db = createServiceClient();

//   // Check if profile exists
//   const { data: profile } = await db
//     .from("profiles")
//     .select("id, role")
//     .eq("id", session.user.id)
//     .single();

//   if (!profile) {
//     // Create profile on first login — default role is frontdesk
//     // Doctor must be manually set in Supabase by admin
//     await db.from("profiles").insert({
//       id: session.user.id,
//       role: "frontdesk",
//       full_name: (session.user.user_metadata as any)?.full_name ?? "User",
//       email: session.user.email ?? "",
//     } as any);
//     return NextResponse.redirect(`${origin}/frontdesk/dashboard`);
//   }

//   const userProfile = profile as { role: string };
//   const redirectPath =
//     userProfile.role === "doctor"
//       ? "/doctor/dashboard"
//       : "/frontdesk/dashboard";
//   return NextResponse.redirect(`${origin}${redirectPath}`);
// }

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/auth/callback`);
}
