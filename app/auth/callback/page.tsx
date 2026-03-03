"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/login?error=auth_failed");
        return;
      }

      const res = await fetch("/api/auth/session");
      const data = await res.json();

      if (!res.ok || !data.success) {
        router.push("/login?error=profile_failed");
        return;
      }

      router.push(
        data.data.role === "doctor"
          ? "/doctor/dashboard"
          : "/frontdesk/dashboard",
      );
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Dr Shetty&apos;s Ayur Clinic
        </h2>
        <p className="text-gray-500 text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
